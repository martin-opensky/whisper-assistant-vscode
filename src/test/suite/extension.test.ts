import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { state } from '../../extension';
import SpeechTranscription from '../../speech-transcription';

suite('Extension Test Suite', () => {
  let outputChannel: vscode.OutputChannel;
  let storagePath: string;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel('Test Output');
    storagePath = path.join(__dirname, 'test-storage');
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });

  teardown(() => {
    outputChannel.dispose();
    if (fs.existsSync(storagePath)) {
      fs.rmSync(storagePath, { recursive: true, force: true });
    }
  });

  test('SpeechTranscription initialization', () => {
    const speechTranscription = new SpeechTranscription(
      storagePath,
      outputChannel,
    );
    assert.strictEqual(typeof speechTranscription.getOutputDir, 'function');
  });

  test('Status bar item initialization', () => {
    assert.strictEqual(state.isRecording, false);
    assert.strictEqual(state.isTranscribing, false);
    if (state.myStatusBarItem) {
      assert.strictEqual(state.myStatusBarItem.text, '$(quote)');
    }
  });

  test('API configuration', async () => {
    // Set test configuration
    await vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiProvider', 'openai', vscode.ConfigurationTarget.Global);
    await vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiKey', 'test-key', vscode.ConfigurationTarget.Global);

    const speechTranscription = new SpeechTranscription(
      storagePath,
      outputChannel,
    );

    // Test that initialization doesn't throw with valid config
    assert.doesNotThrow(() => {
      speechTranscription.getOutputDir();
    });

    // Reset test configuration
    await vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiProvider', undefined, vscode.ConfigurationTarget.Global);
    await vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiKey', undefined, vscode.ConfigurationTarget.Global);
  });

  test('Recording state management', async () => {
    const speechTranscription = new SpeechTranscription(
      storagePath,
      outputChannel,
    );

    // Mock recording process
    state.isRecording = true;
    state.recordingStartTime = Date.now();
    assert.strictEqual(state.isRecording, true);

    // Stop recording
    await speechTranscription.stopRecording();
    assert.strictEqual(state.recordingProcess, null);
  });

  test('Temp directory cleanup', () => {
    const speechTranscription = new SpeechTranscription(
      storagePath,
      outputChannel,
    );

    // Create test files
    const tempDir = path.join(storagePath, 'temp');
    const testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    // Run cleanup
    speechTranscription.cleanup();

    // Verify cleanup
    assert.strictEqual(fs.existsSync(tempDir), false);
  });

  test('Error handling for missing API key', () => {
    // Clear API key configuration
    vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiKey', '', vscode.ConfigurationTarget.Global);

    assert.throws(() => {
      new SpeechTranscription(storagePath, outputChannel);
    }, /API key not configured/);
  });

  test('API provider selection', async () => {
    // Test each provider
    const providers = ['openai', 'groq', 'localhost'];

    for (const provider of providers) {
      await vscode.workspace
        .getConfiguration('whisper-assistant')
        .update('apiProvider', provider, vscode.ConfigurationTarget.Global);
      await vscode.workspace
        .getConfiguration('whisper-assistant')
        .update('apiKey', 'test-key', vscode.ConfigurationTarget.Global);

      const speechTranscription = new SpeechTranscription(
        storagePath,
        outputChannel,
      );

      assert.doesNotThrow(() => {
        speechTranscription.getOutputDir();
      });
    }

    // Reset configuration
    await vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiProvider', undefined, vscode.ConfigurationTarget.Global);
    await vscode.workspace
      .getConfiguration('whisper-assistant')
      .update('apiKey', undefined, vscode.ConfigurationTarget.Global);
  });
});
