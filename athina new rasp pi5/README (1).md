
# Athina Voice Assistant

A premium **offline-first** voice assistant with **optional OpenAI integration**, designed for luxury vehicles and running on Raspberry Pi 5.

## 🌟 **ENHANCED: Now with OpenAI Integration**

Athina now features **offline-first architecture** with **optional OpenAI API integration**:

- ✅ **100% offline functionality** - Works without internet connection
- ✅ **OpenAI integration** - Enhanced responses for complex queries when online  
- ✅ **Smart routing** - Automatically chooses between local and cloud processing
- ✅ **Graceful fallback** - Seamless degradation when API unavailable
- ✅ **Configurable behavior** - Customize when to use cloud vs local processing
- ✅ **Secure API management** - Environment-based key storage

## Overview

Athina is a sophisticated, privacy-first voice assistant that operates entirely offline by default, with optional cloud enhancement when available. Built specifically for the automotive environment, it provides a natural, conversational interface with elegant, warm, and witty responses.

## Features

### Core Capabilities
- **Offline-First Operation**: No internet connection required for core functionality
- **OpenAI Integration**: Optional cloud enhancement for complex queries and conversations
- **Smart Routing**: Intelligent decision-making between local and cloud processing
- **Graceful Fallback**: Seamless operation when network or API unavailable

### Technical Excellence
- **Optimized for Raspberry Pi 5**: Leverages the full power of the latest Pi hardware
- **Premium Voice Experience**: High-quality, natural-sounding female voice
- **Automotive-Ready**: Designed for in-car noise conditions and usage patterns
- **Privacy-First**: All processing happens locally by default
- **Customizable Persona**: Configurable personality traits and responses

### Advanced Features
- **Intelligent Query Analysis**: Routes complex questions to OpenAI, simple ones locally
- **Usage Controls**: Built-in rate limiting and token management
- **Secure API Management**: Environment-based key storage and handling
- **Comprehensive Monitoring**: Usage statistics and health monitoring
- **Flexible Configuration**: Multiple fallback modes and routing strategies

## Architecture

### Core Components

- **Wake Word Detection**: openWakeWord for "Hey Athina" activation
- **Speech-to-Text**: Whisper.cpp (tiny.en/base.en models) for accurate transcription
- **Text-to-Speech**: Piper TTS for natural, low-latency voice synthesis
- **Audio Management**: Intelligent microphone and speaker handling
- **Configuration System**: YAML-based persona and system settings

### Technology Stack

- **Platform**: Raspberry Pi 5 (ARM64)
- **Language**: Python 3.9+
- **Audio**: PyAudio, SoundDevice
- **AI Models**: Optimized for edge inference
- **Service**: Systemd daemon integration

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/athina/athina-assistant.git
cd athina-assistant

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

### Configuration

```bash
# Copy and customize the persona configuration
cp configs/persona.yaml configs/persona_custom.yaml
# Edit configs/persona_custom.yaml to customize Athina's personality
```

### Running

```bash
# Run directly
python -m athina.main

# Or use the console script
athina

# Run as daemon (requires sudo for system service)
sudo athina-daemon start
```

## Configuration

Athina's personality and behavior can be customized through YAML configuration files:

- `configs/persona.yaml`: Core personality traits and voice settings
- `configs/system.yaml`: Hardware and performance settings
- `configs/logging.yaml`: Logging levels and output configuration

## Hardware Requirements

### Minimum Requirements
- Raspberry Pi 5 (4GB RAM recommended, 8GB for optimal performance)
- High-quality USB microphone or HAT with microphone array
- Speakers or audio output device
- MicroSD card (32GB+, Class 10 or better)
- Optional: NVMe SSD via PCIe for improved performance

### Recommended Setup
- Raspberry Pi 5 8GB
- ReSpeaker 4-Mic Array HAT for enhanced audio capture
- High-quality car audio integration
- NVMe SSD for faster model loading and reduced latency

## Development

### Project Structure

```
athina_assistant/
├── athina/                 # Main package
│   ├── __init__.py
│   ├── main.py            # Application entry point
│   ├── config.py          # Configuration management
│   ├── logging_cfg.py     # Logging setup
│   ├── audio.py           # Audio device management
│   ├── errors.py          # Custom exceptions
│   ├── wake_word.py       # Wake word detection
│   ├── speech_to_text.py  # STT processing
│   ├── text_to_speech.py  # TTS synthesis
│   ├── persona.py         # Personality engine
│   └── daemon/            # System service
│       ├── __init__.py
│       ├── service.py     # Daemon implementation
│       └── athina.service # Systemd service file
├── configs/               # Configuration files
├── tests/                # Test suite
├── docs/                 # Documentation
├── logs/                 # Log files
├── setup.py              # Package setup
├── requirements.txt      # Dependencies
└── README.md            # This file
```

### Testing

```bash
# Run tests
pytest tests/

# Run with coverage
pytest --cov=athina tests/
```

### Code Style

```bash
# Format code
black athina/

# Lint code
flake8 athina/
```

## Performance Optimization

Athina is optimized for the Raspberry Pi 5's ARM architecture:

- **Model Selection**: Uses lightweight models (Whisper tiny.en, optimized Piper voices)
- **Memory Management**: Efficient memory usage with ~2GB total footprint
- **CPU Optimization**: Multi-threaded processing with ARM-specific optimizations
- **Storage**: Supports NVMe SSD for faster model loading

## Troubleshooting

### Common Issues

1. **Audio Device Not Found**
   - Check `arecord -l` and `aplay -l` for available devices
   - Update audio device configuration in `configs/system.yaml`

2. **High CPU Usage**
   - Consider using smaller models (tiny.en instead of base.en)
   - Check for background processes consuming resources

3. **Wake Word Not Detected**
   - Verify microphone is working with `arecord -d 5 test.wav`
   - Adjust wake word sensitivity in configuration

### Logs

Check logs for detailed debugging information:
```bash
tail -f logs/athina.log
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For support and questions:
- GitHub Issues: [Report bugs and request features](https://github.com/athina/athina-assistant/issues)
- Documentation: [Full documentation](https://docs.athina.ai)
- Community: [Discord server](https://discord.gg/athina)

---

*Athina - Your elegant companion on the road.*
