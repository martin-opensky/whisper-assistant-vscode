#!/bin/bash

# Comprehensive setup & verification script for whisper-assistant-vscode

# Color settings
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}[INFO]${NC} Verifying Whisper Assistant environment..."

# Create required directories
echo -e "${BLUE}[INFO]${NC} Ensuring required directories exist..."
mkdir -p ~/.whisper-assistant-vscode/temp
chmod 755 ~/.whisper-assistant-vscode/temp

# Check SoX installation
echo -e "${BLUE}[INFO]${NC} Checking SoX installation..."
if command_exists sox; then
    echo -e "${GREEN}[SUCCESS]${NC} SoX is installed: $(sox --version 2>&1 | head -n 1)"
else
    echo -e "${RED}[ERROR]${NC} SoX is not installed. Please install it using:"
    echo "  - MacOS: brew install sox"
    echo "  - Windows: choco install sox.portable"
    echo "  - Ubuntu/Linux: sudo apt install sox"
fi

# Check Python installation
echo -e "${BLUE}[INFO]${NC} Checking Python installation..."
if command_exists python3; then
    echo -e "${GREEN}[SUCCESS]${NC} Python is installed: $(python3 --version)"
else
    echo -e "${RED}[ERROR]${NC} Python 3 is not installed. Please install it from https://www.python.org/downloads/"
fi

# Check Whisper installation
echo -e "${BLUE}[INFO]${NC} Checking Whisper installation..."
if command_exists whisper; then
    echo -e "${GREEN}[SUCCESS]${NC} Whisper is installed"
else
    echo -e "${YELLOW}[WARNING]${NC} Whisper command not found. If you're using local processing, install it:"
    echo "  pip install -U openai-whisper"
    echo "  Or configure an API provider in the extension settings."
fi

# Check ffmpeg (required by Whisper)
echo -e "${BLUE}[INFO]${NC} Checking ffmpeg installation..."
if command_exists ffmpeg; then
    echo -e "${GREEN}[SUCCESS]${NC} ffmpeg is installed: $(ffmpeg -version | head -n 1)"
else
    echo -e "${RED}[ERROR]${NC} ffmpeg is not installed, which is required by Whisper."
    echo "  - MacOS: brew install ffmpeg"
    echo "  - Windows: choco install ffmpeg"
    echo "  - Ubuntu/Linux: sudo apt install ffmpeg"
fi

# Check PyTorch installation
echo -e "${BLUE}[INFO]${NC} Checking PyTorch installation..."

# Save original Python environment variables
ORIG_PYTHONHOME=$PYTHONHOME
ORIG_PYTHONPATH=$PYTHONPATH

# Unset Python environment variables that might be causing conflicts
unset PYTHONHOME PYTHONPATH

# Find system Python path
SYSTEM_PYTHON=$(which python3)

if PT_RESULT=$(env -u PYTHONHOME -u PYTHONPATH "$SYSTEM_PYTHON" -c "import torch; print(torch.__version__); print(torch.cuda.is_available())" 2>/dev/null); then
    PT_VERSION=$(echo "$PT_RESULT" | head -n1)
    CUDA_AVAILABLE=$(echo "$PT_RESULT" | tail -n1)
    echo -e "${GREEN}[SUCCESS]${NC} PyTorch is installed: ${PT_VERSION}"
    
    if [ "$CUDA_AVAILABLE" = "True" ]; then
        echo -e "${GREEN}[SUCCESS]${NC} CUDA is available for PyTorch acceleration"
    else
        echo -e "${YELLOW}[WARNING]${NC} CUDA is not available. PyTorch will use CPU only."
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} PyTorch not detected. It will be installed automatically when installing Whisper."
    echo "  If you want to install it manually: pip install torch"
fi

# Restore original Python environment variables
if [ -n "$ORIG_PYTHONHOME" ]; then
    export PYTHONHOME=$ORIG_PYTHONHOME
fi
if [ -n "$ORIG_PYTHONPATH" ]; then
    export PYTHONPATH=$ORIG_PYTHONPATH
fi

# Start PulseAudio service on Linux
if [[ "$(uname)" == "Linux" ]]; then
    echo -e "${BLUE}[INFO]${NC} Starting PulseAudio service..."
    pulseaudio --start
fi

# List available recording devices
echo -e "${BLUE}[INFO]${NC} Checking audio recording devices..."
if [[ "$(uname)" == "Darwin" ]]; then  # macOS
    devices=$(system_profiler SPAudioDataType 2>/dev/null | grep "Input Sources:" -A 10)
    if [[ -n "$devices" ]]; then
        echo -e "${GREEN}[SUCCESS]${NC} Found audio input devices:"
        echo "$devices"
    else
        echo -e "${YELLOW}[WARNING]${NC} No audio input devices detected."
    fi
elif [[ "$(uname)" == "Linux" ]]; then  # Linux
    if command_exists arecord; then
        echo -e "${GREEN}[SUCCESS]${NC} Recording devices (arecord):"
        arecord -l || echo -e "${YELLOW}[WARNING]${NC} No recording devices detected (expected in container environment)"
    else
        echo -e "${YELLOW}[WARNING]${NC} arecord command not found, can't list recording devices."
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then  # Windows
    echo -e "${YELLOW}[WARNING]${NC} Automatic detection of recording devices not supported on Windows."
    echo "Please verify microphone access in Windows Settings > Privacy > Microphone."
fi

# Check Docker if localhost provider might be used
echo -e "${BLUE}[INFO]${NC} Checking Docker for local Faster Whisper server..."
if command_exists docker; then
    echo -e "${GREEN}[SUCCESS]${NC} Docker is installed: $(docker --version)"
    
    # Check if Whisper Assistant server is running
    if docker ps | grep -q "whisper-assistant"; then
        echo -e "${GREEN}[SUCCESS]${NC} Whisper Assistant Docker server is running."
        echo "To use it, set 'API Provider' to 'localhost' in the extension settings."
    else
        echo -e "${YELLOW}[WARNING]${NC} Whisper Assistant Docker server is not running."
        echo "If you want to use the local server, build and run it with:"
        echo "  docker build -t whisper-assistant-server ."
        echo "  docker run -d -p 4444:4444 --name whisper-assistant whisper-assistant-server"
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Docker is not installed. This is only needed if you plan to use the local Faster Whisper server."
fi

# Check for VSCode or Cursor
echo -e "${BLUE}[INFO]${NC} Checking for VS Code or Cursor installation..."
if command_exists code || command_exists cursor; then
    if command_exists code; then
        echo -e "${GREEN}[SUCCESS]${NC} VS Code is installed."
    fi
    if command_exists cursor; then
        echo -e "${GREEN}[SUCCESS]${NC} Cursor is installed."
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Neither VS Code nor Cursor was detected in PATH."
    echo "Make sure to install one of them to use the extension."
fi

# Also update the check in the summary section to use the same environment clearing
PYTORCH_STATUS="?"
if env -u PYTHONHOME -u PYTHONPATH "$SYSTEM_PYTHON" -c "import torch; print('${GREEN}✓${NC}')" 2>/dev/null; then
    PYTORCH_STATUS="${GREEN}✓${NC}"
else
    PYTORCH_STATUS="${YELLOW}?${NC}"
fi

# Print final summary
echo
echo -e "${BLUE}[SUMMARY]${NC} Whisper Assistant Environment Check:"
echo -e "┌───────────────────────────────────────┐"
echo -e "│ 1. Required directories: ${GREEN}✓${NC}               │"
if command_exists sox; then
    echo -e "│ 2. SoX installation: ${GREEN}✓${NC}                  │"
else
    echo -e "│ 2. SoX installation: ${RED}✗${NC}                  │"
fi
if command_exists python3; then
    echo -e "│ 3. Python installation: ${GREEN}✓${NC}               │"
else
    echo -e "│ 3. Python installation: ${RED}✗${NC}               │"
fi
if command_exists whisper; then
    echo -e "│ 4. Whisper installation: ${GREEN}✓${NC}              │"
else
    echo -e "│ 4. Whisper installation: ${YELLOW}?${NC}              │"
fi
if command_exists ffmpeg; then
    echo -e "│ 5. ffmpeg installation: ${GREEN}✓${NC}               │"
else
    echo -e "│ 5. ffmpeg installation: ${RED}✗${NC}               │"
fi
echo -e "│ 6. PyTorch installation: $PYTORCH_STATUS               │"
echo -e "└───────────────────────────────────────┘"
echo

if command_exists sox && command_exists python3 && (command_exists whisper || command_exists docker); then
    echo -e "${GREEN}[SUCCESS]${NC} Whisper Assistant environment looks good! You're ready to use the extension."
else
    echo -e "${YELLOW}[WARNING]${NC} Some components may be missing. Please review the checks above."
    echo "Refer to the README.md for complete installation instructions."
fi

echo
echo "Note: For actual audio recording and transcription, you'll need working audio input devices." 
echo "If using API providers, ensure you've configured your API key in the extension settings." 