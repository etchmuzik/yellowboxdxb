# Athina Voice Assistant

An elegant, offline-first voice assistant optimized for Raspberry Pi 5 with optional OpenAI integration for enhanced capabilities.

## Features

- **Offline-First Design**: Works completely offline with local speech recognition and synthesis
- **Wake Word Detection**: Customizable wake word using openWakeWord
- **Fast Speech Recognition**: Whisper-based STT optimized for edge devices
- **Natural Voice Synthesis**: High-quality TTS using Piper
- **Intelligent Routing**: Smart decision-making between local and cloud processing
- **Extensible Skills**: Easy-to-add custom skills and integrations
- **Privacy-Focused**: Your data stays on your device unless you explicitly enable cloud features

## Architecture

```
┌─────────────────┐
│  Audio Manager  │ ← Microphone/Speaker
└────────┬────────┘
         │
┌────────▼────────┐
│ Wake Word Det.  │ ← "Hey Athina"
└────────┬────────┘
         │
┌────────▼────────┐
│  Speech to Text │ ← Whisper
└────────┬────────┘
         │
┌────────▼────────┐
│  NLP Router     │ ← Smart Decision
└────┬───────┬────┘
     │       │
┌────▼───┐ ┌─▼──────┐
│ Local  │ │ OpenAI │
│Process │ │  API   │
└────┬───┘ └─┬──────┘
     │       │
┌────▼───────▼────┐
│ Text to Speech  │ ← Piper TTS
└─────────────────┘
```

## Quick Start

### Prerequisites

- Raspberry Pi 5 (or 4) with Raspberry Pi OS
- Python 3.9 or higher
- Microphone and speaker
- 4GB+ RAM recommended

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/athina.git
cd athina
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install system dependencies:
```bash
# On Raspberry Pi OS
sudo apt-get update
sudo apt-get install -y \
    portaudio19-dev \
    python3-pyaudio \
    libopenblas-dev \
    liblapack-dev \
    libatlas-base-dev \
    espeak
```

5. Download models:
```bash
python setup.py --download-models
```

### Running Athina

1. Basic usage:
```bash
./start_athina.sh
```

2. With custom config:
```bash
python main.py --config configs/my_config.yaml
```

3. As a system service:
```bash
sudo cp athina.service /etc/systemd/system/
sudo systemctl enable athina
sudo systemctl start athina
```

## Configuration

### Basic Configuration

Edit `configs/persona.yaml`:

```yaml
persona:
  name: "Athina"
  personality_traits:
    warmth: 0.8
    wit: 0.7
    conciseness: 0.8
```

### Audio Configuration

```yaml
audio:
  input_device_name: "USB Microphone"
  output_device_name: "HDMI Audio"
  volume_threshold: 0.02
```

### Wake Word Configuration

```yaml
wake_word:
  model_name: "hey_athina"
  sensitivity: 0.6  # Increase for easier detection
```

### OpenAI Integration (Optional)

1. Set your API key:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

2. Configure in `configs/openai.yaml`:
```yaml
openai:
  enabled: true
  fallback:
    mode: "smart"  # Use OpenAI for complex queries only
```

## Custom Skills

Create custom skills by adding them to the persona engine:

```python
# In a custom skills file
async def weather_skill(user_input: str) -> str:
    # Your weather logic here
    return "The weather is sunny today!"

# Register the skill
persona_engine.register_skill(
    name="weather",
    patterns=[r"weather", r"temperature"],
    handler=weather_skill
)
```

## Performance Optimization

### For Raspberry Pi 5

1. Enable GPU acceleration:
```yaml
system:
  gpu_enabled: true
```

2. Use smaller models for faster response:
```yaml
stt:
  model_name: "tiny.en"  # Fastest
tts:
  model_name: "en_US-lessac-medium"  # Good balance
```

3. Adjust chunk sizes:
```yaml
audio:
  chunk_size: 2048  # Larger chunks for Pi 5
```

### Memory Management

```yaml
system:
  max_memory_usage_mb: 1024  # Limit for Pi 4
  model_cache_dir: "/tmp/models"  # Use RAM disk
```

## Troubleshooting

### No audio input detected

1. Check devices:
```bash
python -c "from athina.audio import AudioManager; am = AudioManager(None); print(am.get_audio_devices())"
```

2. Test microphone:
```bash
arecord -d 5 test.wav && aplay test.wav
```

### Wake word not detecting

1. Increase sensitivity:
```yaml
wake_word:
  sensitivity: 0.7
```

2. Check audio levels:
```bash
./start_athina.sh --debug
```

### Slow responses

1. Use smaller models:
```yaml
stt:
  model_name: "tiny.en"
```

2. Disable unnecessary features:
```yaml
audio:
  noise_suppression: false
  echo_cancellation: false
```

## API Reference

### Main Pipeline

```python
from athina import AthinaPipeline

# Initialize
pipeline = AthinaPipeline(config_path="configs/my_config.yaml")
await pipeline.initialize()

# Start listening
await pipeline.start()

# Health check
health = await pipeline.health_check()
```

### Audio Manager

```python
from athina.audio import AudioManager

audio = AudioManager(config)
await audio.initialize()

# Record speech
audio_data = await audio.record_speech(timeout=5.0)

# Play audio
await audio.play_audio(audio_bytes)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenWakeWord for wake word detection
- Whisper for speech recognition
- Piper for text-to-speech
- The Raspberry Pi community

## Support

For issues and questions:
- GitHub Issues: [https://github.com/yourusername/athina/issues](https://github.com/yourusername/athina/issues)
- Documentation: [https://athina.readthedocs.io](https://athina.readthedocs.io)