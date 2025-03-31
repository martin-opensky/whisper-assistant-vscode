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

1. **Initialization**: Upon loading Visual Studio Code, the extension verifies the correct installation of SoX. If any issues are detected, an error message will be displayed.

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

## Local Development with Faster Whisper

This extension supports using a local Faster Whisper model through Docker. This provides faster transcription and doesn't require an API key.

### Quick Start with Docker

The fastest way to get started is using our pre-built Docker image:

```bash
docker run -d -p 4444:4444 --name whisper-assistant martinopensky/whisper-assistant:latest
```

Then configure VSCode:

1. Open VSCode settings (File > Preferences > Settings)
2. Search for "Whisper Assistant"
3. Set "Api Provider" to "localhost"
4. Set "Api Key" to any non-empty string (e.g., "local")

That's it! You can now use the extension with your local Whisper server.

### Docker Configuration Options

#### Memory Limits

If you're experiencing memory issues, you can limit the container's memory:

```bash
docker run -d -p 4444:4444 --memory=4g --name whisper-assistant martinopensky/whisper-assistant:latest
```

#### GPU Support

If you have a CUDA-capable GPU:

```bash
docker run -d -p 4444:4444 --gpus all --name whisper-assistant martinopensky/whisper-assistant:latest
```

#### Container Management

```bash
# Stop the server
docker stop whisper-assistant

# Start the server
docker start whisper-assistant

# Remove the container
docker rm whisper-assistant

# View logs
docker logs whisper-assistant

# Update to latest version
docker pull martinopensky/whisper-assistant:latest
docker stop whisper-assistant
docker rm whisper-assistant
docker run -d -p 4444:4444 martinopensky/whisper-assistant:latest
```

### Troubleshooting

1. Check if the server is running:

   ```bash
   curl http://localhost:4444/v1/health
   ```

2. Common issues:
   - **First startup delay**: The model is downloaded on first use, which may take a few minutes
   - **Memory issues**: Try using the `--memory=4g` flag as shown above
   - **Port conflicts**: If port 4444 is in use, you can map to a different port:
     ```bash
     docker run -d -p 5000:4444 martinopensky/whisper-assistant:latest
     ```
     Then update the custom endpoint in VSCode settings to `http://localhost:5000`

### Advanced: Building from Source

If you want to customize the server, you can build from our Dockerfile:

1. Get the Dockerfile from our repository
2. Build the image:
   ```bash
   docker build -t whisper-assistant-local .
   docker run -d -p 4444:4444 whisper-assistant-local
   ```
