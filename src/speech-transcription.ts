import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';
import * as fs from 'fs';
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

export interface Transcription {
  text: string;
  segments: Segment[];
  language: string;
}

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

class SpeechTranscription {
  private fileName: string = 'recording';
  private recordingProcess: ChildProcess | null = null;

  constructor(
    private outputDir: string,
    private outputChannel: vscode.OutputChannel,
  ) {}

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
            this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
            return;
          }
          if (stderr) {
            this.outputChannel.appendLine(
              `Whisper Assistant: SoX process has been killed: ${stderr}`,
            );
            return;
          }
          this.outputChannel.appendLine(`Whisper Assistant: stdout: ${stdout}`);
        },
      );
    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recordingProcess) {
      this.outputChannel.appendLine(
        'Whisper Assistant: No recording process found',
      );
      return;
    }
    this.outputChannel.appendLine('Whisper Assistant: Stopping recording');
    this.recordingProcess.kill();
    this.recordingProcess = null;
  }

  public async transcribeRecording(model: WhisperModel, language: string): Promise<Transcription | undefined> {
    try {
      const config = vscode.workspace.getConfiguration('whisperAssistant');
      const language = config.get<string>('transcriptionLanguage', 'en');

      this.outputChannel.appendLine(
        `Whisper Assistant: Transcribing recording using '${model}' model and '${language}' language`,
      );
      const { stdout, stderr } = await execAsync(
        `whisper ${this.outputDir}/${this.fileName}.wav --model ${model} --output_format json --task transcribe --language ${language} --fp16 False --output_dir ${this.outputDir}`,
      );
      this.outputChannel.appendLine(
        `Whisper Assistant: Transcription: ${stdout}`,
      );
      return await this.handleTranscription();
    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
    }
  }

  private async handleTranscription(): Promise<Transcription | undefined> {
    try {
      const data = await fs.promises.readFile(
        `${this.outputDir}/${this.fileName}.json`,
        'utf8',
      );
      if (!data) {
        this.outputChannel.appendLine(
          'Whisper Assistant: No transcription data found',
        );
        return;
      }
      const transcription: Transcription = JSON.parse(data);
      this.outputChannel.appendLine(`Whisper Assistant: ${transcription.text}`);

      return transcription;
    } catch (err) {
      this.outputChannel.appendLine(
        `Whisper Assistant: Error reading file from disk: ${err}`,
      );
    }
  }

  deleteFiles(): void {
    // Delete files
    fs.unlinkSync(`${this.outputDir}/${this.fileName}.wav`);
    fs.unlinkSync(`${this.outputDir}/${this.fileName}.json`);
  }
}

export default SpeechTranscription;
