<p align="center">
  <img src="https://raw.githubusercontent.com/martin-opensky/whisper-assistant-vscode/main/images/whisper-assistant.png" alt="Whisper Assistant">
</p>

# Whisper Assistant: Your Voice-Driven Coding Companion

Whisper Assistant is an extension for Visual Studio Code that transcribes your spoken words into text within the VSCode editor. This hands-free approach to coding allows you to focus on your ideas instead of your typing.

Whisper Assistant can also be integrated with other powerful AI tools, such as Chat GPT-4 or the [Cursor.so application](https://www.cursor.so/), to create a dynamic, AI-driven development environment.

# Powered by OpenAI Whisper

Whisper Assistant leverages a local installation of the Whisper AI, providing a cost-free voice transcription service.

The extension uses the base model of Whisper, striking a balance between accuracy and performance. While the model cannot be changed at this stage, future updates will allow customization to suit your specific needs. Please note that the first time you run Whisper, it will need to download the model it's using. I recommend downloading the 'base' model on the command line before using the extension.

For more information about Whisper, visit the OpenAI Whisper GitHub Repository.
[Whisper OpenAI GitHub page](https://github.com/openai/whisper)

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
