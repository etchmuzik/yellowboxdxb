"""
Athina Text-to-Speech Engine

Implements text-to-speech synthesis using Piper TTS for fast,
high-quality offline voice generation.
"""

import asyncio
import logging
import time
import tempfile
import wave
import json
from typing import Optional, Dict, Any, List
from pathlib import Path
import subprocess

try:
    import piper
    PIPER_AVAILABLE = True
except ImportError:
    PIPER_AVAILABLE = False

import numpy as np

from .errors import TTSError, InitializationError, ModelError
from .logging_cfg import PerformanceTimer


class TextToSpeechEngine:
    """
    Text-to-Speech engine using Piper TTS.
    
    Provides fast, high-quality voice synthesis optimized for
    Raspberry Pi with streaming support and voice customization.
    """
    
    def __init__(self, config):
        """
        Initialize TTS engine.
        
        Args:
            config: Configuration object with TTS settings
        """
        self.logger = logging.getLogger(__name__)
        self.config = config
        
        # TTS parameters
        self.model_name = config.tts.model_name
        self.voice_speed = config.tts.voice_speed
        self.voice_pitch = config.tts.voice_pitch
        self.voice_volume = config.tts.voice_volume
        self.model_path = config.tts.model_path
        self.speaker_id = config.tts.speaker_id
        self.length_scale = config.tts.length_scale
        self.noise_scale = config.tts.noise_scale
        self.noise_scale_w = config.tts.noise_scale_w
        self.streaming = config.tts.streaming
        self.mock_mode = config.tts.mock_mode
        self.sentence_silence = config.tts.sentence_silence
        
        # Audio parameters
        self.sample_rate = config.audio.sample_rate
        
        # Model and synthesis
        self.model = None
        self.is_initialized = False
        self.piper_process = None
        
        # Wake sound
        self.wake_sound_path = None
        self.wake_sound_data = None
        
        # Statistics
        self.total_synthesis = 0
        self.failed_synthesis = 0
        self.average_synthesis_time = 0.0
        self.total_characters = 0
        
        # Audio playback callback
        self.audio_manager = None
        
        self.logger.info("TTS engine initialized")
    
    async def initialize(self) -> None:
        """Initialize TTS models and resources."""
        try:
            if self.mock_mode:
                self.logger.info("Running in mock TTS mode")
                self.is_initialized = True
                return
            
            # Load TTS model
            await self._load_model()
            
            # Prepare wake sound
            await self._prepare_wake_sound()
            
            self.is_initialized = True
            self.logger.info("TTS engine initialized successfully")
            
        except Exception as e:
            self.logger.error(f"TTS initialization failed: {e}")
            raise TTSError(f"Failed to initialize TTS: {e}")
    
    async def _load_model(self) -> None:
        """Load Piper TTS model."""
        try:
            # Determine model path
            if self.model_path:
                model_file = Path(self.model_path)
            else:
                model_file = await self._download_model()
            
            # Check if model exists
            if not model_file.exists():
                raise ModelError(f"TTS model not found: {model_file}")
            
            # Verify Piper is available
            piper_path = await self._get_piper_path()
            if not piper_path:
                raise InitializationError("Piper TTS not found. Please install piper-tts")
            
            # Test model loading
            await self._test_model(model_file)
            
            self.model_path = model_file
            self.logger.info(f"Loaded TTS model: {self.model_name}")
            
        except Exception as e:
            # Fallback to espeak for basic TTS
            self.logger.warning(f"Piper TTS loading failed, using espeak fallback: {e}")
            self.model = 'espeak'
    
    async def _download_model(self) -> Path:
        """Download Piper model if not present."""
        models_dir = Path(self.config.system.model_cache_dir) / "piper"
        models_dir.mkdir(parents=True, exist_ok=True)
        
        model_file = models_dir / f"{self.model_name}.onnx"
        config_file = models_dir / f"{self.model_name}.onnx.json"
        
        if model_file.exists() and config_file.exists():
            return model_file
        
        self.logger.info(f"Downloading Piper model: {self.model_name}")
        
        # Model download URLs
        base_url = "https://github.com/rhasspy/piper/releases/download/v1.2.0"
        model_url = f"{base_url}/{self.model_name}.onnx"
        config_url = f"{base_url}/{self.model_name}.onnx.json"
        
        try:
            import requests
            
            # Download model
            response = requests.get(model_url, stream=True)
            response.raise_for_status()
            
            with open(model_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Download config
            response = requests.get(config_url)
            response.raise_for_status()
            
            with open(config_file, 'w') as f:
                f.write(response.text)
            
            self.logger.info(f"Model downloaded: {model_file}")
            return model_file
            
        except Exception as e:
            raise ModelError(f"Failed to download TTS model: {e}")
    
    async def _get_piper_path(self) -> Optional[Path]:
        """Find Piper executable path."""
        # Try common locations
        piper_paths = [
            Path("/usr/local/bin/piper"),
            Path("/usr/bin/piper"),
            Path.home() / ".local/bin/piper",
            Path("piper"),  # In PATH
        ]
        
        for path in piper_paths:
            if path.exists() or await self._command_exists(str(path)):
                return path
        
        # Try to find in PATH
        try:
            result = subprocess.run(['which', 'piper'], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                return Path(result.stdout.strip())
        except:
            pass
        
        return None
    
    async def _command_exists(self, cmd: str) -> bool:
        """Check if command exists."""
        try:
            subprocess.run([cmd, '--version'], capture_output=True, check=False)
            return True
        except:
            return False
    
    async def _test_model(self, model_file: Path) -> None:
        """Test if model loads correctly."""
        piper_path = await self._get_piper_path()
        if not piper_path:
            raise InitializationError("Piper executable not found")
        
        # Test synthesis
        test_text = "Testing voice synthesis"
        cmd = [
            str(piper_path),
            '--model', str(model_file),
            '--output_raw'
        ]
        
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        stdout, stderr = process.communicate(test_text.encode())
        
        if process.returncode != 0:
            raise ModelError(f"Model test failed: {stderr.decode()}")
    
    async def _prepare_wake_sound(self) -> None:
        """Prepare wake sound for playback."""
        try:
            # Generate a simple beep sound
            duration = 0.2  # 200ms
            frequency = 800  # Hz
            
            samples = int(self.sample_rate * duration)
            t = np.linspace(0, duration, samples)
            
            # Generate sine wave with envelope
            envelope = np.exp(-t * 5)  # Exponential decay
            audio = np.sin(2 * np.pi * frequency * t) * envelope * 0.3
            
            # Convert to int16
            audio_int16 = (audio * 32767).astype(np.int16)
            
            # Save to memory
            buffer = io.BytesIO()
            with wave.open(buffer, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(self.sample_rate)
                wav.writeframes(audio_int16.tobytes())
            
            buffer.seek(0)
            self.wake_sound_data = buffer.read()
            
        except Exception as e:
            self.logger.warning(f"Failed to prepare wake sound: {e}")
    
    def set_audio_manager(self, audio_manager) -> None:
        """Set audio manager for playback."""
        self.audio_manager = audio_manager
    
    async def speak(self, text: str) -> None:
        """
        Synthesize and play speech.
        
        Args:
            text: Text to speak
        """
        if not self.is_initialized:
            raise TTSError("TTS engine not initialized")
        
        if not text or not text.strip():
            return
        
        if self.mock_mode:
            self.logger.info(f"Mock TTS: '{text}'")
            await asyncio.sleep(len(text) * 0.05)  # Simulate speaking time
            return
        
        start_time = time.time()
        
        try:
            with PerformanceTimer("tts_synthesis", self.logger):
                # Synthesize speech
                audio_data = await self._synthesize(text)
                
                if audio_data and self.audio_manager:
                    # Play audio
                    await self.audio_manager.play_audio(audio_data)
                
                # Update statistics
                synthesis_time = time.time() - start_time
                self._update_statistics(True, synthesis_time, len(text))
                
        except Exception as e:
            self.logger.error(f"Speech synthesis failed: {e}")
            self._update_statistics(False, time.time() - start_time, len(text))
            
            # Try fallback
            await self._speak_fallback(text)
    
    async def _synthesize(self, text: str) -> Optional[bytes]:
        """Synthesize text to audio."""
        if self.model == 'espeak':
            return await self._synthesize_espeak(text)
        
        piper_path = await self._get_piper_path()
        if not piper_path:
            return None
        
        try:
            # Prepare Piper command
            cmd = [
                str(piper_path),
                '--model', str(self.model_path),
                '--output_raw',
                '--length_scale', str(self.length_scale),
                '--noise_scale', str(self.noise_scale),
                '--noise_w', str(self.noise_scale_w)
            ]
            
            if self.speaker_id is not None:
                cmd.extend(['--speaker', str(self.speaker_id)])
            
            # Run synthesis
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Send text and get audio
            stdout, stderr = process.communicate(text.encode())
            
            if process.returncode != 0:
                raise TTSError(f"Piper synthesis failed: {stderr.decode()}")
            
            # Convert raw audio to WAV
            audio_data = np.frombuffer(stdout, dtype=np.int16)
            
            # Apply speed adjustment if needed
            if self.voice_speed != 1.0:
                audio_data = self._adjust_speed(audio_data)
            
            # Convert to WAV format
            return self._to_wav(audio_data)
            
        except Exception as e:
            self.logger.error(f"Synthesis error: {e}")
            return None
    
    async def _synthesize_espeak(self, text: str) -> Optional[bytes]:
        """Synthesize using espeak as fallback."""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                tmp_path = tmp.name
            
            # Run espeak
            cmd = [
                'espeak',
                '-w', tmp_path,
                '-s', str(int(150 * self.voice_speed)),  # Speed in words per minute
                text
            ]
            
            result = subprocess.run(cmd, capture_output=True)
            
            if result.returncode == 0 and Path(tmp_path).exists():
                with open(tmp_path, 'rb') as f:
                    audio_data = f.read()
                
                Path(tmp_path).unlink()
                return audio_data
            
        except Exception as e:
            self.logger.error(f"espeak synthesis failed: {e}")
        
        return None
    
    def _adjust_speed(self, audio_data: np.ndarray) -> np.ndarray:
        """Adjust audio playback speed."""
        if self.voice_speed == 1.0:
            return audio_data
        
        # Simple speed adjustment by resampling
        target_length = int(len(audio_data) / self.voice_speed)
        indices = np.linspace(0, len(audio_data) - 1, target_length)
        
        # Linear interpolation
        return np.interp(indices, np.arange(len(audio_data)), audio_data).astype(np.int16)
    
    def _to_wav(self, audio_data: np.ndarray) -> bytes:
        """Convert audio array to WAV format."""
        buffer = io.BytesIO()
        
        with wave.open(buffer, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(self.sample_rate)
            wav.writeframes(audio_data.tobytes())
        
        buffer.seek(0)
        return buffer.read()
    
    async def _speak_fallback(self, text: str) -> None:
        """Fallback speech method using system TTS."""
        try:
            # Try macOS say command
            if await self._command_exists('say'):
                subprocess.run(['say', text], check=False)
            # Try espeak
            elif await self._command_exists('espeak'):
                subprocess.run(['espeak', text], check=False)
            # Try Windows SAPI
            elif await self._command_exists('powershell'):
                cmd = f'Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak("{text}")'
                subprocess.run(['powershell', '-Command', cmd], check=False)
        except:
            pass
    
    async def play_wake_sound(self) -> None:
        """Play wake word detection sound."""
        if self.wake_sound_data and self.audio_manager:
            try:
                await self.audio_manager.play_audio(self.wake_sound_data)
            except Exception as e:
                self.logger.warning(f"Failed to play wake sound: {e}")
    
    def _update_statistics(self, success: bool, synthesis_time: float, text_length: int) -> None:
        """Update synthesis statistics."""
        self.total_synthesis += 1
        
        if not success:
            self.failed_synthesis += 1
        
        # Update average time
        self.average_synthesis_time = (
            (self.average_synthesis_time * (self.total_synthesis - 1) + synthesis_time) /
            self.total_synthesis
        )
        
        self.total_characters += text_length
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get TTS engine statistics."""
        success_rate = 0.0
        if self.total_synthesis > 0:
            success_rate = ((self.total_synthesis - self.failed_synthesis) / 
                          self.total_synthesis) * 100
        
        chars_per_second = 0.0
        if self.average_synthesis_time > 0:
            avg_chars = self.total_characters / max(self.total_synthesis, 1)
            chars_per_second = avg_chars / self.average_synthesis_time
        
        return {
            'is_initialized': self.is_initialized,
            'model_name': self.model_name,
            'total_synthesis': self.total_synthesis,
            'failed_synthesis': self.failed_synthesis,
            'success_rate': success_rate,
            'average_time_seconds': self.average_synthesis_time,
            'total_characters': self.total_characters,
            'characters_per_second': chars_per_second,
            'voice_speed': self.voice_speed
        }
    
    async def shutdown(self) -> None:
        """Shutdown TTS engine and clean up resources."""
        try:
            self.is_initialized = False
            
            # Stop any running Piper process
            if self.piper_process:
                self.piper_process.terminate()
                self.piper_process = None
            
            self.logger.info("TTS engine shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during TTS shutdown: {e}")