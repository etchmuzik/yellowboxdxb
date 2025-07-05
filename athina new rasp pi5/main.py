
"""
Athina Voice Assistant Main Pipeline

Integrates all voice processing components into a cohesive pipeline for
real-time voice interaction on Raspberry Pi 5.
"""

import asyncio
import logging
import signal
import sys
import time
from typing import Optional, Dict, Any
from pathlib import Path

from .config import Config
from .audio import AudioManager
from .wake_word import WakeWordDetector
from .speech_to_text import SpeechToTextEngine
from .text_to_speech import TextToSpeechEngine
from .skills_persona import SkillsPersonaEngine as PersonaManager
from .errors import AthinaError, AudioError, WakeWordError, STTError, TTSError
from .logging_cfg import setup_logging, PerformanceTimer


class AthinaPipeline:
    """
    Main voice processing pipeline that coordinates all components.
    
    Handles the complete flow from wake word detection through speech
    recognition, processing, and response synthesis.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Athina pipeline.
        
        Args:
            config_path: Optional path to configuration file
        """
        # Load configuration
        self.config = Config(config_path)
        
        # Setup logging
        setup_logging(self.config.logging)
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self.audio_manager = AudioManager(self.config)
        self.wake_word_detector = WakeWordDetector(self.config)
        self.stt_engine = SpeechToTextEngine(self.config)
        self.tts_engine = TextToSpeechEngine(self.config)
        self.persona_manager = PersonaManager(self.config)
        
        # Pipeline state
        self.is_initialized = False
        self.is_running = False
        self.is_listening = False
        self.is_processing = False
        
        # Performance tracking
        self.session_start_time = 0
        self.total_interactions = 0
        self.successful_interactions = 0
        self.average_response_time = 0.0
        
        # Shutdown handling
        self.shutdown_event = asyncio.Event()
        
        self.logger.info("Athina pipeline initialized")
    
    async def initialize(self) -> None:
        """
        Initialize all pipeline components.
        
        Raises:
            AthinaError: If initialization fails
        """
        try:
            self.logger.info("Initializing Athina voice assistant...")
            
            # Initialize components in order
            await self._initialize_audio()
            await self._initialize_wake_word()
            await self._initialize_stt()
            await self._initialize_tts()
            await self._initialize_persona()
            
            # Setup component interactions
            await self._setup_pipeline()
            
            self.is_initialized = True
            self.session_start_time = time.time()
            
            self.logger.info("Athina voice assistant initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Athina: {e}")
            raise AthinaError(f"Initialization failed: {e}") from e
    
    async def _initialize_audio(self) -> None:
        """Initialize audio manager."""
        try:
            self.logger.info("Initializing audio system...")
            await self.audio_manager.initialize()
            
            # Set up audio callback for wake word detection
            self.audio_manager.set_audio_callback(self._audio_callback)
            
        except Exception as e:
            raise AudioError(f"Audio initialization failed: {e}") from e
    
    async def _initialize_wake_word(self) -> None:
        """Initialize wake word detector."""
        try:
            self.logger.info("Initializing wake word detection...")
            await self.wake_word_detector.initialize()
            
            # Set up wake word detection callback
            self.wake_word_detector.set_detection_callback(self._wake_word_callback)
            
        except Exception as e:
            raise WakeWordError(f"Wake word initialization failed: {e}") from e
    
    async def _initialize_stt(self) -> None:
        """Initialize speech-to-text engine."""
        try:
            self.logger.info("Initializing speech-to-text...")
            await self.stt_engine.initialize()
            
        except Exception as e:
            raise STTError(f"STT initialization failed: {e}") from e
    
    async def _initialize_tts(self) -> None:
        """Initialize text-to-speech engine."""
        try:
            self.logger.info("Initializing text-to-speech...")
            await self.tts_engine.initialize()
            
        except Exception as e:
            raise TTSError(f"TTS initialization failed: {e}") from e
    
    async def _initialize_persona(self) -> None:
        """Initialize persona manager."""
        try:
            self.logger.info("Initializing persona...")
            await self.persona_manager.initialize()
            
        except Exception as e:
            self.logger.warning(f"Persona initialization failed: {e}")
            # Persona is not critical, continue without it
    
    async def _setup_pipeline(self) -> None:
        """Setup pipeline component interactions."""
        try:
            # Setup signal handlers for graceful shutdown
            if sys.platform != 'win32':
                loop = asyncio.get_event_loop()
                for sig in [signal.SIGINT, signal.SIGTERM]:
                    loop.add_signal_handler(sig, self._signal_handler)
            
            self.logger.info("Pipeline setup complete")
            
        except Exception as e:
            self.logger.warning(f"Pipeline setup warning: {e}")
    
    def _signal_handler(self) -> None:
        """Handle shutdown signals."""
        self.logger.info("Shutdown signal received")
        self.shutdown_event.set()
    
    def _audio_callback(self, audio_data) -> None:
        """
        Callback for incoming audio data.
        
        Args:
            audio_data: Audio chunk from microphone
        """
        if not self.is_listening or self.is_processing:
            return
        
        try:
            # Process audio for wake word detection
            # This runs in the audio thread, so we need to be fast
            asyncio.create_task(self._process_audio_chunk(audio_data))
            
        except Exception as e:
            self.logger.error(f"Audio callback error: {e}")
    
    async def _process_audio_chunk(self, audio_data) -> None:
        """
        Process audio chunk for wake word detection.
        
        Args:
            audio_data: Audio chunk to process
        """
        try:
            # Detect wake word
            detected = await self.wake_word_detector.detect(audio_data)
            
            # Wake word callback will handle the detection
            
        except Exception as e:
            self.logger.error(f"Audio chunk processing failed: {e}")
    
    def _wake_word_callback(self, wake_word: str, confidence: float) -> None:
        """
        Callback for wake word detection.
        
        Args:
            wake_word: Detected wake word
            confidence: Detection confidence
        """
        if self.is_processing:
            self.logger.debug("Already processing, ignoring wake word")
            return
        
        self.logger.info(f"Wake word '{wake_word}' detected (confidence: {confidence:.3f})")
        
        # Start interaction processing
        asyncio.create_task(self._handle_interaction())
    
    async def _handle_interaction(self) -> None:
        """Handle a complete voice interaction."""
        if self.is_processing:
            return
        
        self.is_processing = True
        interaction_start = time.time()
        
        try:
            with PerformanceTimer("full_interaction"):
                self.logger.info("Starting voice interaction...")
                
                # Play wake sound
                await self.tts_engine.play_wake_sound()
                
                # Record speech
                self.logger.info("Listening for speech...")
                audio_data = await self.audio_manager.record_speech(
                    timeout=self.config.pipeline.speech_timeout
                )
                
                if audio_data is None:
                    self.logger.info("No speech detected")
                    await self._speak_response("I didn't hear anything. Please try again.")
                    return
                
                # Transcribe speech
                self.logger.info("Transcribing speech...")
                transcript = await self.stt_engine.transcribe(audio_data)
                
                if not transcript:
                    self.logger.info("No speech recognized")
                    await self._speak_response("I couldn't understand what you said. Please try again.")
                    return
                
                self.logger.info(f"User said: '{transcript}'")
                
                # Process with persona
                self.logger.info("Generating response...")
                response = await self.persona_manager.process_input(transcript)
                
                if not response:
                    response = "I'm sorry, I don't know how to respond to that."
                
                self.logger.info(f"Response: '{response}'")
                
                # Speak response
                await self._speak_response(response)
                
                # Update statistics
                self.total_interactions += 1
                self.successful_interactions += 1
                
                interaction_time = time.time() - interaction_start
                self.average_response_time = (
                    (self.average_response_time * (self.successful_interactions - 1) + interaction_time) /
                    self.successful_interactions
                )
                
                self.logger.info(f"Interaction completed in {interaction_time:.2f}s")
                
        except Exception as e:
            self.logger.error(f"Interaction failed: {e}")
            self.total_interactions += 1
            
            try:
                await self._speak_response("I'm sorry, I encountered an error. Please try again.")
            except:
                pass  # Don't fail on error response
                
        finally:
            self.is_processing = False
    
    async def _speak_response(self, text: str) -> None:
        """
        Speak a response using TTS.
        
        Args:
            text: Text to speak
        """
        try:
            await self.tts_engine.speak(text)
        except Exception as e:
            self.logger.error(f"Failed to speak response: {e}")
    
    async def start(self) -> None:
        """Start the voice assistant pipeline."""
        if not self.is_initialized:
            raise AthinaError("Pipeline not initialized")
        
        if self.is_running:
            self.logger.warning("Pipeline already running")
            return
        
        try:
            self.logger.info("Starting Athina voice assistant...")
            
            # Start audio streaming
            await self.audio_manager.start_streaming()
            
            # Start listening
            self.is_listening = True
            self.is_running = True
            
            self.logger.info("Athina voice assistant started - listening for wake word...")
            
            # Main loop - wait for shutdown
            await self.shutdown_event.wait()
            
        except Exception as e:
            self.logger.error(f"Pipeline start failed: {e}")
            raise AthinaError(f"Start failed: {e}") from e
        finally:
            await self.stop()
    
    async def stop(self) -> None:
        """Stop the voice assistant pipeline."""
        if not self.is_running:
            return
        
        try:
            self.logger.info("Stopping Athina voice assistant...")
            
            self.is_running = False
            self.is_listening = False
            
            # Wait for any ongoing processing to complete
            max_wait = 5.0  # 5 seconds
            wait_start = time.time()
            while self.is_processing and (time.time() - wait_start) < max_wait:
                await asyncio.sleep(0.1)
            
            # Stop audio streaming
            await self.audio_manager.stop_streaming()
            
            self.logger.info("Athina voice assistant stopped")
            
        except Exception as e:
            self.logger.error(f"Error stopping pipeline: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on all components.
        
        Returns:
            Dictionary with health status of all components
        """
        health_status = {
            'overall': True,
            'timestamp': time.time(),
            'components': {}
        }
        
        try:
            # Check audio manager
            audio_healthy = await self.audio_manager.health_check()
            health_status['components']['audio'] = {
                'healthy': audio_healthy,
                'info': self.audio_manager.get_device_info()
            }
            
            # Check wake word detector
            wake_word_stats = self.wake_word_detector.get_statistics()
            health_status['components']['wake_word'] = {
                'healthy': wake_word_stats['is_initialized'],
                'stats': wake_word_stats
            }
            
            # Check STT engine
            stt_stats = self.stt_engine.get_statistics()
            health_status['components']['stt'] = {
                'healthy': stt_stats['is_initialized'],
                'stats': stt_stats
            }
            
            # Check TTS engine
            tts_stats = self.tts_engine.get_statistics()
            health_status['components']['tts'] = {
                'healthy': tts_stats['is_initialized'],
                'stats': tts_stats
            }
            
            # Check persona manager
            persona_stats = self.persona_manager.get_statistics()
            health_status['components']['persona'] = {
                'healthy': persona_stats['is_initialized'],
                'stats': persona_stats
            }
            
            # Overall health
            health_status['overall'] = all(
                comp['healthy'] for comp in health_status['components'].values()
            )
            
            # Pipeline statistics
            uptime = time.time() - self.session_start_time if self.session_start_time > 0 else 0
            health_status['pipeline'] = {
                'is_running': self.is_running,
                'is_listening': self.is_listening,
                'is_processing': self.is_processing,
                'uptime_seconds': uptime,
                'total_interactions': self.total_interactions,
                'successful_interactions': self.successful_interactions,
                'success_rate': (self.successful_interactions / max(self.total_interactions, 1)) * 100,
                'average_response_time': self.average_response_time,
            }
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            health_status['overall'] = False
            health_status['error'] = str(e)
        
        return health_status
    
    async def shutdown(self) -> None:
        """Shutdown the entire pipeline and clean up resources."""
        try:
            self.logger.info("Shutting down Athina voice assistant...")
            
            # Stop the pipeline
            await self.stop()
            
            # Shutdown components in reverse order
            if hasattr(self, 'persona_manager'):
                await self.persona_manager.shutdown()
            
            if hasattr(self, 'tts_engine'):
                await self.tts_engine.shutdown()
            
            if hasattr(self, 'stt_engine'):
                await self.stt_engine.shutdown()
            
            if hasattr(self, 'wake_word_detector'):
                await self.wake_word_detector.shutdown()
            
            if hasattr(self, 'audio_manager'):
                await self.audio_manager.shutdown()
            
            self.is_initialized = False
            
            self.logger.info("Athina voice assistant shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during shutdown: {e}")


async def main():
    """Main entry point for the Athina voice assistant."""
    pipeline = None
    
    try:
        # Initialize pipeline
        pipeline = AthinaPipeline()
        await pipeline.initialize()
        
        # Start the assistant
        await pipeline.start()
        
    except KeyboardInterrupt:
        print("\nShutdown requested by user")
    except Exception as e:
        print(f"Fatal error: {e}")
        logging.getLogger(__name__).error(f"Fatal error: {e}", exc_info=True)
    finally:
        if pipeline:
            await pipeline.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
