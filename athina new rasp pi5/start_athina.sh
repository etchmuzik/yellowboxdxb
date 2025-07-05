#!/bin/bash
#
# Athina Voice Assistant Startup Script
# This script ensures proper startup of Athina with all required services
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$SCRIPT_DIR/venv"
LOG_DIR="$SCRIPT_DIR/logs"
MODEL_DIR="$SCRIPT_DIR/models"
CONFIG_DIR="$SCRIPT_DIR/configs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root!"
   exit 1
fi

# Create necessary directories
log "Creating necessary directories..."
mkdir -p "$LOG_DIR" "$MODEL_DIR"

# Check for virtual environment
if [ ! -d "$VENV_PATH" ]; then
    error "Virtual environment not found at $VENV_PATH"
    error "Please run: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
log "Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
REQUIRED_VERSION="3.9"
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)"; then
    error "Python $REQUIRED_VERSION or higher is required. Found: $PYTHON_VERSION"
    exit 1
fi

# Check for required packages
log "Checking required packages..."
MISSING_PACKAGES=()

for package in pyaudio sounddevice numpy scipy whisper openwakeword piper-tts; do
    if ! python -c "import $package" 2>/dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
    warning "Missing packages: ${MISSING_PACKAGES[*]}"
    warning "Installing missing packages..."
    pip install -r requirements.txt
fi

# Check audio devices
log "Checking audio devices..."
if ! python -c "import pyaudio; p = pyaudio.PyAudio(); p.terminate()" 2>/dev/null; then
    error "No audio devices found or PyAudio initialization failed"
    error "Please check your audio configuration"
    exit 1
fi

# Check for configuration files
if [ ! -f "$CONFIG_DIR/persona.yaml" ]; then
    warning "Configuration file not found, using defaults"
fi

# Download models if needed
if [ ! -f "$MODEL_DIR/ggml-tiny.en.bin" ]; then
    log "Downloading Whisper model..."
    python download_models.py
fi

# Export environment variables
export ATHINA_LOG_DIR="$LOG_DIR"
export ATHINA_MODEL_DIR="$MODEL_DIR"
export ATHINA_CONFIG_PATH="$CONFIG_DIR/persona.yaml"

# Start Athina
log "Starting Athina Voice Assistant..."
log "Press Ctrl+C to stop"
log "Logs are available at: $LOG_DIR/athina.log"

# Run with proper error handling
python -m athina.main 2>&1 | tee -a "$LOG_DIR/athina.log"