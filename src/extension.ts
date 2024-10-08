import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';
import SpeechTranscription from './speech-transcription';
import * as path from 'path';

interface ExtensionState {
  myStatusBarItem: vscode.StatusBarItem | undefined;
  workspacePath: string | undefined;
  outputDir: string | undefined;
  outputChannel?: vscode.OutputChannel;
  speechTranscription?: SpeechTranscription;
  isRecording: boolean;
  isTranscribing: boolean;
  recordingStartTime: number | undefined;
}

export const state: ExtensionState = {
  myStatusBarItem: undefined,
  workspacePath: undefined,
  outputDir: undefined,
  isRecording: false,
  isTranscribing: false,
  recordingStartTime: undefined,
};

export async function activate(context: vscode.ExtensionContext) {
  initializeWorkspace();
  initializeOutputChannel();
  initializeStatusBarItem();

  // if (state.workspacePath === undefined || state.outputDir === undefined) {
  //   console.log('Please open a workspace directory before starting recording.');
  //   return;
  // }

  if (
    state.myStatusBarItem !== undefined &&
    state.outputChannel !== undefined
  ) {
    state.speechTranscription = new SpeechTranscription(
      context,
      state.outputChannel,
      state.myStatusBarItem,
    );
    context.subscriptions.push(state.myStatusBarItem);
  }

  // Check if Docker is installed
  const isDockerInstalled = await checkIfDockerInstalled();

  if (!isDockerInstalled) {
    vscode.window.showErrorMessage(
      'Docker is not installed. Please install Docker for this extension to work properly.',
    );
    return;
  }

  // Start the Docker container
  await startDockerContainer();

  registerCommands(context);
  updateStatusBarItem();

  console.log(
    'Congratulations, your extension "Whisper Assistant" is now active!',
  );
}

async function checkIfDockerInstalled(): Promise<boolean> {
  try {
    await execAsync('docker --version');
    return true;
  } catch (error) {
    return false;
  }
}

async function startDockerContainer() {
  try {
    // const serverPath = path.join(__dirname, '..', 'src', 'server');
    // await execAsync(`docker build -t whisper-assistant-server "${serverPath}"`);
    await execAsync(
      `docker run -d --name whisper-assistant-server-container -p 8765:8765 whisper-assistant-server`,
    );
    vscode.window.showInformationMessage('Docker container started');
  } catch (error) {
    vscode.window.showInformationMessage(
      'Docker container may already be running',
    );
  }
}

export function initializeStatusBarItem(): void {
  state.myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1,
  );
  state.myStatusBarItem.command = 'whisperAssistant.toggleRecording';
  state.myStatusBarItem.show();
}

export function initializeWorkspace(): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders !== undefined) {
    state.workspacePath = workspaceFolders[0].uri.fsPath;
    const whisperDir = `${state.workspacePath}/.whisper`;
    if (!fs.existsSync(whisperDir)) {
      fs.mkdirSync(whisperDir);
    }
    state.outputDir = `${state.workspacePath}/.whisper`;
  }
}

function registerCommands(context: vscode.ExtensionContext): void {
  let toggleRecordingDisposable = vscode.commands.registerCommand(
    'whisperAssistant.toggleRecording',
    toggleRecordingCommand,
  );
  context.subscriptions.push(toggleRecordingDisposable);
}

export async function toggleRecordingCommand(): Promise<void> {
  if (state.speechTranscription && !state.isTranscribing) {
    if (!state.isRecording) {
      state.speechTranscription.startRecording();
      state.recordingStartTime = Date.now();
      state.isRecording = true;
      updateStatusBarItem();
      setInterval(updateStatusBarItem, 1000);
    } else {
      state.speechTranscription.stopRecording();
      state.isTranscribing = true;
      state.isRecording = false;
      updateStatusBarItem();

      const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
      };

      await vscode.window.withProgress(progressOptions, async (progress) => {
        const incrementData = initializeIncrementData();
        const interval = startProgressInterval(progress, incrementData);

        try {
          const transcription: string | undefined =
            await state.speechTranscription?.transcribeRecording();

          if (transcription) {
            vscode.env.clipboard.writeText(transcription).then(() => {
              vscode.commands.executeCommand(
                'editor.action.clipboardPasteAction',
              );
            });

            await finalizeProgress(progress, interval, incrementData);
          }
        } catch (error) {
          vscode.window.showErrorMessage('Failed to transcribe recording');

          state.isTranscribing = false;
          state.recordingStartTime = undefined;
          updateStatusBarItem();
        }
      });
    }
  }
}

function updateStatusBarItem(): void {
  if (state.myStatusBarItem === undefined) {
    return;
  }

  if (state.isRecording && state.recordingStartTime !== undefined) {
    const recordingDuration = Math.floor(
      (Date.now() - state.recordingStartTime) / 1000,
    );
    const minutes = Math.floor(recordingDuration / 60);
    const seconds = recordingDuration % 60;
    state.myStatusBarItem.text = `$(stop) ${minutes}:${
      seconds < 10 ? '0' + seconds : seconds
    }`;
  } else {
    state.myStatusBarItem.text = state.isTranscribing
      ? `$(loading~spin)`
      : `$(quote)`;
  }
}

function initializeIncrementData(): {
  increment: number;
  incrementInterval: number;
} {
  let increment: number = 0;
  const recordingDuration: number = state.recordingStartTime
    ? (Date.now() - state.recordingStartTime) / 1000
    : 0;
  const secondsDuration: number = recordingDuration % 60;
  const transcriptionTime: number = secondsDuration * 0.2 + 10; // 20% of the recording time + 10 seconds
  const incrementInterval: number = transcriptionTime * 30; // interval time to increment the progress bar
  return { increment, incrementInterval };
}

function startProgressInterval(
  progress: vscode.Progress<{ increment: number; message: string }>,
  incrementData: { increment: number; incrementInterval: number },
): NodeJS.Timeout {
  const interval = setInterval(() => {
    incrementData.increment += 1; // increment by 1% to slow down the progress

    progress.report({
      increment: incrementData.increment,
      message: 'Transcribing...',
    });
  }, incrementData.incrementInterval);

  return interval;
}

async function finalizeProgress(
  progress: vscode.Progress<{ increment: number; message: string }>,
  interval: NodeJS.Timeout,
  incrementData: { increment: number; incrementInterval: number },
): Promise<void> {
  clearInterval(interval);
  progress.report({
    increment: 100,
    message: 'Text has been transcribed and saved to the clipboard.',
  });
  state.isTranscribing = false;
  state.recordingStartTime = undefined;
  updateStatusBarItem();
  // Delay the closing of the progress pop-up by 2.5 second to allow the user to see the completion message
  await new Promise<void>((resolve) => setTimeout(resolve, 2500));
}

export function deactivate() {
  if (state.myStatusBarItem) {
    state.myStatusBarItem.dispose();
  }

  if (state.speechTranscription) {
    state.speechTranscription.stopRecording();
  }

  // Reset variables
  state.isRecording = false;
  state.isTranscribing = false;
  state.recordingStartTime = undefined;

  console.log('Your extension "Whisper Assistant" is now deactivated');
}

export function initializeOutputChannel(): void {
  state.outputChannel = vscode.window.createOutputChannel('Whisper Assistant');
}

function execAsync(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
