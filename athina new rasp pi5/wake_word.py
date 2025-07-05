"""
Athina Wake Word Detection

Implements wake word detection using openWakeWord for efficient,
offline wake word recognition optimized for Raspberry Pi 5.
"""

import asyncio
import logging
import time
import numpy as np
from pathlib import Path
from typing import Optional, Callable, Dict, Any, List
import collections
import threading

try:
    import openwakeword
    from openwakeword.model import Model
    OPENWAKEWORD_AVAILABLE = True
except ImportError:
    OPENWAKEWORD_AVAILABLE = False

try:
    import webrtcvad
    WEBRTCVAD_AVAILABLE = True
except ImportError:
    WEBRTCVAD_AVAILABLE = False

from .errors import WakeWordError, ModelError, InitializationError
from .logging_cfg import PerformanceTimer, PERFORMANCE_MONITORS


class WakeWordDetector:
    """
    Wake word detector using openWakeWord for efficient offline detection.
    
    Supports custom wake words and provides optimized detection for
    Raspberry Pi 5 with configurable sensitivity and VAD integration.
    """
    
    def __init__(self, config):
        """
        Initialize WakeWordDetector.
        
        Args:
            config: Configuration object with wake word settings
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Wake word configuration
        self.model_name = config.wake_word.model_name
        self.sensitivity = config.wake_word.sensitivity
        self.trigger_level = config.wake_word.trigger_level
        self.vad_enabled = config.wake_word.vad_enabled
        self.noise_suppression = config.wake_word.noise_suppression
        self.custom_model_path = config.wake_word.custom_model_path
        self.inference_framework = config.wake_word.inference_framework
        
        # Model cache directory
        self.model_cache_dir = Path(config.system.model_cache_dir)
        self.model_cache_dir.mkdir(parents=True, exist_ok=True)
        
        # State
        self.is_initialized = False
        self.model = None
        self.vad = None
        self.detection_callback = None
        
        # Audio buffer for processing
        self.audio_buffer_size = 16000  # 1 second at 16kHz
        self.audio_buffer = collections.deque(maxlen=self.audio_buffer_size)
        
        # Detection statistics
        self.total_detections = 0
        self.false_positives = 0
        self.detection_history = []
        self.last_detection_time = 0
        self.min_detection_interval = 2.0  # seconds
        
        # Performance monitoring
        self.performance_monitor = PERFORMANCE_MONITORS['wake_word_detection']
    
    async def initialize(self) -> None:
        """Initialize the wake word detector and load models."""
        if self.is_initialized:
            return
        
        try:
            self.logger.info("Initializing wake word detector...")
            
            if not OPENWAKEWORD_AVAILABLE:
                raise InitializationError(
                    "openWakeWord not available. Install with: pip install openwakeword"
                )
            
            # Initialize VAD if enabled
            if self.vad_enabled:
                await self._initialize_vad()
            
            # Load wake word model
            await self._load_model()
            
            self.is_initialized = True
            self.logger.info("Wake word detector initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize wake word detector: {e}")
            raise InitializationError(f"Wake word initialization failed: {e}")
    
    async def _initialize_vad(self) -> None:
        """Initialize Voice Activity Detection."""
        if not WEBRTCVAD_AVAILABLE:
            self.logger.warning("WebRTC VAD not available, disabling VAD")
            self.vad_enabled = False
            return
        
        try:
            # Initialize WebRTC VAD with aggressiveness level (0-3)
            # Higher values are more aggressive about filtering out non-speech
            aggressiveness = min(3, max(0, self.trigger_level))
            self.vad = webrtcvad.Vad(aggressiveness)
            self.logger.info(f"VAD initialized with aggressiveness level {aggressiveness}")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize VAD: {e}")
            self.vad_enabled = False
    
    async def _load_model(self) -> None:
        """Load the wake word detection model."""
        try:
            model_path = None
            
            # Check for custom model
            if self.custom_model_path:
                model_path = Path(self.custom_model_path)
                if not model_path.exists():
                    raise ModelError(f"Custom model not found: {model_path}")
            else:
                # Use pre-trained model or download
                model_path = await self._get_or_download_model()
            
            # Initialize openWakeWord model
            self.logger.info(f"Loading wake word model: {self.model_name}")
            
            # Configure model parameters
            model_params = {
                'inference_framework': self.inference_framework,
                'wakeword_models': [str(model_path)] if model_path else [],
                'enable_speex_noise_suppression': self.noise_suppression
            }
            
            # Create model instance
            if model_path:
                self.model = Model(**model_params)
            else:
                # Use default "hey athina" or similar
                self.model = self._create_default_model()
            
            self.logger.info(f"Wake word model loaded: {self.model_name}")
            
        except Exception as e:
            raise ModelError(f"Failed to load wake word model: {e}")
    
    async def _get_or_download_model(self) -> Optional[Path]:
        """Get model from cache or download if needed."""
        # Check common wake word models
        common_models = {
            'hey_athina': 'hey_athina.onnx',
            'alexa': 'alexa_v0.1.onnx',
            'hey_jarvis': 'hey_jarvis_v0.1.onnx',
            'hey_mycroft': 'hey_mycroft_v0.1.onnx'
        }
        
        if self.model_name in common_models:
            model_filename = common_models[self.model_name]
            model_path = self.model_cache_dir / model_filename
            
            if model_path.exists():
                self.logger.info(f"Using cached model: {model_path}")
                return model_path
            
            # Download model if available
            try:
                import requests
                base_url = "https://github.com/dscripka/openWakeWord/releases/download/v0.1.0/"
                url = base_url + model_filename
                
                self.logger.info(f"Downloading wake word model from {url}...")
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                model_path.write_bytes(response.content)
                self.logger.info(f"Model downloaded to {model_path}")
                return model_path
                
            except Exception as e:
                self.logger.warning(f"Failed to download model: {e}")
                return None
        
        return None
    
    def _create_default_model(self) -> Any:
        """Create a default wake word model."""
        # For now, return a mock model for testing
        # In production, this would create a basic "hey athina" detector
        self.logger.warning("Using mock wake word model for testing")
        
        class MockModel:
            def predict(self, audio_data):
                # Simple energy-based detection for testing
                audio_array = np.frombuffer(audio_data, dtype=np.int16)
                energy = np.sqrt(np.mean(audio_array ** 2))
                
                # Mock detection based on energy threshold
                if energy > 1000:
                    return {self.model_name: np.random.random() * 0.5 + 0.5}
                return {self.model_name: 0.0}
        
        return MockModel()
    
    def set_detection_callback(self, callback: Callable[[str, float], None]) -> None:
        """
        Set callback for wake word detection.
        
        Args:
            callback: Function to call with (wake_word, confidence) when detected
        """
        self.detection_callback = callback
    
    async def detect(self, audio_data: bytes) -> bool:
        """
        Process audio data for wake word detection.
        
        Args:
            audio_data: Audio data chunk to process
            
        Returns:
            True if wake word detected, False otherwise
        """
        if not self.is_initialized:
            raise WakeWordError("Wake word detector not initialized")
        
        try:
            with PerformanceTimer("wake_word_detection") as timer:
                # Add to audio buffer
                self._update_audio_buffer(audio_data)
                
                # Check VAD if enabled
                if self.vad_enabled and self.vad:
                    if not self._check_vad(audio_data):
                        return False
                
                # Get predictions from model
                predictions = self._get_predictions(audio_data)
                
                # Check for wake word detection
                detected = self._check_detection(predictions)
                
                # Record performance
                self.performance_monitor.record(timer.duration)
                
                return detected
                
        except Exception as e:
            self.logger.error(f"Wake word detection error: {e}")
            return False
    
    def _update_audio_buffer(self, audio_data: bytes) -> None:
        """Update the audio buffer with new data."""
        # Convert bytes to int16 array
        audio_array = np.frombuffer(audio_data, dtype=np.int16)
        
        # Add to buffer
        self.audio_buffer.extend(audio_array)
    
    def _check_vad(self, audio_data: bytes) -> bool:
        """
        Check if audio contains speech using VAD.
        
        Args:
            audio_data: Audio data to check
            
        Returns:
            True if speech detected, False otherwise
        """
        try:
            # WebRTC VAD expects 10, 20, or 30ms frames at 16kHz
            # 16kHz * 0.02s = 320 samples = 640 bytes
            frame_duration_ms = 20
            frame_size = int(16000 * frame_duration_ms / 1000) * 2  # 2 bytes per sample
            
            # Process in frames
            has_speech = False
            for i in range(0, len(audio_data) - frame_size + 1, frame_size):
                frame = audio_data[i:i + frame_size]
                if self.vad.is_speech(frame, 16000):
                    has_speech = True
                    break
            
            return has_speech
            
        except Exception as e:
            self.logger.warning(f"VAD check failed: {e}")
            return True  # Default to processing if VAD fails
    
    def _get_predictions(self, audio_data: bytes) -> Dict[str, float]:
        """
        Get wake word predictions from the model.
        
        Args:
            audio_data: Audio data to process
            
        Returns:
            Dictionary of wake word predictions {word: confidence}
        """
        try:
            if self.model is None:
                return {}
            
            # Prepare audio for model
            # openWakeWord expects float32 audio normalized to [-1, 1]
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_float = audio_array.astype(np.float32) / 32768.0
            
            # Get predictions
            predictions = self.model.predict(audio_float)
            
            return predictions
            
        except Exception as e:
            self.logger.error(f"Prediction error: {e}")
            return {}
    
    def _check_detection(self, predictions: Dict[str, float]) -> bool:
        """
        Check if wake word is detected based on predictions.
        
        Args:
            predictions: Model predictions {word: confidence}
            
        Returns:
            True if wake word detected, False otherwise
        """
        if not predictions:
            return False
        
        # Check for our wake word
        if self.model_name in predictions:
            confidence = predictions[self.model_name]
            
            # Check against sensitivity threshold
            if confidence >= self.sensitivity:
                # Check minimum interval between detections
                current_time = time.time()
                if current_time - self.last_detection_time < self.min_detection_interval:
                    self.logger.debug(f"Ignoring detection (too soon after last)")
                    return False
                
                # Valid detection
                self.last_detection_time = current_time
                self.total_detections += 1
                self.detection_history.append({
                    'timestamp': current_time,
                    'confidence': confidence
                })
                
                # Trigger callback
                if self.detection_callback:
                    # Run callback in separate thread to avoid blocking
                    threading.Thread(
                        target=self.detection_callback,
                        args=(self.model_name, confidence),
                        daemon=True
                    ).start()
                
                self.logger.info(f"Wake word detected: {self.model_name} (confidence: {confidence:.3f})")
                return True
        
        return False
    
    def adjust_sensitivity(self, delta: float) -> float:
        """
        Adjust detection sensitivity.
        
        Args:
            delta: Amount to adjust sensitivity (-1.0 to 1.0)
            
        Returns:
            New sensitivity value
        """
        self.sensitivity = max(0.0, min(1.0, self.sensitivity + delta))
        self.logger.info(f"Wake word sensitivity adjusted to {self.sensitivity}")
        return self.sensitivity
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get wake word detection statistics.
        
        Returns:
            Dictionary with detection statistics
        """
        recent_detections = [
            d for d in self.detection_history
            if time.time() - d['timestamp'] < 3600  # Last hour
        ]
        
        avg_confidence = (
            sum(d['confidence'] for d in recent_detections) / len(recent_detections)
            if recent_detections else 0.0
        )
        
        return {
            'is_initialized': self.is_initialized,
            'model_name': self.model_name,
            'sensitivity': self.sensitivity,
            'total_detections': self.total_detections,
            'recent_detections': len(recent_detections),
            'average_confidence': avg_confidence,
            'vad_enabled': self.vad_enabled,
            'last_detection_time': self.last_detection_time,
            'performance_avg_ms': self.performance_monitor.get_average() * 1000
        }
    
    def reset_statistics(self) -> None:
        """Reset detection statistics."""
        self.total_detections = 0
        self.false_positives = 0
        self.detection_history = []
        self.last_detection_time = 0
        self.logger.info("Wake word statistics reset")
    
    async def test_detection(self, audio_file: str) -> bool:
        """
        Test wake word detection on an audio file.
        
        Args:
            audio_file: Path to audio file to test
            
        Returns:
            True if wake word detected, False otherwise
        """
        try:
            import wave
            
            # Load audio file
            with wave.open(audio_file, 'rb') as wav_file:
                frames = wav_file.readframes(wav_file.getnframes())
            
            # Process in chunks
            chunk_size = 1024 * 2  # 1024 samples * 2 bytes
            detected = False
            
            for i in range(0, len(frames), chunk_size):
                chunk = frames[i:i + chunk_size]
                if await self.detect(chunk):
                    detected = True
                    break
            
            return detected
            
        except Exception as e:
            self.logger.error(f"Test detection failed: {e}")
            return False
    
    async def shutdown(self) -> None:
        """Shutdown the wake word detector and release resources."""
        try:
            self.logger.info("Shutting down wake word detector...")
            
            self.is_initialized = False
            self.model = None
            self.vad = None
            self.detection_callback = None
            self.audio_buffer.clear()
            
            self.logger.info("Wake word detector shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during wake word shutdown: {e}")