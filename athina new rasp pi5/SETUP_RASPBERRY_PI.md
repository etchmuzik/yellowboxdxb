# Athina Voice Assistant - Complete Raspberry Pi 5 Setup Guide

## Table of Contents
1. [Hardware Requirements](#hardware-requirements)
2. [OS Installation](#os-installation)
3. [System Configuration](#system-configuration)
4. [Athina Installation](#athina-installation)
5. [Audio Configuration](#audio-configuration)
6. [Model Setup](#model-setup)
7. [Service Configuration](#service-configuration)
8. [Testing & Troubleshooting](#testing--troubleshooting)
9. [Performance Optimization](#performance-optimization)

## Hardware Requirements

### Minimum
- Raspberry Pi 5 (4GB RAM)
- MicroSD card (32GB+, Class 10)
- USB microphone or ReSpeaker HAT
- Speaker (USB, 3.5mm jack, or HDMI)
- Power supply (5V/5A recommended)

### Recommended
- Raspberry Pi 5 (8GB RAM)
- NVMe SSD via M.2 HAT (256GB+)
- ReSpeaker 4-Mic Array HAT
- High-quality USB audio interface
- Active cooling (fan or heatsink)

## OS Installation

### 1. Download Raspberry Pi OS
```bash
# Download Raspberry Pi OS Lite (64-bit)
# Use Raspberry Pi Imager: https://www.raspberrypi.com/software/
```

### 2. Flash the SD Card
- Select "Raspberry Pi OS Lite (64-bit)"
- Configure WiFi and SSH in advanced options
- Set hostname: `athina`
- Enable SSH
- Set username: `pi`

### 3. First Boot
```bash
# Connect via SSH
ssh pi@athina.local

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget
```

## System Configuration

### 1. Expand Filesystem
```bash
sudo raspi-config
# Select: Advanced Options > Expand Filesystem
# Reboot after completion
```

### 2. Configure Audio
```bash
# List audio devices
arecord -l  # Recording devices
aplay -l    # Playback devices

# Test audio
speaker-test -t wav -c 2
arecord -d 5 test.wav && aplay test.wav
```

### 3. Install System Dependencies
```bash
# Audio libraries
sudo apt install -y \
    portaudio19-dev \
    python3-pyaudio \
    libsndfile1-dev \
    libasound2-dev \
    alsa-utils \
    pulseaudio \
    libopenblas-dev \
    libgfortran5 \
    libgomp1

# Python and build tools
sudo apt install -y \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    cmake \
    git \
    libssl-dev \
    libffi-dev \
    libsystemd-dev

# Performance tools
sudo apt install -y \
    htop \
    iotop \
    cpufrequtils
```

## Athina Installation

### 1. Clone Repository
```bash
cd ~
git clone https://github.com/etchmuzik/athina.git athina_assistant
cd athina_assistant
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
```

### 3. Install Python Dependencies
```bash
# Install with optimizations for ARM64
OPENBLAS_NUM_THREADS=4 pip install -r requirements.txt

# Install Athina package
pip install -e .
```

### 4. Configure Athina
```bash
# Copy configuration templates
cp configs/persona.yaml.example configs/persona.yaml
cp configs/system.yaml.example configs/system.yaml

# Edit configuration
nano configs/persona.yaml
```

## Audio Configuration

### 1. For USB Microphone
```bash
# Find your device
arecord -l

# Edit ALSA configuration
sudo nano /etc/asound.conf
```

Add:
```
pcm.!default {
    type asym
    playback.pcm "plughw:0,0"
    capture.pcm "plughw:1,0"  # Adjust based on your USB mic
}
```

### 2. For ReSpeaker HAT
```bash
# Install drivers
git clone https://github.com/respeaker/seeed-voicecard.git
cd seeed-voicecard
sudo ./install.sh
sudo reboot
```

### 3. Configure Athina Audio
Edit `configs/system.yaml`:
```yaml
audio:
  sample_rate: 16000
  channels: 1
  chunk_size: 1024
  input_device_index: 1  # From arecord -l
  output_device_index: 0  # From aplay -l
```

## Model Setup

### 1. Download Required Models
```bash
cd ~/athina_assistant
source venv/bin/activate
python download_models.py
```

### 2. Verify Models
```bash
ls -la models/
# Should see:
# - ggml-tiny.en.bin (Whisper STT)
# - en_US-amy-medium.onnx (Piper TTS)
# - hey_athina.onnx (Wake word)
```

## Service Configuration

### 1. Install Service
```bash
# Copy service file
sudo cp athina.service /etc/systemd/system/

# Update paths in service file
sudo nano /etc/systemd/system/athina.service
# Ensure all paths point to /home/pi/athina_assistant

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable athina.service
```

### 2. Start Service
```bash
# Start Athina
sudo systemctl start athina.service

# Check status
sudo systemctl status athina.service

# View logs
sudo journalctl -u athina.service -f
```

## Testing & Troubleshooting

### 1. Test Components
```bash
cd ~/athina_assistant
source venv/bin/activate

# Test audio
python test_components.py --test audio

# Test wake word
python test_components.py --test wakeword

# Test STT
python test_components.py --test stt

# Test TTS
python test_components.py --test tts
```

### 2. Manual Testing
```bash
# Run interactively
./start_athina.sh

# Say "Hey Athina" followed by a command
```

### 3. Common Issues

#### No Audio Input
```bash
# Check microphone permissions
groups pi  # Should include 'audio'
sudo usermod -a -G audio pi

# Check ALSA settings
alsamixer
# Press F6 to select sound card
# Adjust input levels
```

#### High CPU Usage
```bash
# Use smaller model
# Edit configs/system.yaml
stt:
  model_name: "tiny.en"  # Instead of "base.en"
```

#### Service Won't Start
```bash
# Check permissions
sudo chown -R pi:pi /home/pi/athina_assistant

# Check Python path
which python3
/home/pi/athina_assistant/venv/bin/python --version
```

## Performance Optimization

### 1. CPU Governor
```bash
# Set to performance mode
echo "performance" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make permanent
sudo nano /etc/rc.local
# Add before 'exit 0':
echo "performance" | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### 2. Memory Optimization
```bash
# Add to /boot/firmware/config.txt
gpu_mem=128  # Reduce GPU memory
```

### 3. Model Optimization
```bash
# Use quantized models for faster inference
# Edit configs/system.yaml
stt:
  model_name: "tiny.en"
  fp16: false  # Use INT8 quantization
  
tts:
  model_name: "en_US-amy-low"  # Smaller model
```

### 4. NVMe SSD Setup (Optional)
```bash
# Install NVMe HAT
# Boot from NVMe for better performance
sudo apt install nvme-cli
sudo nvme list

# Move /home to NVMe
# (Advanced - backup first!)
```

## Advanced Configuration

### 1. Custom Wake Words
```bash
# Train custom wake word
cd ~/athina_assistant
python train_wake_word.py --phrase "hey mercedes"
```

### 2. Multi-Room Setup
```bash
# Configure MQTT for multi-room
sudo apt install mosquitto mosquitto-clients
# Edit configs/system.yaml to add MQTT settings
```

### 3. Home Assistant Integration
```bash
# Install Home Assistant addon
# Configure webhook in configs/integrations.yaml
```

## Maintenance

### 1. Updates
```bash
cd ~/athina_assistant
git pull
source venv/bin/activate
pip install -r requirements.txt --upgrade
sudo systemctl restart athina.service
```

### 2. Logs
```bash
# Rotate logs
sudo journalctl --vacuum-time=7d

# Monitor performance
htop
iotop
```

### 3. Backup
```bash
# Backup configuration and models
tar -czf athina_backup.tar.gz configs/ models/
```

## Support

- GitHub Issues: https://github.com/etchmuzik/athina/issues
- Documentation: https://github.com/etchmuzik/athina/wiki

---

**Remember**: Athina works completely offline once set up. Internet is only needed for:
- Initial installation
- Model downloads
- Optional OpenAI enhancement features