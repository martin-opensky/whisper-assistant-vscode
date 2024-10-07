import * as vscode from 'vscode';
import { exec, ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import WebSocket from 'ws';

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
  private socket: WebSocket | null = null;
  private _isRecording: boolean = false;
  private recordingStartTime: number | undefined;

  constructor(
    private outputChannel: vscode.OutputChannel,
    private statusBarItem: vscode.StatusBarItem,
  ) {}

  async checkIfInstalled(command: string): Promise<boolean> {
    try {
      await execAsync(`${command} --help`);
      return true;
    } catch (error) {
      return false;
    }
  }

  get isRecording(): boolean {
    return this._isRecording;
  }

  startRecording(): void {
    if (this.isRecording) {
      return;
    }

    this._isRecording = true;
    this.recordingStartTime = Date.now();
    this.updateStatusBarItem();

    const tmpDir = os.tmpdir();
    // const outputFile = path.join(tmpDir, `${this.fileName}.wav`);

    this.socket = new WebSocket('ws://localhost:8765');

    this.socket.onmessage = (event: WebSocket.MessageEvent) => {
      const result = JSON.parse(event.data.toString());
      if (result.text) {
        vscode.window.activeTextEditor?.edit((editBuilder) => {
          const position = vscode.window.activeTextEditor?.selection.active;
          if (position) {
            editBuilder.insert(position, result.text + ' ');
          }
        });
      }
    };

    // Start audio recording using SoX
    this.recordingProcess = spawn('sox', [
      '-d',
      '-t',
      'raw',
      '-r',
      '16000',
      '-b',
      '16',
      '-c',
      '1',
      '-',
    ]);

    this.recordingProcess.stdout?.on('data', (data) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      }
    });

    this.recordingProcess.stderr?.on('data', (data) => {
      this.outputChannel.appendLine(`Whisper Assistant: SoX error: ${data}`);
    });
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.recordingProcess) {
      this.outputChannel.appendLine(
        'Whisper Assistant: No recording process found',
      );
      return;
    }
    this.outputChannel.appendLine('Whisper Assistant: Stopping recording');
    this.recordingProcess.kill();
    this.recordingProcess = null;
    this._isRecording = false;
    this.updateStatusBarItem();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async transcribeRecording(
    model: WhisperModel,
  ): Promise<Transcription | undefined> {
    try {
      const tmpDir = os.tmpdir();
      const inputFile = path.join(tmpDir, `${this.fileName}.wav`);
      const outputFile = path.join(tmpDir, `${this.fileName}.json`);

      this.outputChannel.appendLine(
        `Whisper Assistant: Transcribing recording using '${model}' model`,
      );
      const { stdout, stderr } = await execAsync(
        `whisper ${inputFile} --model ${model} --output_format json --task transcribe --language English --fp16 False --output_dir ${tmpDir}`,
      );
      this.outputChannel.appendLine(
        `Whisper Assistant: Transcription: ${stdout}`,
      );
      return await this.handleTranscription(outputFile);
    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
    }
  }

  private async handleTranscription(
    outputFile: string,
  ): Promise<Transcription | undefined> {
    try {
      const data = await fs.promises.readFile(outputFile, 'utf8');
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
    const tmpDir = os.tmpdir();
    const wavFile = path.join(tmpDir, `${this.fileName}.wav`);
    const jsonFile = path.join(tmpDir, `${this.fileName}.json`);

    if (fs.existsSync(wavFile)) {
      fs.unlinkSync(wavFile);
    }
    if (fs.existsSync(jsonFile)) {
      fs.unlinkSync(jsonFile);
    }
  }

  private updateStatusBarItem(): void {
    if (this.isRecording && this.recordingStartTime !== undefined) {
      const recordingDuration = Math.floor(
        (Date.now() - this.recordingStartTime) / 1000,
      );
      const minutes = Math.floor(recordingDuration / 60);
      const seconds = recordingDuration % 60;
      this.statusBarItem.text = `$(stop) ${minutes}:${
        seconds < 10 ? '0' + seconds : seconds
      }`;
    } else {
      this.statusBarItem.text = `$(quote)`;
    }
  }
}

export default SpeechTranscription;
