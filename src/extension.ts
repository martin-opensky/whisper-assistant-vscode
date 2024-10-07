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
}

export const state: ExtensionState = {
  myStatusBarItem: undefined,
  workspacePath: undefined,
  outputDir: undefined,
};

export async function activate(context: vscode.ExtensionContext) {
  initializeWorkspace();

  // if (state.workspacePath === undefined || state.outputDir === undefined) {
  //   console.log('Please open a workspace directory before starting recording.');
  //   return;
  // }

  initializeOutputChannel();
  initializeStatusBarItem();

  if (
    state.myStatusBarItem !== undefined &&
    state.outputChannel !== undefined
  ) {
    state.speechTranscription = new SpeechTranscription(
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
  startDockerContainer();

  registerCommands(context);

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
    const serverPath = path.join(__dirname, '..', 'src', 'server');
    await execAsync(`docker build -t whisper-assistant-server "${serverPath}"`);
    await execAsync(`docker run -d -p 8765:8765 whisper-assistant-server`);
  } catch (error) {
    vscode.window.showErrorMessage(
      'Failed to start Docker container: ' + error,
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
  if (state.speechTranscription) {
    if (!state.speechTranscription.isRecording) {
      state.speechTranscription.startRecording();
    } else {
      await state.speechTranscription.stopRecording();
    }
  }
}

export function deactivate() {
  if (state.myStatusBarItem) {
    state.myStatusBarItem.dispose();
  }

  if (state.speechTranscription) {
    state.speechTranscription.stopRecording();
    state.speechTranscription.deleteFiles();
  }

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
