<p align="center">
  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/whisper-assistant.png" alt="Whisper Assistant">
</p>

# Whisper Assistant: Your Voice-Driven Coding Companion

Whisper Assistant is an extension for Visual Studio Code that transcribes your spoken words into text within the VSCode & Cursor editor. This hands-free approach to coding allows you to focus on your ideas instead of your typing.

Whisper Assistant can also be integrated with other powerful AI tools, such as Chat GPT-4 or [Cursor](https://www.cursor.so/), to create a dynamic, AI-driven development environment.

# Powered by OpenAI Whisper

By default, Whisper Assistant utilizes Whisper AI on your _local machine_, offering a free voice transcription service. For this, the base model of Whisper is used, balancing accuracy and performance. **In the future, we will support other models.**

There is also the option to use the OpenAI API or Groq API to transcribe your audio for remote transcription. **Note: This requires an API key.**

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
      **Note for Windows Users:** Some users have reported issues with newer SoX versions not recognizing the default audio device. If you encounter this, installing version 14.4.1 specifically might resolve the problem. You can install it using Chocolatey with the following command:
      ```
      choco install sox.portable --version=14.4.1
      ```
    - Ubuntu: Run the following command in your terminal:
      ```
      sudo apt install sox
      ```

2.  Install Docker to enable the local Whisper model or use the OpenAI API or Groq API for remote transcription.
    - If using local transcription, follow the instructions in the [Local Development with Faster Whisper](#local-development-with-faster-whisper) section.
    - If using remote transcription, follow the instructions in the [Multiple API Options](#multiple-api-options) section.
3.  Install the Whisper Assistant extension into Visual Studio Code or Cursor.

# How to Use Whisper Assistant

1. **Initialization**: Upon loading Visual Studio Code, the extension verifies the correct installation of SoX. If any issues are detected, an error message will be displayed.

Once initialization is complete, a quote icon will appear in the bottom right status bar.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/microphone.png" alt="Whisper Assistant icon" style="width: 144px; height: auto; ">

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

This extension supports using a local Faster Whisper model through Docker. This provides fast transcription locally and doesn't require an API key.

### Quick Start with Docker

To get started with local transcription, use our Docker image:

```bash
docker run -d -p 4444:4444 --name whisper-assistant martinopensky/whisper-assistant:latest
```

Then configure VSCode:

1. Open VSCode settings (File > Preferences > Settings)
2. Search for "Whisper Assistant"
3. Set "Api Provider" to "localhost"
4. Set "Api Key" to any non-empty string (e.g., "localhost-dummy-key")

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

# Multiple API Options

Whisper Assistant offers three ways to transcribe your audio:

1. **Local Docker Server** (Default): Run Whisper locally using our Docker container for privacy and no remote API costs
2. **OpenAI Cloud API**: A powerful cloud option using OpenAI's Whisper-1 model for fast, accurate transcription (requires API key)
3. **Groq Cloud API**: A powerful cloud option using Groq's Whisper Large v3 Turbo model for fast, accurate transcription (requires API key)

## Configuring the API Provider

1. Open VSCode settings (File > Preferences > Settings)
2. Search for "Whisper Assistant"
3. Set "Api Provider" to one of:
   - `localhost` (default)
   - `openai`
   - `groq`
4. Enter your API key:
   - For localhost: Any non-empty string (e.g., "localhost-dummy-key")
   - For OpenAI: Get your key from [OpenAI's console](https://platform.openai.com/api-keys)
   - For Groq: Get your key from [GROQ's console](https://console.groq.com)

When using localhost (default), you can customize the endpoint URL in settings if you're running the Docker container on a different port or host.
