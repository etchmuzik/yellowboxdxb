"""
Athina Speech-to-Text Engine

Implements speech recognition using Whisper with support for both
whisper.cpp and OpenAI Whisper for offline transcription.
"""

import asyncio
import logging
import time
import tempfile
import wave
import io
from typing import Optional, Dict, Any, Union
from pathlib import Path
import numpy as np

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

try:
    from whispercpp import Whisper
    WHISPERCPP_AVAILABLE = True
except ImportError:
    WHISPERCPP_AVAILABLE = False

from .errors import STTError, InitializationError, ModelError
from .logging_cfg import PerformanceTimer


class SpeechToTextEngine:
    """
    Speech-to-Text engine using Whisper models.
    
    Supports both whisper.cpp for fast inference and OpenAI Whisper
    as a fallback, with configurable model sizes and parameters.
    """
    
    def __init__(self, config):
        """
        Initialize STT engine.
        
        Args:
            config: Configuration object with STT settings
        """
        self.logger = logging.getLogger(__name__)
        self.config = config
        
        # STT parameters
        self.model_name = config.stt.model_name
        self.model_path = config.stt.model_path
        self.language = config.stt.language
        self.task = config.stt.task
        self.temperature = config.stt.temperature
        self.best_of = config.stt.best_of
        self.beam_size = config.stt.beam_size
        self.patience = config.stt.patience
        self.length_penalty = config.stt.length_penalty
        self.suppress_tokens = config.stt.suppress_tokens
        self.initial_prompt = config.stt.initial_prompt
        self.condition_on_previous_text = config.stt.condition_on_previous_text
        self.fp16 = config.stt.fp16
        self.compression_ratio_threshold = config.stt.compression_ratio_threshold
        self.logprob_threshold = config.stt.logprob_threshold
        self.no_speech_threshold = config.stt.no_speech_threshold
        self.mock_mode = config.stt.mock_mode
        
        # Model and backend
        self.model = None
        self.backend = None
        self.is_initialized = False
        
        # Statistics
        self.total_transcriptions = 0
        self.failed_transcriptions = 0
        self.average_transcription_time = 0.0
        self.total_audio_seconds = 0.0
        
        self.logger.info("STT engine initialized")
    
    async def initialize(self) -> None:
        """Initialize STT models and resources."""
        try:
            if self.mock_mode:
                self.logger.info("Running in mock STT mode")
                self.backend = 'mock'
                self.is_initialized = True
                return
            
            # Try whisper.cpp first for better performance
            if WHISPERCPP_AVAILABLE:
                await self._initialize_whispercpp()
                
            elif WHISPER_AVAILABLE:
                await self._initialize_whisper()
                
            else:
                raise InitializationError(
                    "No STT backend available. Install whisper-cpp-python or openai-whisper"
                )
            
            self.is_initialized = True
            self.logger.info(f"STT engine initialized with {self.backend} backend")
            
        except Exception as e:
            self.logger.error(f"STT initialization failed: {e}")
            raise STTError(f"Failed to initialize STT: {e}")
    
    async def _initialize_whispercpp(self) -> None:
        """Initialize whisper.cpp backend."""
        try:
            # Determine model path
            if self.model_path:
                model_file = Path(self.model_path)
            else:
                model_file = self._get_model_path()
            
            if not model_file.exists():
                await self._download_model(model_file)
            
            # Load model
            self.model = Whisper.from_pretrained(
                model_name=self.model_name,
                basedir=str(model_file.parent)
            )
            
            self.backend = 'whispercpp'
            self.logger.info(f"Loaded whisper.cpp model: {self.model_name}")
            
        except Exception as e:
            self.logger.warning(f"whisper.cpp initialization failed: {e}")
            if WHISPER_AVAILABLE:
                self.logger.info("Falling back to OpenAI Whisper")
                await self._initialize_whisper()
            else:
                raise
    
    async def _initialize_whisper(self) -> None:
        """Initialize OpenAI Whisper backend."""
        try:
            # Load model
            self.model = whisper.load_model(self.model_name)
            self.backend = 'whisper'
            
            # Move to GPU if available and fp16 is enabled
            if self.fp16 and hasattr(self.model, 'cuda'):
                try:
                    self.model = self.model.cuda()
                    self.logger.info("Whisper model moved to GPU")
                except:
                    self.logger.info("GPU not available, using CPU")
            
            self.logger.info(f"Loaded Whisper model: {self.model_name}")
            
        except Exception as e:
            raise ModelError(f"Failed to load Whisper model: {e}")
    
    def _get_model_path(self) -> Path:
        """Get path for model storage."""
        models_dir = Path(self.config.system.model_cache_dir) / "whisper"
        models_dir.mkdir(parents=True, exist_ok=True)
        
        model_filename = f"ggml-{self.model_name}.bin"
        return models_dir / model_filename
    
    async def _download_model(self, model_path: Path) -> None:
        """Download Whisper model if not present."""
        self.logger.info(f"Downloading Whisper model: {self.model_name}")
        
        # Model download URLs (whisper.cpp format)
        model_urls = {
            "tiny": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
            "tiny.en": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
            "base": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
            "base.en": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
            "small": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
            "small.en": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin"
        }
        
        url = model_urls.get(self.model_name)
        if not url:
            raise ModelError(f"Unknown model: {self.model_name}")
        
        try:
            import requests
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Download with progress
            total_size = int(response.headers.get('content-length', 0))
            with open(model_path, 'wb') as f:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        self.logger.debug(f"Download progress: {progress:.1f}%")
            
            self.logger.info(f"Model downloaded: {model_path}")
            
        except Exception as e:
            raise ModelError(f"Failed to download model: {e}")
    
    async def transcribe(self, audio_data: Union[bytes, np.ndarray]) -> Optional[str]:
        """
        Transcribe audio to text.
        
        Args:
            audio_data: Audio data as WAV bytes or numpy array
            
        Returns:
            Transcribed text or None
        """
        if not self.is_initialized:
            raise STTError("STT engine not initialized")
        
        if self.mock_mode:
            await asyncio.sleep(0.5)
            return "This is a mock transcription for testing"
        
        start_time = time.time()
        
        try:
            with PerformanceTimer("stt_transcription", self.logger):
                # Convert audio to appropriate format
                audio_file = await self._prepare_audio(audio_data)
                
                # Transcribe based on backend
                if self.backend == 'whispercpp':
                    result = await self._transcribe_whispercpp(audio_file)
                else:
                    result = await self._transcribe_whisper(audio_file)
                
                # Update statistics
                transcription_time = time.time() - start_time
                self._update_statistics(True, transcription_time, audio_file)
                
                # Clean up
                if isinstance(audio_file, Path) and audio_file.exists():
                    audio_file.unlink()
                
                return result
                
        except Exception as e:
            self.logger.error(f"Transcription failed: {e}")
            self._update_statistics(False, time.time() - start_time, None)
            return None
    
    async def _prepare_audio(self, audio_data: Union[bytes, np.ndarray]) -> Union[Path, np.ndarray]:
        """Prepare audio for transcription."""
        if isinstance(audio_data, bytes):
            # Save to temporary file for whisper.cpp
            if self.backend == 'whispercpp':
                temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                temp_file.write(audio_data)
                temp_file.close()
                return Path(temp_file.name)
            else:
                # Load audio for OpenAI Whisper
                buffer = io.BytesIO(audio_data)
                with wave.open(buffer, 'rb') as wav_file:
                    frames = wav_file.readframes(wav_file.getnframes())
                    audio_array = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                return audio_array
        else:
            return audio_data
    
    async def _transcribe_whispercpp(self, audio_file: Path) -> Optional[str]:
        """Transcribe using whisper.cpp."""
        try:
            # Run transcription
            result = self.model.transcribe(
                str(audio_file),
                language=self.language if self.language != 'auto' else None,
                task=self.task,
                temperature=self.temperature,
                best_of=self.best_of,
                beam_size=self.beam_size,
                patience=self.patience,
                length_penalty=self.length_penalty,
                suppress_tokens=self.suppress_tokens,
                initial_prompt=self.initial_prompt,
                condition_on_previous_text=self.condition_on_previous_text
            )
            
            # Extract text
            if isinstance(result, dict):
                text = result.get('text', '').strip()
            else:
                text = str(result).strip()
            
            return text if text else None
            
        except Exception as e:
            self.logger.error(f"whisper.cpp transcription error: {e}")
            return None
    
    async def _transcribe_whisper(self, audio_data: np.ndarray) -> Optional[str]:
        """Transcribe using OpenAI Whisper."""
        try:
            # Run transcription
            result = self.model.transcribe(
                audio_data,
                language=self.language if self.language != 'auto' else None,
                task=self.task,
                temperature=self.temperature,
                best_of=self.best_of,
                beam_size=self.beam_size,
                patience=self.patience,
                length_penalty=self.length_penalty,
                suppress_tokens=self.suppress_tokens,
                initial_prompt=self.initial_prompt,
                condition_on_previous_text=self.condition_on_previous_text,
                fp16=self.fp16,
                compression_ratio_threshold=self.compression_ratio_threshold,
                logprob_threshold=self.logprob_threshold,
                no_speech_threshold=self.no_speech_threshold
            )
            
            # Extract text
            text = result.get('text', '').strip()
            
            # Check for no speech
            if result.get('no_speech_prob', 0) > self.no_speech_threshold:
                self.logger.debug("No speech detected")
                return None
            
            return text if text else None
            
        except Exception as e:
            self.logger.error(f"Whisper transcription error: {e}")
            return None
    
    def _update_statistics(self, success: bool, transcription_time: float, 
                          audio_file: Optional[Path]) -> None:
        """Update transcription statistics."""
        self.total_transcriptions += 1
        
        if not success:
            self.failed_transcriptions += 1
        
        # Update average time
        self.average_transcription_time = (
            (self.average_transcription_time * (self.total_transcriptions - 1) + transcription_time) /
            self.total_transcriptions
        )
        
        # Estimate audio duration
        if audio_file and audio_file.exists():
            try:
                with wave.open(str(audio_file), 'rb') as wav:
                    frames = wav.getnframes()
                    rate = wav.getframerate()
                    duration = frames / float(rate)
                    self.total_audio_seconds += duration
            except:
                pass
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get STT engine statistics."""
        success_rate = 0.0
        if self.total_transcriptions > 0:
            success_rate = ((self.total_transcriptions - self.failed_transcriptions) / 
                          self.total_transcriptions) * 100
        
        return {
            'is_initialized': self.is_initialized,
            'backend': self.backend,
            'model_name': self.model_name,
            'language': self.language,
            'total_transcriptions': self.total_transcriptions,
            'failed_transcriptions': self.failed_transcriptions,
            'success_rate': success_rate,
            'average_time_seconds': self.average_transcription_time,
            'total_audio_hours': self.total_audio_seconds / 3600,
            'real_time_factor': (self.average_transcription_time / 
                               (self.total_audio_seconds / self.total_transcriptions) 
                               if self.total_transcriptions > 0 else 0)
        }
    
    async def shutdown(self) -> None:
        """Shutdown STT engine and clean up resources."""
        try:
            self.is_initialized = False
            
            # Clear model from memory
            if self.model is not None:
                del self.model
                self.model = None
            
            self.logger.info("STT engine shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during STT shutdown: {e}")