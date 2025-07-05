#!/usr/bin/env python3
"""
Athina Voice Assistant Model Download Script

Downloads required models and prepares the environment for first run.
"""

import os
import sys
import argparse
import subprocess
import logging
from pathlib import Path
import requests
from tqdm import tqdm

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AthinaSetup:
    """Setup and configuration helper for Athina voice assistant."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.models_dir = self.base_dir / "models"
        self.configs_dir = self.base_dir / "configs"
        self.logs_dir = self.base_dir / "logs"
        
    def create_directories(self):
        """Create required directories."""
        dirs = [self.models_dir, self.configs_dir, self.logs_dir,
                self.models_dir / "whisper", self.models_dir / "piper"]
        
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {dir_path}")
    
    def download_file(self, url: str, destination: Path, description: str = ""):
        """Download file with progress bar."""
        if destination.exists():
            logger.info(f"{description} already exists: {destination}")
            return
        
        logger.info(f"Downloading {description}...")
        
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(destination, 'wb') as file:
                with tqdm(total=total_size, unit='iB', unit_scale=True, desc=description) as pbar:
                    for chunk in response.iter_content(chunk_size=8192):
                        file.write(chunk)
                        pbar.update(len(chunk))
            
            logger.info(f"Downloaded: {destination}")
            
        except Exception as e:
            logger.error(f"Failed to download {description}: {e}")
            logger.info("You may need to download models manually")
    
    def download_whisper_models(self):
        """Download Whisper models."""
        models = {
            "tiny.en": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
            "base.en": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
        }
        
        logger.info("Downloading Whisper models...")
        for model_name, url in models.items():
            destination = self.models_dir / "whisper" / f"ggml-{model_name}.bin"
            self.download_file(url, destination, f"Whisper {model_name} model")
    
    def download_piper_models(self):
        """Download Piper TTS models."""
        base_url = "https://github.com/rhasspy/piper/releases/download/v1.2.0"
        
        models = {
            "en_US-lessac-medium": [
                f"{base_url}/en_US-lessac-medium.onnx",
                f"{base_url}/en_US-lessac-medium.onnx.json"
            ]
        }
        
        logger.info("Downloading Piper TTS models...")
        for model_name, urls in models.items():
            for url in urls:
                filename = url.split('/')[-1]
                destination = self.models_dir / "piper" / filename
                self.download_file(url, destination, f"Piper {model_name}")
    
    def setup_config_files(self):
        """Copy default configuration files if they don't exist."""
        default_config = self.configs_dir / "default_config.yaml"
        
        # Copy to persona.yaml if it doesn't exist
        persona_config = self.configs_dir / "persona.yaml"
        if not persona_config.exists() and default_config.exists():
            import shutil
            shutil.copy(default_config, persona_config)
            logger.info(f"Created persona config: {persona_config}")
        
        # Copy to openai.yaml if it doesn't exist
        openai_config = self.configs_dir / "openai.yaml"
        if not openai_config.exists() and default_config.exists():
            import shutil
            shutil.copy(default_config, openai_config)
            logger.info(f"Created OpenAI config: {openai_config}")
    
    def check_dependencies(self):
        """Check for required system dependencies."""
        logger.info("Checking system dependencies...")
        
        # Check for audio libraries
        try:
            import pyaudio
            logger.info("✓ PyAudio is installed")
        except ImportError:
            logger.warning("✗ PyAudio not found - install with: pip install pyaudio")
        
        try:
            import sounddevice
            logger.info("✓ sounddevice is installed")
        except ImportError:
            logger.warning("✗ sounddevice not found - install with: pip install sounddevice")
        
        # Check for wake word
        try:
            import openwakeword
            logger.info("✓ openWakeWord is installed")
        except ImportError:
            logger.warning("✗ openWakeWord not found - install with: pip install openwakeword")
        
        # Check for STT
        try:
            import whisper
            logger.info("✓ Whisper is installed")
        except ImportError:
            logger.warning("✗ Whisper not found - install with: pip install openai-whisper")
        
        # Check for system commands
        commands = ['espeak', 'aplay', 'arecord']
        for cmd in commands:
            try:
                if subprocess.run(['which', cmd], capture_output=True).returncode == 0:
                    logger.info(f"✓ {cmd} is available")
                else:
                    logger.warning(f"✗ {cmd} not found - install with: sudo apt-get install {cmd}")
            except:
                pass
    
    def install_requirements(self):
        """Install Python requirements."""
        logger.info("Installing Python requirements...")
        
        requirements_file = self.base_dir / "requirements.txt"
        if requirements_file.exists():
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)])
        else:
            logger.warning("requirements.txt not found")
    
    def test_audio(self):
        """Test audio input/output."""
        logger.info("Testing audio devices...")
        
        try:
            import sounddevice as sd
            
            # List devices
            devices = sd.query_devices()
            logger.info("Available audio devices:")
            for i, device in enumerate(devices):
                logger.info(f"  {i}: {device['name']} (in: {device['max_input_channels']}, out: {device['max_output_channels']})")
            
            # Test recording
            logger.info("Testing audio recording for 2 seconds...")
            duration = 2
            fs = 16000
            recording = sd.rec(int(duration * fs), samplerate=fs, channels=1)
            sd.wait()
            logger.info("✓ Audio recording successful")
            
            # Test playback
            logger.info("Playing back recorded audio...")
            sd.play(recording, fs)
            sd.wait()
            logger.info("✓ Audio playback successful")
            
        except Exception as e:
            logger.error(f"Audio test failed: {e}")
    
    def run_setup(self, download_models=True, check_deps=True, install_reqs=False, test_audio=False):
        """Run the complete setup process."""
        logger.info("Starting Athina setup...")
        logger.info("=" * 50)
        
        # Create directories
        self.create_directories()
        
        # Setup config files
        self.setup_config_files()
        
        # Check dependencies
        if check_deps:
            self.check_dependencies()
        
        # Install requirements
        if install_reqs:
            self.install_requirements()
        
        # Download models
        if download_models:
            logger.info("Downloading models (this may take a while)...")
            self.download_whisper_models()
            self.download_piper_models()
        
        # Test audio
        if test_audio:
            self.test_audio()
        
        logger.info("=" * 50)
        logger.info("Setup complete! You can now run Athina with: ./start_athina.sh")
        logger.info("For OpenAI integration, set your API key: export OPENAI_API_KEY='your-key'")


def main():
    parser = argparse.ArgumentParser(description="Setup Athina Voice Assistant")
    parser.add_argument("--download-models", action="store_true", 
                       help="Download required models")
    parser.add_argument("--skip-deps-check", action="store_true",
                       help="Skip dependency checking")
    parser.add_argument("--install-requirements", action="store_true",
                       help="Install Python requirements")
    parser.add_argument("--test-audio", action="store_true",
                       help="Test audio input/output")
    parser.add_argument("--all", action="store_true",
                       help="Run complete setup (except requirements install)")
    
    args = parser.parse_args()
    
    # Check for required module
    try:
        import tqdm
    except ImportError:
        logger.error("tqdm not installed. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "tqdm"])
        import tqdm
    
    setup = AthinaSetup()
    
    if args.all:
        setup.run_setup(download_models=True, check_deps=True, install_reqs=False, test_audio=True)
    else:
        setup.run_setup(
            download_models=args.download_models,
            check_deps=not args.skip_deps_check,
            install_reqs=args.install_requirements,
            test_audio=args.test_audio
        )


if __name__ == "__main__":
    main()