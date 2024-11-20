import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import OpenAI from 'openai';

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

export type WhisperModel = 'whisper-large-v3-turbo';

type ApiProvider = 'localhost' | 'openai' | 'groq';

interface ApiConfig {
  baseURL: string;
  apiKey: string;
}

const DEFAULT_MODEL: WhisperModel = 'whisper-large-v3-turbo';

class SpeechTranscription {
  private fileName: string = 'recording';
  private recordingProcess: ChildProcess | null = null;
  private openai: OpenAI;
  private tempDir: string;

  constructor(
    private storagePath: string,
    private outputChannel: vscode.OutputChannel,
  ) {
    const config = this.getApiConfig();
    this.openai = new OpenAI(config);

    // Create a temp directory within the storage path
    this.tempDir = path.join(this.storagePath, 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private getApiConfig(): ApiConfig {
    const config = vscode.workspace.getConfiguration('whisper-assistant');
    const provider = config.get<ApiProvider>('apiProvider') || 'openai';

    const apiKey = config.get<string>('apiKey');
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    const baseURLs: Record<ApiProvider, string> = {
      localhost: config.get('customEndpoint') || 'http://localhost:8000',
      openai: 'https://api.openai.com/v1',
      groq: 'https://api.groq.com/openai/v1',
    };

    return {
      baseURL: baseURLs[provider],
      apiKey,
    };
  }

  async checkIfInstalled(command: string): Promise<boolean> {
    try {
      await execAsync(`${command} --help`);
      return true;
    } catch (error) {
      return false;
    }
  }

  getOutputDir(): string {
    return this.storagePath;
  }

  startRecording(): void {
    try {
      const outputPath = path.join(this.tempDir, `${this.fileName}.wav`);
      this.recordingProcess = exec(
        `sox -d -b 16 -e signed -c 1 -r 16k "${outputPath}"`,
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

  async transcribeRecording(): Promise<Transcription | undefined> {
    try {
      const config = vscode.workspace.getConfiguration('whisper-assistant');
      const provider = config.get<ApiProvider>('apiProvider') || 'openai';

      this.outputChannel.appendLine(
        `Whisper Assistant: Transcribing recording using ${provider} API`,
      );

      const audioFile = fs.createReadStream(
        path.join(this.tempDir, `${this.fileName}.wav`),
      );

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: DEFAULT_MODEL,
        language: 'en',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        response_format: 'verbose_json',
      });

      // Convert response to our Transcription interface
      const result: Transcription = {
        text: transcription.text,
        segments:
          transcription.segments?.map((seg) => ({
            id: seg.id,
            seek: 0,
            start: seg.start,
            end: seg.end,
            text: seg.text,
            tokens: [],
            temperature: 0,
          })) ?? [],
        language: transcription.language,
      };

      // Save transcription to storage path
      await fs.promises.writeFile(
        path.join(this.tempDir, `${this.fileName}.json`),
        JSON.stringify(result, null, 2),
      );

      this.outputChannel.appendLine(
        `Whisper Assistant: Transcription: ${result.text}`,
      );

      return result;
    } catch (error) {
      // Log the error to output channel
      this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);

      // Show error message to user
      let errorMessage = 'An error occurred during transcription.';

      if (error instanceof Error) {
        // Format the error message to be more user-friendly
        errorMessage = error.message
          .replace(/\bError\b/i, '') // Remove redundant "Error" word
          .trim();
      }

      vscode.window.showErrorMessage(`Whisper Assistant: ${errorMessage}`);
      return undefined;
    }
  }

  deleteFiles(): void {
    try {
      const wavFile = path.join(this.tempDir, `${this.fileName}.wav`);
      const jsonFile = path.join(this.tempDir, `${this.fileName}.json`);

      if (fs.existsSync(wavFile)) {
        fs.unlinkSync(wavFile);
      }
      if (fs.existsSync(jsonFile)) {
        fs.unlinkSync(jsonFile);
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Whisper Assistant: Error deleting files: ${error}`,
      );
    }
  }

  // Add cleanup method for extension deactivation
  cleanup(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Whisper Assistant: Error cleaning up: ${error}`,
      );
    }
  }
}

export default SpeechTranscription;
