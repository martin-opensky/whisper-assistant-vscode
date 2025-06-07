<p align="center">
  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/whisper-assistant.png" alt="Whisper Assistant">
</p>

# Whisper Assistant: Your Voice-Driven Coding Companion

Whisper Assistant is an extension for Visual Studio Code that transcribes your spoken words into text within the VSCode & Cursor editor. This hands-free approach to coding allows you to focus on your ideas instead of your typing.

✨ **Features:**

- Cross-platform audio recording with SoX (default) or custom recording commands
- Multiple API options: Local Docker, OpenAI, or Groq
- Configurable recording tools (ffmpeg, arecord, etc.) for advanced users
- Optimized for integration with AI coding assistants like Cursor

Whisper Assistant can also be integrated with other powerful AI tools, such as Chat GPT-4 or [Cursor](https://www.cursor.so/), to create a dynamic, AI-driven development environment.

# Powered by OpenAI Whisper

By default, Whisper Assistant utilizes Whisper AI on your _local machine_, offering a free voice transcription service. For this, the base model of Whisper is used, balancing accuracy and performance. **In the future, we will support other models.**

There is also the option to use the OpenAI API or Groq API to transcribe your audio for remote transcription. **Note: This requires an API key.**

For more details about Whisper, visit the [Whisper OpenAI GitHub page](https://github.com/openai/whisper).

## Getting Started: Installation Instructions

To install and setup Whisper Assistant, follow these steps:

1.  **Install a recording tool**: Whisper Assistant uses SoX by default for microphone recording, but you can also configure a custom recording command using alternatives like ffmpeg.

    ### Option A: SoX (Default - Recommended)

    - **MacOS**: Using the Homebrew package manager:
      ```bash
      brew install sox
      ```
    - **Windows**: Using the Chocolatey package manager:
      ```bash
      choco install sox.portable
      ```
      **Note for Windows Users:** Some users have reported issues with newer SoX versions not recognizing the default audio device. If you encounter this, installing version 14.4.1 specifically might resolve the problem:
      ```bash
      choco install sox.portable --version=14.4.1
      ```
    - **Ubuntu/Debian**:
      ```bash
      sudo apt install sox
      ```
    - **Other Linux distributions**: Use your package manager (e.g., `yum install sox`, `pacman -S sox`)

    ### Option B: Custom Recording Command (Alternative)

    **Linux users experiencing audio cutoff issues with SoX can use ffmpeg instead:**

    - **Ubuntu/Debian**:
      ```bash
      sudo apt install ffmpeg
      ```
    - **MacOS**:
      ```bash
      brew install ffmpeg
      ```
    - **Windows**:
      ```bash
      choco install ffmpeg
      ```

    After installation, configure the custom recording command in VS Code settings (see [Custom Recording Commands](#custom-recording-commands) section below).

2.  Install Docker to enable the local Whisper model or use the OpenAI API or Groq API for remote transcription.
    - If using local transcription, follow the instructions in the [Local Development with Faster Whisper](#local-development-with-faster-whisper) section.
    - If using remote transcription, follow the instructions in the [Multiple API Options](#multiple-api-options) section.
3.  Install the Whisper Assistant extension into Visual Studio Code or Cursor.

# How to Use Whisper Assistant

1. **Initialization**: Upon loading Visual Studio Code, the extension verifies the correct installation of SoX (or your custom recording command if configured). If any issues are detected, an error message will be displayed.

Once initialization is complete, a microphone icon will appear in the bottom right status bar.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/microphone.png" alt="Whisper Assistant icon" style="width: 144px; height: auto; ">

2. **Starting the Recording**: Activate the extension by clicking on the quote icon or using the shortcut `Command+M` (for Mac) or `Control+M` (for Windows). You can record for as long as you like, but remember, the longer the recording, the longer the transcription process. The recording time will be displayed in the status bar.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/recording.png" alt="Recording icon" style="width: 100px; height: auto;">

3. **Stopping the Recording**: Stop the recording using the same shortcut (`Command+M` or `Control+M`). The extension icon in the status bar will change to a loading icon, and a progress message will be displayed, indicating that the transcription is underway.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/transcribing.png" alt="Transcribing" style="width: 360px; height: auto; ">

4. **Transcription**: Once the transcription is complete, the text will be saved to the clipboard. This allows you to use the transcription in any program, not just within Visual Studio Code. If an editor is active, the transcription will be pasted there automatically.

  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/transcribed.png" alt="Transcribed" style="width: 400px; height: auto; ">

**Tip**: A good microphone will improve transcription accuracy, although it is not a requirement.

**Tip**: For an optimal experience, consider using the Cursor.so application to directly call the Chat GPT-4 API for code instructions. This allows you to use your voice to instruct GPT to refactor your code, write unit tests, and implement various improvements.

## Custom Recording Commands

Whisper Assistant uses SoX by default, but you can configure a custom recording command if you prefer alternatives like ffmpeg or need to work around platform-specific issues.

### When to Use Custom Recording Commands

- **Linux users experiencing audio cutoff**: Some Linux distributions have issues with SoX cutting off the last few seconds of recordings
- **Advanced users**: Want to use specific audio settings or recording tools
- **Specific microphone requirements**: Need to target a particular audio device

### Configuration

1. Open VS Code settings (`Cmd/Ctrl + ,`)
2. Search for "Whisper Assistant"
3. Find "Custom Recording Command"
4. Enter your command with the `$AUDIO_FILE` placeholder

**Important**: Your command MUST include `$AUDIO_FILE` where the output file should be saved.

### Platform-Specific Examples

#### macOS (ffmpeg)

```bash
ffmpeg -f avfoundation -i :1 -ac 1 -ar 16000 -sample_fmt s16 $AUDIO_FILE
```

_Note: Replace `:1` with the appropriate device number from `ffmpeg -f avfoundation -list_devices true -i ""`_

#### Linux (ffmpeg with PulseAudio)

```bash
ffmpeg -f pulse -i default -ac 1 -ar 16000 -sample_fmt s16 $AUDIO_FILE
```

#### Linux (ffmpeg with ALSA)

```bash
ffmpeg -f alsa -i default -ac 1 -ar 16000 -sample_fmt s16 $AUDIO_FILE
```

#### Windows (ffmpeg)

```bash
ffmpeg -f dshow -i audio="Microphone" -ac 1 -ar 16000 -sample_fmt s16 $AUDIO_FILE
```

#### Alternative Tools

**Linux with arecord:**

```bash
arecord -f S16_LE -c 1 -r 16000 $AUDIO_FILE
```

**Any platform with custom settings:**

```bash
sox -t pulseaudio default -c 1 -r 16000 $AUDIO_FILE gain -3
```

### Troubleshooting Custom Commands

- **Command validation error**: Ensure your command includes `$AUDIO_FILE`
- **No audio recorded**: Check your audio device permissions and microphone access
- **Command not found**: Verify the recording tool (ffmpeg, arecord, etc.) is installed and in your PATH
- **Still experiencing cutoffs**: Try adjusting buffer settings or switching recording tools

### Finding Your Audio Device

**macOS (ffmpeg):**

```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

**Linux (PulseAudio):**

```bash
pactl list sources short
```

**Linux (ALSA):**

```bash
arecord -l
```

**Windows (ffmpeg):**

```bash
ffmpeg -list_devices true -f dshow -i dummy
```

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

# Platform Compatibility

Whisper Assistant has been tested and supports:

- **macOS**: Full support with SoX (default) and ffmpeg (custom)
- **Windows**: Full support with SoX (default) and ffmpeg (custom)
- **Linux**: Full support with SoX (default) and ffmpeg (custom) - _Note: Some distributions may experience audio cutoff issues with SoX, for which ffmpeg is recommended_

If you encounter any platform-specific issues, please consider using the [custom recording command](#custom-recording-commands) feature or report the issue on our GitHub repository.

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
