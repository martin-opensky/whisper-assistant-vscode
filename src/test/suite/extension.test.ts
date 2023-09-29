import * as assert from 'assert';
import * as vscode from 'vscode';
import SpeechTranscription from '../../speech-transcription';
import {
  initializeWorkspace,
  initializeStatusBarItem,
  toggleRecordingCommand,
  deactivate,
  state,
  initializeOutputChannel,
} from '../../extension';

// NOTE: Tests can only be run if a workspace is open, so we need to open a known workspace before running the tests
const outputWorkspace = '/Users/martin/Documents/www';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  initializeOutputChannel();

  suiteSetup(async () => {
    // Open a specific workspace directory before running the tests
    const uri = vscode.Uri.file(outputWorkspace);
    await vscode.commands.executeCommand('vscode.openFolder', uri);
  });

  test('Check if Sox is installed', async () => {
    if (state.outputChannel === undefined) {
      throw new Error('Output channel is undefined');
    }

    const speechTranscription = new SpeechTranscription(
      outputWorkspace,
      state.outputChannel,
    );
    const isSoxInstalled = await speechTranscription.checkIfInstalled('sox');
    assert.strictEqual(isSoxInstalled, true);
  });

  test('Check if Whisper is installed', async () => {
    if (state.outputChannel === undefined) {
      throw new Error('Output channel is undefined');
    }

    const speechTranscription = new SpeechTranscription(
      outputWorkspace,
      state.outputChannel,
    );
    const isWhisperInstalled = await speechTranscription.checkIfInstalled(
      'whisper',
    );
    assert.strictEqual(isWhisperInstalled, true);
  });

  test('Check if workspace is initialized correctly', () => {
    initializeWorkspace();
    assert.strictEqual(state.workspacePath !== undefined, true);
    assert.strictEqual(state.outputDir !== undefined, true);
  });

  test('Check if status bar item is initialized correctly', () => {
    initializeStatusBarItem();
    assert.strictEqual(state.myStatusBarItem !== undefined, true);
  });

  test('Check if recording can be toggled', async () => {
    await toggleRecordingCommand();
    assert.strictEqual(state.isRecording, true);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // record for 3 seconds
    await toggleRecordingCommand();
    assert.strictEqual(state.isRecording, false);
  });

  // TODO: Add a test that verifies that during transcribing the status bar item is updated correctly

  // TODO: Add a test that verifies that the transcribing process is started correctly and the toggleRecordingCommand is disabled

  // TODO: Add a test to make sure the transcription text is copied to the clipboard

  test('Check if extension is deactivated correctly', () => {
    deactivate();
    assert.strictEqual(state.isRecording, false);
    assert.strictEqual(state.isTranscribing, false);
    assert.strictEqual(state.workspacePath, undefined);
    assert.strictEqual(state.outputDir, undefined);
    assert.strictEqual(state.recordingStartTime, undefined);
  });
});
