"""
Athina Audio Management

Handles all audio input/output operations including device management,
streaming, recording, and playback with optimizations for Raspberry Pi 5.
"""

import asyncio
import logging
import queue
import threading
import time
import wave
import numpy as np
from pathlib import Path
from typing import Optional, Callable, Dict, Any, Tuple, List
import io

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False

try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False

from .errors import AudioError, MicrophoneError, SpeakerError, InitializationError
from .logging_cfg import PerformanceTimer


class AudioDevice:
    """Represents an audio device with its properties."""
    
    def __init__(self, index: int, name: str, channels: int, sample_rate: int, is_input: bool):
        """
        Initialize AudioDevice.
        
        Args:
            index: Device index
            name: Device name
            channels: Number of channels
            sample_rate: Sample rate
            is_input: True if input device, False if output
        """
        self.index = index
        self.name = name
        self.channels = channels
        self.sample_rate = sample_rate
        self.is_input = is_input
    
    def __repr__(self):
        """String representation of the device."""
        device_type = "Input" if self.is_input else "Output"
        return f"AudioDevice({device_type}, idx={self.index}, name='{self.name}', channels={self.channels}, rate={self.sample_rate})"


class AudioStream:
    """Manages audio streaming with buffering."""
    
    def __init__(self, sample_rate: int = 16000, channels: int = 1, 
                 chunk_size: int = 1024, buffer_size: int = 50):
        """
        Initialize AudioStream.
        
        Args:
            sample_rate: Sample rate in Hz
            channels: Number of audio channels
            chunk_size: Size of audio chunks
            buffer_size: Size of the audio buffer queue
        """
        self.sample_rate = sample_rate
        self.channels = channels
        self.chunk_size = chunk_size
        self.buffer_size = buffer_size
        
        self.audio_queue = queue.Queue(maxsize=buffer_size)
        self.is_streaming = False
        self.stream = None
        self.pa = None
        
        self.logger = logging.getLogger(__name__)
    
    def start(self, device_index: Optional[int] = None):
        """
        Start audio streaming.
        
        Args:
            device_index: Optional specific device index to use
        """
        if self.is_streaming:
            return
        
        try:
            if PYAUDIO_AVAILABLE:
                self.pa = pyaudio.PyAudio()
                self.stream = self.pa.open(
                    format=pyaudio.paInt16,
                    channels=self.channels,
                    rate=self.sample_rate,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=self.chunk_size,
                    stream_callback=self._audio_callback
                )
                self.stream.start_stream()
            elif SOUNDDEVICE_AVAILABLE:
                self.stream = sd.InputStream(
                    device=device_index,
                    channels=self.channels,
                    samplerate=self.sample_rate,
                    blocksize=self.chunk_size,
                    callback=self._sounddevice_callback
                )
                self.stream.start()
            else:
                raise AudioError("No audio backend available (PyAudio or SoundDevice)")
            
            self.is_streaming = True
            self.logger.info("Audio streaming started")
            
        except Exception as e:
            raise MicrophoneError(f"Failed to start audio stream: {e}")
    
    def stop(self):
        """Stop audio streaming."""
        if not self.is_streaming:
            return
        
        try:
            self.is_streaming = False
            
            if self.stream:
                if PYAUDIO_AVAILABLE and hasattr(self.stream, 'stop_stream'):
                    self.stream.stop_stream()
                    self.stream.close()
                elif SOUNDDEVICE_AVAILABLE:
                    self.stream.stop()
                    self.stream.close()
            
            if self.pa:
                self.pa.terminate()
            
            # Clear the audio queue
            while not self.audio_queue.empty():
                try:
                    self.audio_queue.get_nowait()
                except queue.Empty:
                    break
            
            self.logger.info("Audio streaming stopped")
            
        except Exception as e:
            self.logger.error(f"Error stopping audio stream: {e}")
    
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """PyAudio callback for audio input."""
        if status:
            self.logger.warning(f"Audio callback status: {status}")
        
        if self.is_streaming:
            try:
                self.audio_queue.put(in_data, block=False)
            except queue.Full:
                # Drop oldest frame if buffer is full
                try:
                    self.audio_queue.get_nowait()
                    self.audio_queue.put(in_data, block=False)
                except:
                    pass
        
        return (in_data, pyaudio.paContinue)
    
    def _sounddevice_callback(self, indata, frames, time, status):
        """SoundDevice callback for audio input."""
        if status:
            self.logger.warning(f"Audio callback status: {status}")
        
        if self.is_streaming:
            try:
                audio_bytes = indata.tobytes()
                self.audio_queue.put(audio_bytes, block=False)
            except queue.Full:
                # Drop oldest frame if buffer is full
                try:
                    self.audio_queue.get_nowait()
                    self.audio_queue.put(audio_bytes, block=False)
                except:
                    pass
    
    def read(self, timeout: Optional[float] = None) -> Optional[bytes]:
        """
        Read audio data from the stream.
        
        Args:
            timeout: Optional timeout in seconds
            
        Returns:
            Audio data bytes or None if timeout
        """
        try:
            return self.audio_queue.get(timeout=timeout)
        except queue.Empty:
            return None


class AudioManager:
    """
    Main audio manager for handling all audio operations.
    
    Manages audio devices, streaming, recording, and playback with
    support for both PyAudio and SoundDevice backends.
    """
    
    def __init__(self, config):
        """
        Initialize AudioManager.
        
        Args:
            config: Configuration object with audio settings
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Audio parameters
        self.sample_rate = config.audio.sample_rate
        self.channels = config.audio.channels
        self.chunk_size = config.audio.chunk_size
        
        # Device indices
        self.input_device_index = config.audio.input_device_index
        self.output_device_index = config.audio.output_device_index
        
        # Device names for auto-detection
        self.input_device_name = config.audio.input_device_name
        self.output_device_name = config.audio.output_device_name
        self.auto_detect_devices = config.audio.auto_detect_devices
        
        # Audio processing settings
        self.noise_suppression = config.audio.noise_suppression
        self.echo_cancellation = config.audio.echo_cancellation
        self.volume_threshold = config.audio.volume_threshold
        self.silence_timeout = config.audio.silence_timeout
        
        # Mock mode for testing
        self.mock_mode = config.audio.mock_mode
        
        # State
        self.is_initialized = False
        self.audio_stream = None
        self.audio_callback = None
        self.recording_buffer = []
        self.is_recording = False
        
        # Detected devices
        self.input_devices: List[AudioDevice] = []
        self.output_devices: List[AudioDevice] = []
    
    async def initialize(self) -> None:
        """Initialize the audio manager and detect devices."""
        if self.is_initialized:
            return
        
        try:
            self.logger.info("Initializing audio manager...")
            
            if self.mock_mode:
                self.logger.info("Running in mock mode - no real audio devices")
                self.is_initialized = True
                return
            
            # Check available backends
            if not PYAUDIO_AVAILABLE and not SOUNDDEVICE_AVAILABLE:
                raise InitializationError("No audio backend available. Install pyaudio or sounddevice.")
            
            # Detect audio devices
            await self._detect_devices()
            
            # Auto-select devices if needed
            if self.auto_detect_devices:
                await self._auto_select_devices()
            
            # Validate selected devices
            self._validate_devices()
            
            # Initialize audio stream
            self.audio_stream = AudioStream(
                sample_rate=self.sample_rate,
                channels=self.channels,
                chunk_size=self.chunk_size
            )
            
            self.is_initialized = True
            self.logger.info("Audio manager initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize audio manager: {e}")
            raise InitializationError(f"Audio initialization failed: {e}")
    
    async def _detect_devices(self) -> None:
        """Detect available audio devices."""
        self.logger.info("Detecting audio devices...")
        
        try:
            if PYAUDIO_AVAILABLE:
                pa = pyaudio.PyAudio()
                device_count = pa.get_device_count()
                
                for i in range(device_count):
                    try:
                        info = pa.get_device_info_by_index(i)
                        
                        # Input device
                        if info['maxInputChannels'] > 0:
                            device = AudioDevice(
                                index=i,
                                name=info['name'],
                                channels=info['maxInputChannels'],
                                sample_rate=int(info['defaultSampleRate']),
                                is_input=True
                            )
                            self.input_devices.append(device)
                        
                        # Output device
                        if info['maxOutputChannels'] > 0:
                            device = AudioDevice(
                                index=i,
                                name=info['name'],
                                channels=info['maxOutputChannels'],
                                sample_rate=int(info['defaultSampleRate']),
                                is_input=False
                            )
                            self.output_devices.append(device)
                            
                    except Exception as e:
                        self.logger.warning(f"Error querying device {i}: {e}")
                
                pa.terminate()
                
            elif SOUNDDEVICE_AVAILABLE:
                devices = sd.query_devices()
                for i, device in enumerate(devices):
                    # Input device
                    if device['max_input_channels'] > 0:
                        dev = AudioDevice(
                            index=i,
                            name=device['name'],
                            channels=device['max_input_channels'],
                            sample_rate=int(device['default_samplerate']),
                            is_input=True
                        )
                        self.input_devices.append(dev)
                    
                    # Output device
                    if device['max_output_channels'] > 0:
                        dev = AudioDevice(
                            index=i,
                            name=device['name'],
                            channels=device['max_output_channels'],
                            sample_rate=int(device['default_samplerate']),
                            is_input=False
                        )
                        self.output_devices.append(dev)
            
            self.logger.info(f"Found {len(self.input_devices)} input devices and {len(self.output_devices)} output devices")
            
        except Exception as e:
            self.logger.error(f"Error detecting audio devices: {e}")
            raise AudioError(f"Device detection failed: {e}")
    
    async def _auto_select_devices(self) -> None:
        """Auto-select best audio devices based on names or defaults."""
        # Auto-select input device
        if self.input_device_index is None:
            if self.input_device_name:
                # Search by name
                for device in self.input_devices:
                    if self.input_device_name.lower() in device.name.lower():
                        self.input_device_index = device.index
                        self.logger.info(f"Auto-selected input device: {device}")
                        break
            
            # Use default if not found
            if self.input_device_index is None and self.input_devices:
                self.input_device_index = self.input_devices[0].index
                self.logger.info(f"Using default input device: {self.input_devices[0]}")
        
        # Auto-select output device
        if self.output_device_index is None:
            if self.output_device_name:
                # Search by name
                for device in self.output_devices:
                    if self.output_device_name.lower() in device.name.lower():
                        self.output_device_index = device.index
                        self.logger.info(f"Auto-selected output device: {device}")
                        break
            
            # Use default if not found
            if self.output_device_index is None and self.output_devices:
                self.output_device_index = self.output_devices[0].index
                self.logger.info(f"Using default output device: {self.output_devices[0]}")
    
    def _validate_devices(self) -> None:
        """Validate selected audio devices."""
        if not self.mock_mode:
            if self.input_device_index is None:
                raise MicrophoneError("No input device selected")
            
            if self.output_device_index is None:
                raise SpeakerError("No output device selected")
            
            # Verify devices exist
            input_valid = any(d.index == self.input_device_index for d in self.input_devices)
            output_valid = any(d.index == self.output_device_index for d in self.output_devices)
            
            if not input_valid:
                raise MicrophoneError(f"Invalid input device index: {self.input_device_index}")
            
            if not output_valid:
                raise SpeakerError(f"Invalid output device index: {self.output_device_index}")
    
    def set_audio_callback(self, callback: Callable[[bytes], None]) -> None:
        """
        Set callback for audio data.
        
        Args:
            callback: Function to call with audio data chunks
        """
        self.audio_callback = callback
    
    async def start_streaming(self) -> None:
        """Start audio streaming."""
        if not self.is_initialized:
            raise AudioError("Audio manager not initialized")
        
        if self.mock_mode:
            self.logger.info("Mock mode: simulating audio streaming")
            return
        
        try:
            self.audio_stream.start(self.input_device_index)
            
            # Start audio processing thread
            self.processing_thread = threading.Thread(
                target=self._audio_processing_loop,
                daemon=True
            )
            self.processing_thread.start()
            
        except Exception as e:
            raise AudioError(f"Failed to start audio streaming: {e}")
    
    async def stop_streaming(self) -> None:
        """Stop audio streaming."""
        if self.mock_mode:
            return
        
        try:
            if self.audio_stream:
                self.audio_stream.stop()
            
        except Exception as e:
            self.logger.error(f"Error stopping audio stream: {e}")
    
    def _audio_processing_loop(self) -> None:
        """Audio processing thread loop."""
        while self.audio_stream and self.audio_stream.is_streaming:
            try:
                # Read audio data
                audio_data = self.audio_stream.read(timeout=0.1)
                if audio_data:
                    # Apply audio processing if enabled
                    if self.noise_suppression or self.echo_cancellation:
                        audio_data = self._process_audio(audio_data)
                    
                    # Send to callback if set
                    if self.audio_callback:
                        self.audio_callback(audio_data)
                    
                    # Store in recording buffer if recording
                    if self.is_recording:
                        self.recording_buffer.append(audio_data)
                        
            except Exception as e:
                self.logger.error(f"Error in audio processing loop: {e}")
    
    def _process_audio(self, audio_data: bytes) -> bytes:
        """
        Apply audio processing (noise suppression, echo cancellation).
        
        Args:
            audio_data: Raw audio bytes
            
        Returns:
            Processed audio bytes
        """
        # Convert to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16)
        
        # Simple noise gate
        if self.noise_suppression:
            # Calculate RMS
            rms = np.sqrt(np.mean(audio_array ** 2))
            if rms < self.volume_threshold * 32768:  # Scale threshold to int16 range
                # Below threshold, reduce to near silence
                audio_array = audio_array * 0.1
        
        # TODO: Implement more sophisticated noise suppression and echo cancellation
        # For now, this is a placeholder
        
        return audio_array.tobytes()
    
    async def record_speech(self, timeout: float = 5.0, 
                          silence_duration: float = 2.0) -> Optional[bytes]:
        """
        Record speech until silence is detected.
        
        Args:
            timeout: Maximum recording time in seconds
            silence_duration: Duration of silence to stop recording
            
        Returns:
            Recorded audio data or None if no speech detected
        """
        if self.mock_mode:
            # Return mock audio data for testing
            await asyncio.sleep(2)
            return b"mock_audio_data"
        
        self.logger.info("Starting speech recording...")
        self.recording_buffer = []
        self.is_recording = True
        
        start_time = time.time()
        last_speech_time = start_time
        speech_detected = False
        
        try:
            while time.time() - start_time < timeout:
                if self.recording_buffer:
                    # Check latest audio chunk for speech
                    latest_audio = self.recording_buffer[-1]
                    audio_array = np.frombuffer(latest_audio, dtype=np.int16)
                    rms = np.sqrt(np.mean(audio_array ** 2))
                    
                    if rms > self.volume_threshold * 32768:
                        last_speech_time = time.time()
                        speech_detected = True
                    elif speech_detected and time.time() - last_speech_time > silence_duration:
                        # Silence detected after speech
                        break
                
                await asyncio.sleep(0.1)
            
            self.is_recording = False
            
            if not speech_detected or not self.recording_buffer:
                self.logger.info("No speech detected")
                return None
            
            # Combine all audio chunks
            audio_data = b''.join(self.recording_buffer)
            self.logger.info(f"Recorded {len(audio_data)} bytes of audio")
            
            return audio_data
            
        except Exception as e:
            self.is_recording = False
            raise AudioError(f"Recording failed: {e}")
        finally:
            self.recording_buffer = []
    
    async def play_audio(self, audio_data: bytes) -> None:
        """
        Play audio data.
        
        Args:
            audio_data: Audio data to play
        """
        if self.mock_mode:
            self.logger.info("Mock mode: simulating audio playback")
            await asyncio.sleep(0.5)
            return
        
        try:
            with PerformanceTimer("audio_playback", self.logger):
                if PYAUDIO_AVAILABLE:
                    pa = pyaudio.PyAudio()
                    stream = pa.open(
                        format=pyaudio.paInt16,
                        channels=self.channels,
                        rate=self.sample_rate,
                        output=True,
                        output_device_index=self.output_device_index
                    )
                    
                    # Play audio in chunks
                    chunk_size = self.chunk_size * 2  # bytes
                    for i in range(0, len(audio_data), chunk_size):
                        chunk = audio_data[i:i + chunk_size]
                        stream.write(chunk)
                    
                    stream.stop_stream()
                    stream.close()
                    pa.terminate()
                    
                elif SOUNDDEVICE_AVAILABLE:
                    # Convert bytes to numpy array
                    audio_array = np.frombuffer(audio_data, dtype=np.int16)
                    audio_float = audio_array.astype(np.float32) / 32768.0
                    
                    # Play using sounddevice
                    sd.play(audio_float, self.sample_rate, device=self.output_device_index)
                    sd.wait()  # Wait until playback is finished
                    
        except Exception as e:
            raise SpeakerError(f"Audio playback failed: {e}")
    
    async def play_wav_file(self, file_path: str) -> None:
        """
        Play a WAV file.
        
        Args:
            file_path: Path to the WAV file
        """
        try:
            with wave.open(file_path, 'rb') as wav_file:
                # Read WAV parameters
                channels = wav_file.getnchannels()
                sample_width = wav_file.getsampwidth()
                framerate = wav_file.getframerate()
                frames = wav_file.readframes(wav_file.getnframes())
                
                # Convert if needed
                if sample_width != 2:  # Not 16-bit
                    raise AudioError("Only 16-bit WAV files are supported")
                
                if channels != self.channels or framerate != self.sample_rate:
                    self.logger.warning(
                        f"WAV file format mismatch: {channels}ch @ {framerate}Hz "
                        f"(expected {self.channels}ch @ {self.sample_rate}Hz)"
                    )
                
                await self.play_audio(frames)
                
        except Exception as e:
            raise AudioError(f"Failed to play WAV file: {e}")
    
    def save_audio(self, audio_data: bytes, file_path: str) -> None:
        """
        Save audio data to a WAV file.
        
        Args:
            audio_data: Audio data to save
            file_path: Path to save the WAV file
        """
        try:
            with wave.open(file_path, 'wb') as wav_file:
                wav_file.setnchannels(self.channels)
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(audio_data)
            
            self.logger.info(f"Audio saved to {file_path}")
            
        except Exception as e:
            raise AudioError(f"Failed to save audio: {e}")
    
    def get_device_info(self) -> Dict[str, Any]:
        """
        Get information about current audio devices.
        
        Returns:
            Dictionary with device information
        """
        input_device = next(
            (d for d in self.input_devices if d.index == self.input_device_index),
            None
        )
        output_device = next(
            (d for d in self.output_devices if d.index == self.output_device_index),
            None
        )
        
        return {
            'input_device': {
                'index': self.input_device_index,
                'name': input_device.name if input_device else 'Unknown',
                'channels': input_device.channels if input_device else 0,
                'sample_rate': input_device.sample_rate if input_device else 0
            } if input_device else None,
            'output_device': {
                'index': self.output_device_index,
                'name': output_device.name if output_device else 'Unknown',
                'channels': output_device.channels if output_device else 0,
                'sample_rate': output_device.sample_rate if output_device else 0
            } if output_device else None,
            'available_input_devices': len(self.input_devices),
            'available_output_devices': len(self.output_devices)
        }
    
    async def health_check(self) -> bool:
        """
        Perform health check on audio system.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            if self.mock_mode:
                return True
            
            # Check if devices are still available
            current_input_devices = []
            current_output_devices = []
            
            if PYAUDIO_AVAILABLE:
                pa = pyaudio.PyAudio()
                device_count = pa.get_device_count()
                
                for i in range(device_count):
                    try:
                        info = pa.get_device_info_by_index(i)
                        if info['maxInputChannels'] > 0:
                            current_input_devices.append(i)
                        if info['maxOutputChannels'] > 0:
                            current_output_devices.append(i)
                    except:
                        pass
                
                pa.terminate()
            
            # Check if our devices are still valid
            input_valid = self.input_device_index in current_input_devices
            output_valid = self.output_device_index in current_output_devices
            
            return input_valid and output_valid
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False
    
    async def shutdown(self) -> None:
        """Shutdown the audio manager and release resources."""
        try:
            self.logger.info("Shutting down audio manager...")
            
            await self.stop_streaming()
            
            self.is_initialized = False
            self.audio_callback = None
            self.recording_buffer = []
            
            self.logger.info("Audio manager shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during audio shutdown: {e}")