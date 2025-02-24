import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import OpenAI from 'openai';
import * as os from 'os';

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

export type WhisperModel = 'whisper-1' | 'whisper-large-v3-turbo';

type ApiProvider = 'localhost' | 'openai' | 'groq';

interface ApiConfig {
  baseURL: string;
  apiKey: string;
}

const PROVIDER_MODELS: Record<ApiProvider, WhisperModel> = {
  openai: 'whisper-1',
  groq: 'whisper-large-v3-turbo',
  localhost: 'whisper-1', // default to OpenAI model for localhost
};

class SpeechTranscription {
  private fileName: string = 'recording';
  private recordingProcess: ChildProcess | null = null;
  private openai!: OpenAI;
  private tempDir!: string;
  private platform: string = os.platform();

  private async setDirectoryPermissions(dirPath: string, mode: number): Promise<void> {
    try {
      if (this.platform === 'win32') {
        // Windows: Use icacls for permission management
        await execAsync(`icacls "${dirPath}" /grant:r "${os.userInfo().username}:(OI)(CI)F"`);
        this.outputChannel.appendLine('Whisper Assistant: Set Windows permissions successfully');
      } else if (this.platform === 'darwin') {
        // MacOS: Use chmod with different syntax
        await execAsync(`chmod -R 755 "${dirPath}"`);
        this.outputChannel.appendLine('Whisper Assistant: Set MacOS permissions successfully');
      } else {
        // Linux: Use standard chmod
        fs.chmodSync(dirPath, mode);
        this.outputChannel.appendLine('Whisper Assistant: Set Linux permissions successfully');
      }
    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: Failed to set permissions: ${error}`);
      throw error;
    }
  }

  private async ensureDirectoryPermissions(dirPath: string): Promise<void> {
    this.outputChannel.appendLine(`Whisper Assistant: Checking permissions for ${dirPath} on ${this.platform}`);
    
    try {
      // Create directory with platform-specific handling
      if (!fs.existsSync(dirPath)) {
        this.outputChannel.appendLine(`Whisper Assistant: Creating directory ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Platform-specific permission handling
      if (this.platform === 'win32') {
        // Windows: Check if we have full control
        try {
          await execAsync(`icacls "${dirPath}"`, { encoding: 'utf8' });
        } catch (error) {
          this.outputChannel.appendLine('Whisper Assistant: Windows permission check failed, attempting to set permissions');
          await this.setDirectoryPermissions(dirPath, 0o755);
        }
      } else {
        // Unix-like systems (Linux/MacOS)
        try {
          const stats = fs.statSync(dirPath);
          const currentMode = stats.mode & 0o777;
          this.outputChannel.appendLine(`Whisper Assistant: Current directory permissions: ${currentMode.toString(8)}`);

          if ((currentMode & 0o700) !== 0o700) {
            await this.setDirectoryPermissions(dirPath, 0o755);
          }
        } catch (error) {
          this.outputChannel.appendLine(`Whisper Assistant: Unix permission check failed: ${error}`);
          throw error;
        }
      }

      // Verify permissions after update
      await this.verifyDirectoryAccess(dirPath);

    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: Permission error for ${dirPath}: ${error}`);
      
      // Try fallback to user's home directory
      const homeDir = os.homedir();
      if (homeDir && dirPath !== path.join(homeDir, '.whisper-assistant')) {
        this.outputChannel.appendLine('Whisper Assistant: Trying fallback to home directory');
        const fallbackDir = path.join(homeDir, '.whisper-assistant');
        await this.ensureDirectoryPermissions(fallbackDir);
        return;
      }
      
      throw new Error(`Cannot ensure permissions for ${dirPath}. Please check directory permissions.`);
    }
  }

  private async verifyDirectoryAccess(dirPath: string): Promise<void> {
    // Platform-specific verification
    if (this.platform === 'win32') {
      try {
        // Windows: Test write access using a temporary file
        const testFile = path.join(dirPath, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        this.outputChannel.appendLine(`Whisper Assistant: Windows write test successful for ${dirPath}`);
      } catch (error) {
        throw new Error(`Cannot write to directory ${dirPath} on Windows: ${error}`);
      }
    } else {
      // Unix-like systems (Linux/MacOS)
      try {
        const testFile = path.join(dirPath, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        this.outputChannel.appendLine(`Whisper Assistant: Unix write test successful for ${dirPath}`);
      } catch (error) {
        throw new Error(`Cannot write to directory ${dirPath}: ${error}`);
      }

      // Test read access
      try {
        fs.readdirSync(dirPath);
        this.outputChannel.appendLine(`Whisper Assistant: Read test successful for ${dirPath}`);
      } catch (error) {
        throw new Error(`Cannot read from directory ${dirPath}: ${error}`);
      }
    }
  }

  constructor(
    private storagePath: string,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.outputChannel.appendLine(`Whisper Assistant: Initializing with storage path: ${this.storagePath}`);
    
    // Ensure storage path permissions
    this.ensureDirectoryPermissions(this.storagePath)
      .then(() => {
        const config = this.getApiConfig();
        this.openai = new OpenAI(config);

        // Create and verify temp directory
        this.tempDir = path.join(this.storagePath, 'temp');
        this.outputChannel.appendLine(`Whisper Assistant: Using temp directory: ${this.tempDir}`);
        
        return this.ensureDirectoryPermissions(this.tempDir);
      })
      .catch((error) => {
        this.outputChannel.appendLine(`Whisper Assistant: Initialization error: ${error}`);
        throw error;
      });
  }

  private getApiConfig(): ApiConfig {
    const config = vscode.workspace.getConfiguration('whisper-assistant');
    const provider = config.get<ApiProvider>('apiProvider') || 'openai';

    const apiKey = config.get<string>('apiKey');
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    const baseURLs: Record<ApiProvider, string> = {
      localhost:
        (config.get('customEndpoint') || 'http://localhost:4444') + '/v1',
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
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        this.outputChannel.appendLine('Whisper Assistant: Creating temp directory...');
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      const outputPath = path.join(this.tempDir, `${this.fileName}.wav`);
      
      // Clean up any existing recording file
      if (fs.existsSync(outputPath)) {
        this.outputChannel.appendLine('Whisper Assistant: Removing existing recording file...');
        fs.unlinkSync(outputPath);
      }

      this.outputChannel.appendLine(`Whisper Assistant: Starting recording to ${outputPath}`);
      
      this.recordingProcess = exec(
        `sox -d -b 16 -e signed -c 1 -r 16k "${outputPath}"`,
        (error, stdout, stderr) => {
          if (error) {
            this.outputChannel.appendLine(`Whisper Assistant: Recording error: ${error}`);
            vscode.window.showErrorMessage('Whisper Assistant: Failed to start recording. Please check if SoX is installed correctly.');
            return;
          }
          if (stderr) {
            this.outputChannel.appendLine(
              `Whisper Assistant: SoX process has been killed: ${stderr}`,
            );
            // Don't show error message for normal termination
            if (!stderr.includes('sox got SIGINT')) {
              vscode.window.showErrorMessage('Whisper Assistant: Recording process was interrupted.');
            }
            return;
          }
          this.outputChannel.appendLine(`Whisper Assistant: Recording completed: ${stdout}`);
        },
      );

      // Verify recording process started successfully
      if (!this.recordingProcess || !this.recordingProcess.pid) {
        throw new Error('Failed to start recording process');
      }

    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: Failed to start recording: ${error}`);
      vscode.window.showErrorMessage('Whisper Assistant: Failed to start recording. Please try again.');
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recordingProcess) {
      this.outputChannel.appendLine(
        'Whisper Assistant: No active recording process found',
      );
      return;
    }

    try {
      this.outputChannel.appendLine('Whisper Assistant: Stopping recording process...');
      
      // Kill the recording process
      this.recordingProcess.kill();
      
      // Wait for the process to fully terminate and file to be written
      await new Promise<void>((resolve, reject) => {
        if (this.recordingProcess) {
          const timeout = setTimeout(() => {
            reject(new Error('Recording process termination timeout'));
          }, 5000); // 5 second timeout

          this.recordingProcess.on('exit', () => {
            this.outputChannel.appendLine('Whisper Assistant: Recording process terminated');
            
            // Add small delay to ensure file is written
            setTimeout(async () => {
              const wavFile = path.join(this.tempDir, `${this.fileName}.wav`);
              
              try {
                // Wait for file to become available
                for (let i = 0; i < 10; i++) {
                  if (fs.existsSync(wavFile)) {
                    const stats = fs.statSync(wavFile);
                    if (stats.size > 0) {
                      clearTimeout(timeout);
                      this.outputChannel.appendLine(`Whisper Assistant: Recording file created successfully (${stats.size} bytes)`);
                      resolve();
                      return;
                    }
                  }
                  await new Promise(res => setTimeout(res, 100)); // Wait 100ms between checks
                }
                reject(new Error('Recording file not created after process termination'));
              } catch (error) {
                reject(error);
              }
            }, 500); // Small delay after process termination
          });
        } else {
          resolve();
        }
      });

      this.recordingProcess = null;
      this.outputChannel.appendLine('Whisper Assistant: Recording stopped successfully');
      
    } catch (error) {
      this.outputChannel.appendLine(`Whisper Assistant: Error stopping recording: ${error}`);
      vscode.window.showErrorMessage('Whisper Assistant: Failed to stop recording properly. Please try again.');
      
      // Enhanced cleanup
      if (this.recordingProcess) {
        try {
          process.kill(-this.recordingProcess.pid!); // Kill entire process group
        } catch (killError) {
          this.outputChannel.appendLine(`Whisper Assistant: Error killing process: ${killError}`);
        }
      }
      this.recordingProcess = null;
      
      // Try to remove empty or corrupted file
      try {
        const wavFile = path.join(this.tempDir, `${this.fileName}.wav`);
        if (fs.existsSync(wavFile)) {
          fs.unlinkSync(wavFile);
        }
      } catch (cleanupError) {
        this.outputChannel.appendLine(`Whisper Assistant: Error cleaning up recording file: ${cleanupError}`);
      }
    }
  }

  async transcribeRecording(): Promise<Transcription | undefined> {
    try {
      // Verify temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        this.outputChannel.appendLine('Whisper Assistant: Temp directory not found, creating it...');
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      const wavFilePath = path.join(this.tempDir, `${this.fileName}.wav`);
      
      // Wait for file to be ready with timeout
      let fileReady = false;
      for (let i = 0; i < 30; i++) { // Try for 3 seconds
        if (fs.existsSync(wavFilePath)) {
          try {
            const stats = fs.statSync(wavFilePath);
            if (stats.size > 0) {
              // Test file readability
              const fd = fs.openSync(wavFilePath, 'r');
              fs.closeSync(fd);
              fileReady = true;
              this.outputChannel.appendLine(`Whisper Assistant: Recording file is ready for transcription (${stats.size} bytes)`);
              break;
            }
          } catch (error) {
            this.outputChannel.appendLine(`Whisper Assistant: File not yet ready: ${error}`);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!fileReady) {
        const error = `Recording file not ready at ${wavFilePath}. Please try recording again.`;
        this.outputChannel.appendLine(`Whisper Assistant: ${error}`);
        vscode.window.showErrorMessage(`Whisper Assistant: ${error}`);
        return undefined;
      }

      const config = vscode.workspace.getConfiguration('whisper-assistant');
      const provider = config.get<ApiProvider>('apiProvider') || 'openai';

      this.outputChannel.appendLine(
        `Whisper Assistant: Transcribing recording using ${provider} API`,
      );

      // Create read stream with explicit error handling
      const audioFile = fs.createReadStream(wavFilePath);
      audioFile.on('error', (error) => {
        this.outputChannel.appendLine(`Whisper Assistant: Error reading audio file: ${error}`);
      });

      const model = PROVIDER_MODELS[provider];

      this.outputChannel.appendLine(
        `Whisper Assistant: Using model ${model} for ${provider}`,
      );

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: model,
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

      if (result?.text?.length === 0) {
        return undefined;
      }

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
