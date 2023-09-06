import { exec, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Segment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
}

interface Transcription {
  text: string;
  segments: Segment[];
  language: string;
}

class SpeechTranscription {
  private fileName: string = 'recording';
  private recordingProcess: ChildProcess | null = null;

  constructor(private outputDir: string) {}

  async checkIfInstalled(command: string): Promise<boolean> {
    try {
      await execAsync(`${command} --help`);
      return true;
    } catch (error) {
      return false;
    }
  }

  getOutputDir(): string {
    return this.outputDir;
  }

  startRecording(): void {
    try {
      this.recordingProcess = exec(
        `sox -d -b 16 -e signed -c 1 -r 16k ${this.outputDir}/${this.fileName}.wav`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`error: ${error}`);
            return;
          }
          if (stderr) {
            console.log(`SoX process has been killed: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        },
      );
    } catch (error) {
      console.error(`error: ${error}`);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recordingProcess) {
      console.error('No recording process found');
      return;
    }
    console.log('Stopping recording');
    this.recordingProcess.kill();
    this.recordingProcess = null;
  }

  async transcribeRecording(): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(
        `whisper ${this.outputDir}/${this.fileName}.wav --model base --output_format json --task transcribe --language English --fp16 False --output_dir ${this.outputDir}`,
      );
      await this.handleTranscription();
      console.log(`Transcription: ${stdout}`);
    } catch (error) {
      console.error(`error: ${error}`);
    }
  }

  private async handleTranscription(): Promise<void> {
    try {
      const data = await fs.promises.readFile(
        `${this.outputDir}/${this.fileName}.json`,
        'utf8',
      );
      if (!data) {
        console.error('No transcription data found');
        return;
      }
      const transcription: Transcription = JSON.parse(data);
      console.log(`${transcription.text}`);
      vscode.env.clipboard.writeText(transcription.text).then(() => {
        vscode.commands.executeCommand('editor.action.clipboardPasteAction');
      });
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
    }
  }

  deleteFiles(): void {
    // Delete files
    fs.unlinkSync(`${this.outputDir}/${this.fileName}.wav`);
    fs.unlinkSync(`${this.outputDir}/${this.fileName}.json`);
  }
}

export default SpeechTranscription;
