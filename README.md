<p align="center">
  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/whisper-assistant.png" alt="Whisper Assistant">
</p>

# Whisper Assistant: Your Voice-Driven Coding Companion

Whisper Assistant is an extension for Visual Studio Code that transcribes your spoken words into text within the VSCode editor. This hands-free approach to coding allows you to focus on your ideas instead of your typing.

Whisper Assistant can also be integrated with other powerful AI tools, such as Chat GPT-4 or the [Cursor.so application](https://www.cursor.so/), to create a dynamic, AI-driven development environment.

# Powered by OpenAI Whisper

Whisper Assistant utilizes the Whisper AI locally, offering a free voice transcription service.

By default, the base model of Whisper AI is used, balancing accuracy and performance. You can select a different model in the extension settings, but remember to download your chosen model before using Whisper Assistant. **Failure to download the selected model can lead to errors.** The base model is recommended and set as default.

For more details about Whisper, visit the [Whisper OpenAI GitHub page](https://github.com/openai/whisper).

## Getting Started: Installation Instructions

To install and setup Whisper Assistant, follow these steps:

1.  Install SoX to enable easy microphone recording through the command line.

    - MacOS: Using the Homebrew package manager, run the following command in your terminal:
      ```
      brew install sox
      ```
    - Windows: Using the Chocolatey package manager, run the following command in your terminal:
      ```
      choco install sox.portable
      ```
    - Ubuntu: Run the following command in your terminal:
      ```
      sudo apt install sox
      ```

2.  Install Whisper locally. This requires the following prerequisites:
    - Install [Python 3](https://www.python.org/downloads/)
    - Install [PIP](https://pip.pypa.io/en/stable/installation/)
    - Follow the instructions on the [Whisper OpenAI GitHub page](https://github.com/openai/whisper) to complete the Whisper installation.
3.  Install the Whisper Assistant extension into Visual Studio Code or the Cursor.so application.

# How to Use Whisper Assistant

1. **Initialization**: Upon loading Visual Studio Code, the extension verifies the correct installation of SoX and Whisper. If any issues are detected, an error message will be displayed. These dependencies must be installed to use the extension.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/errors.png" alt="Quote icon" style="width: 360px; height: auto; ">

Once initialization is complete, a quote icon will appear in the bottom right status bar.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/quote.png" alt="Quote icon" style="width: 144px; height: auto; ">

2. **Starting the Recording**: Activate the extension by clicking on the quote icon or using the shortcut `Command+M` (for Mac) or `Control+M` (for Windows). You can record for as long as you like, but remember, the longer the recording, the longer the transcription process. The recording time will be displayed in the status bar.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/recording.png" alt="Recording icon" style="width: 100px; height: auto;">

3. **Stopping the Recording**: Stop the recording using the same shortcut (`Command+M` or `Control+M`). The extension icon in the status bar will change to a loading icon, and a progress message will be displayed, indicating that the transcription is underway.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/transcribing.png" alt="Transcribing" style="width: 360px; height: auto; ">

4. **Transcription**: Once the transcription is complete, the text will be saved to the clipboard. This allows you to use the transcription in any program, not just within Visual Studio Code. If an editor is active, the transcription will be pasted there automatically.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/transcribed.png" alt="Transcribed" style="width: 400px; height: auto; ">

**Tip**: A good microphone will improve transcription accuracy, although it is not a requirement.

**Tip**: For an optimal experience, consider using the Cursor.so application to directly call the Chat GPT-4 API for code instructions. This allows you to use your voice to instruct GPT to refactor your code, write unit tests, and implement various improvements.

## Using Whisper Assistant with Cursor.so

To enhance your development experience with Cursor.so and Whisper Assistant, follow these simple steps:

1.  Start the recording: Press `Command+M` (Mac) or `Control+M` (Windows).
2.  Speak your instructions clearly.
3.  Stop the recording: Press `Command+M` (Mac) or `Control+M` (Windows).
    _Note: This initiates the transcription process._
4.  Open the Cursor dialog: Press `Command+K` or `Command+L`.
    _Important: Do this **before** the transcription completes._
5.  The transcribed text will automatically populate the Cursor dialog. Here, you can edit the text or add files/docs, then press `Enter` to execute the GPT query.

By integrating Cursor.so with Whisper Assistant, you can provide extensive instructions without the need for typing, significantly enhancing your development workflow.

# Disclaimer

Please note that this extension has been primarily tested on Mac OS. While efforts have been made to ensure compatibility, its functionality on other platforms such as Windows or Linux cannot be fully guaranteed. I welcome and appreciate any pull requests to address potential issues encountered on these platforms.

## Development Setup

1. Copy the settings template:

```bash

```

## Local Development with Faster Whisper

This extension supports using a local Faster Whisper model through Docker. This provides faster transcription and doesn't require an API key.

### Setting up the Local Server

1. Install Docker on your system
2. Build the Docker image:
   ```bash
   docker build -t whisper-assistant-server .
   ```
3. Run the container:
   ```bash
   docker run -d -p 4444:4444 --name whisper-assistant whisper-assistant-server
   ```

### Using the Local Server

1. Open VSCode settings (File > Preferences > Settings)
2. Search for "Whisper Assistant"
3. Set "Api Provider" to "localhost"
4. Set "Api Key" to any non-empty string (e.g., "local")
5. The extension will now use your local Faster Whisper server

### Available Models

The local server uses the "base" model by default. To use a different model, modify the `server/main.py` file:

```python
model = WhisperModel("large-v2", device="cpu", compute_type="int8")
```

Available models:

- tiny
- base
- small
- medium
- large-v2
- large-v3

Note: Larger models require more memory but provide better accuracy.

### Using GPU Acceleration

If you have a CUDA-capable GPU, you can modify the Dockerfile to use the GPU version:

```dockerfile
FROM python:3.10-slim

# Install CUDA dependencies
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    cuda-toolkit-11-8 \
    && rm -rf /var/lib/apt/lists/*

# ... rest of Dockerfile ...
```

Then update the model initialization in `server/main.py`:

```python
model = WhisperModel("base", device="cuda", compute_type="float16")
```

Run the container with GPU support:

```bash
docker run -d -p 4444:4444 --gpus all --name whisper-assistant whisper-assistant-server
```

### Troubleshooting

1. Check if the server is running:

   ```bash
   curl http://localhost:4444/health
   ```

2. View server logs:

   ```bash
   docker logs whisper-assistant
   ```

3. If you encounter memory issues, try a smaller model or increase Docker's memory limit.
