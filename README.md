<p align="center">
  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/whisper-assistant.png" alt="Whisper Assistant">
</p>

# Whisper Assistant: Your Voice-Driven Coding Companion

Whisper Assistant is an extension for Visual Studio Code that transcribes your spoken words into text within the VSCode editor. This hands-free approach to coding allows you to focus on your ideas instead of your typing.

Whisper Assistant can also be integrated with other powerful AI tools, such as Chat GPT-4 or the [Cursor.so application](https://www.cursor.so/), to create a dynamic, AI-driven development environment.

## Powered by OpenAI Whisper

Whisper Assistant utilizes the Whisper AI, offering voice transcription in multiple ways:
- **Local Processing**: Free voice transcription using locally installed Whisper models
- **API-based Processing**: Enhanced transcription via hosted API services

By default, the base model of Whisper AI is used, balancing accuracy and performance. You can select a different model in the extension settings, but remember to download your chosen model before using Whisper Assistant. **Failure to download the selected model can lead to errors.** The base model is recommended and set as default.

For more details about Whisper, visit the [Whisper OpenAI GitHub page](https://github.com/openai/whisper).

## Getting Started: Complete Installation Guide

### 1. Prerequisites Installation

**Install SoX** to enable microphone recording through the command line:

- **MacOS**:
  ```bash
  brew install sox
  ```

- **Windows**:
  ```bash
  choco install sox.portable
  ```

- **Ubuntu/Linux**:
  ```bash
  sudo apt install sox pulseaudio
  ```

### 2. Whisper Installation

If you plan to use local processing, follow these steps:

1. Install [Python 3](https://www.python.org/downloads/) (version 3.8 or higher recommended)
2. Install [PIP](https://pip.pypa.io/en/stable/installation/) (should come with Python)
3. Install Whisper:
   ```bash
   pip install -U openai-whisper
   ```
   This will automatically install PyTorch and other dependencies.

4. Verify installation:
   ```bash
   whisper --help
   ```

**Note on PyTorch**: Whisper relies on PyTorch for its neural network operations. When you install Whisper via pip, PyTorch is automatically installed as a dependency. The verification script will check for proper PyTorch installation.

#### GPU Acceleration (Optional)

For faster transcription with GPU support:
- Ensure you have a compatible NVIDIA GPU
- Install CUDA toolkit (version 11.6+ recommended)
- PyTorch will automatically detect and use CUDA if available

### 3. Extension Installation

Install the Whisper Assistant extension:
1. Open VS Code or Cursor.so
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Whisper Assistant"
4. Click "Install"

### 4. API Provider Configuration

Whisper Assistant supports multiple API providers for transcription:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "Whisper Assistant"
3. Configure the following settings:
   - **API Provider**: Choose from:
     - `local` (default, uses locally installed Whisper)
     - `openai` (uses OpenAI's API)
     - `localhost` (uses local Faster Whisper server)
   - **API Key**: Enter your provider's API key (if applicable)
   - **Whisper Model**: Choose the model size (tiny, base, small, medium, large)

### 5. Verify Your Environment (Recommended)

To ensure everything is set up correctly, run the included verification script:

1. Download `setup_whisper_assistant.sh` from the repository
2. Make it executable:
   ```bash
   chmod +x setup_whisper_assistant.sh
   ```
3. Run the script:
   ```bash
   ./setup_whisper_assistant.sh
   ```

The script will verify your environment, checking for:
- Required dependencies (SoX, Python, ffmpeg)
- Whisper installation
- PyTorch installation and CUDA capability
- Recording devices
- Docker (if using local server)

This comprehensive check will help ensure Whisper Assistant is ready to use.

## How to Use Whisper Assistant

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

## Troubleshooting Common Issues

### Permission Errors (ENOENT)

If you encounter "ENOENT: no such file or directory" errors:

1. Check that all prerequisites are installed correctly
2. Ensure the directories used by the extension have proper permissions:
   ```bash
   # Create and set permissions for the temp directory
   mkdir -p ~/.whisper-assistant-vscode/temp
   chmod 755 ~/.whisper-assistant-vscode/temp
   ```
3. On Linux systems, make sure PulseAudio is running:
   ```bash
   pulseaudio --start
   ```

### Recording Device Issues

If your microphone isn't being detected:

1. Make sure your microphone is connected and enabled in your system settings
2. Run the verification script to check detected recording devices:
   ```bash
   ./setup_whisper_assistant.sh
   ```
3. Try using a different microphone or adjusting your system's audio input settings

### API Key or Provider Issues

If experiencing issues with API providers:

1. Verify your API key is correctly entered in the extension settings
2. Check that you've selected the right provider
3. If using the local provider, ensure Whisper is installed correctly

### PyTorch or CUDA Issues

If encountering problems with PyTorch or GPU acceleration:

1. Verify PyTorch installation:
   ```bash
   python3 -c "import torch; print(f'PyTorch {torch.__version__} installed')"
   ```
2. Check CUDA availability:
   ```bash
   python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
   ```
3. For GPU acceleration issues, ensure compatible CUDA drivers are installed for your GPU

## Development Setup

For contributors who want to work on the extension:

1. Clone the repository:
   ```bash
   git clone https://github.com/martin-opensky/whisper-assistant-vscode.git
   cd whisper-assistant-vscode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the settings template:
   ```bash
   cp .vscode/settings.template.json .vscode/settings.json
   ```

4. Run the extension in development mode:
   ```bash
   npm run watch
   ```

5. Press F5 to open a new window with the extension loaded

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

# Disclaimer

Please note that this extension has been primarily tested on Mac OS and Linux Ubuntu 22.04 LTS. While efforts have been made to ensure compatibility, its functionality on other platforms such as Windows cannot be fully guaranteed. I welcome and appreciate any pull requests to address potential issues encountered on these platforms.
