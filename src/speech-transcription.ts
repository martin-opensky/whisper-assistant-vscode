import * as vscode from 'vscode';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ChildProcess, spawn } from 'child_process';
import WebSocket from 'ws';

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

export default class SpeechTranscription {
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;
  private recordingProcess: ChildProcess | null = null;
  private ws: WebSocket | null = null;
  private tempDir: vscode.Uri;
  private audioFilePath: string | undefined = undefined;

  constructor(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    statusBarItem: vscode.StatusBarItem,
  ) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.statusBarItem = statusBarItem;

    this.tempDir = context.globalStorageUri;
    if (!fs.existsSync(this.tempDir.fsPath)) {
      fs.mkdirSync(this.tempDir.fsPath, { recursive: true });
    }
  }

  async checkIfInstalled(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn(command, ['--version']);
      process.on('error', () => resolve(false));
      process.on('close', (code) => resolve(code === 0));
    });
  }

  async startRecording(): Promise<void> {
    this.outputChannel.appendLine(
      `Starting recording to file: ${this.audioFilePath}`,
    );

    this.generateAudioFilePath();

    // Remove any existing recording file
    if (this.audioFilePath && fs.existsSync(this.audioFilePath)) {
      fs.unlinkSync(this.audioFilePath);
    }

    if (!this.audioFilePath) {
      this.outputChannel.appendLine('Audio file path is undefined');
      return;
    }

    // Start audio recording using SoX without a duration limit
    this.recordingProcess = spawn('sox', [
      '-d',
      '-t',
      'wav',
      '-r',
      '16000',
      '-b',
      '16',
      '-c',
      '1',
      this.audioFilePath,
    ]);

    this.recordingProcess.stderr?.on('data', (data) => {
      this.outputChannel.appendLine(`SoX error: ${data}`);
    });

    this.outputChannel.appendLine('Recording started...');
  }

  async stopRecording(): Promise<void> {
    this.outputChannel.appendLine('Whisper Assistant: Stopping recording');
    if (this.recordingProcess) {
      return new Promise<void>((resolve) => {
        this.recordingProcess?.on('close', () => {
          this.recordingProcess = null;
          this.outputChannel.appendLine('Recording stopped.');

          // Check if the file exists and has content
          if (this.audioFilePath && fs.existsSync(this.audioFilePath)) {
            const stats = fs.statSync(this.audioFilePath);
            this.outputChannel.appendLine(
              `Audio file created. Size: ${stats.size} bytes`,
            );
          } else {
            this.outputChannel.appendLine('Audio file was not created');
          }

          resolve();
        });

        // Send SIGTERM signal to gracefully stop the recording
        this.recordingProcess?.kill('SIGTERM');
      });
    }
  }

  async transcribeRecording(): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      this.outputChannel.appendLine(
        `Attempting to transcribe file: ${this.audioFilePath}`,
      );

      if (!this.audioFilePath) {
        this.outputChannel.appendLine('Audio file path is undefined');
        return reject(new Error('Audio file path is undefined'));
      }

      if (!fs.existsSync(this.audioFilePath)) {
        this.outputChannel.appendLine(
          `Audio file not found: ${this.audioFilePath}`,
        );
        return reject(new Error('Audio file not found'));
      }

      const stats = fs.statSync(this.audioFilePath);
      this.outputChannel.appendLine(`Audio file size: ${stats.size} bytes`);

      this.ws = new WebSocket('ws://localhost:8765');

      this.ws.on('open', () => {
        this.outputChannel.appendLine('WebSocket connection opened');
        if (!this.audioFilePath) {
          this.outputChannel.appendLine('Audio file path is undefined');
          return reject(new Error('Audio file path is undefined'));
        }

        const fileStream = fs.createReadStream(this.audioFilePath);

        fileStream.on('data', (chunk) => {
          this.ws?.send(chunk);
          this.outputChannel.appendLine(
            `Sent chunk of size ${chunk.length} bytes`,
          );
        });

        fileStream.on('end', () => {
          this.ws?.send('END');
          this.outputChannel.appendLine('Finished sending audio data');

          this.deleteFiles();
        });

        fileStream.on('error', (error) => {
          this.outputChannel.appendLine(`Error reading audio file: ${error}`);
          reject(error);
        });
      });

      this.ws.on('message', (data) => {
        this.outputChannel.appendLine(`Received transcription: ${data}`);
        const transcription = data.toString();
        vscode.window.showInformationMessage(transcription);
        this.deleteFiles();
        resolve(transcription);
      });

      this.ws.on('error', (error) => {
        this.outputChannel.appendLine(`WebSocket error: ${error}`);
        this.deleteFiles();
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        this.outputChannel.appendLine(
          `WebSocket closed. Code: ${code}, Reason: ${reason}`,
        );
        if (this.ws?.readyState !== WebSocket.CLOSED) {
          reject(
            new Error(
              'WebSocket connection closed before transcription was received',
            ),
          );
        }
      });
    });
  }

  generateAudioFilePath(): void {
    const tempFileName = `recording_${uuidv4()}.wav`;
    this.audioFilePath = vscode.Uri.joinPath(this.tempDir, tempFileName).fsPath;
    this.outputChannel.appendLine(
      `Global storage path: ${this.tempDir.fsPath}`,
    );
    this.outputChannel.appendLine(
      `Audio file will be saved as: ${this.audioFilePath}`,
    );
  }

  deleteFiles(): void {
    try {
      if (this.audioFilePath && fs.existsSync(this.audioFilePath)) {
        fs.unlinkSync(this.audioFilePath);
        this.outputChannel.appendLine('Temporary audio file deleted.');
        this.audioFilePath = undefined;
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Error deleting temporary audio file: ${error}`,
      );
    }
  }
}
