#!/usr/bin/env python3
"""
Test script to verify Athina components are working correctly.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from audio import AudioManager
from wake_word import WakeWordDetector
from speech_to_text import SpeechToTextEngine
from text_to_speech import TextToSpeechEngine
from skills_persona import SkillsPersonaEngine
from nlp_router import NLPRouter

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_config():
    """Test configuration loading."""
    logger.info("Testing configuration...")
    try:
        config = Config()
        logger.info(f"✓ Configuration loaded successfully")
        logger.info(f"  Persona name: {config.persona.name}")
        logger.info(f"  Wake word: {config.wake_word.model_name}")
        logger.info(f"  STT model: {config.stt.model_name}")
        logger.info(f"  TTS model: {config.tts.model_name}")
        return config
    except Exception as e:
        logger.error(f"✗ Configuration failed: {e}")
        return None


async def test_audio(config):
    """Test audio subsystem."""
    logger.info("Testing audio manager...")
    try:
        audio = AudioManager(config)
        await audio.initialize()
        
        # Get devices
        devices = audio.get_audio_devices()
        logger.info(f"✓ Audio manager initialized")
        logger.info(f"  Input devices: {len(devices['input'])}")
        logger.info(f"  Output devices: {len(devices['output'])}")
        
        # Test health check
        healthy = await audio.health_check()
        logger.info(f"  Health check: {'✓ Passed' if healthy else '✗ Failed'}")
        
        await audio.shutdown()
        return True
    except Exception as e:
        logger.error(f"✗ Audio manager failed: {e}")
        return False


async def test_wake_word(config):
    """Test wake word detection."""
    logger.info("Testing wake word detector...")
    try:
        detector = WakeWordDetector(config)
        await detector.initialize()
        
        stats = detector.get_statistics()
        logger.info(f"✓ Wake word detector initialized")
        logger.info(f"  Model: {stats['model_name']}")
        logger.info(f"  Sensitivity: {stats['sensitivity']}")
        
        await detector.shutdown()
        return True
    except Exception as e:
        logger.error(f"✗ Wake word detector failed: {e}")
        return False


async def test_stt(config):
    """Test speech-to-text engine."""
    logger.info("Testing STT engine...")
    try:
        stt = SpeechToTextEngine(config)
        await stt.initialize()
        
        stats = stt.get_statistics()
        logger.info(f"✓ STT engine initialized")
        logger.info(f"  Backend: {stats['backend']}")
        logger.info(f"  Model: {stats['model_name']}")
        
        await stt.shutdown()
        return True
    except Exception as e:
        logger.error(f"✗ STT engine failed: {e}")
        return False


async def test_tts(config):
    """Test text-to-speech engine."""
    logger.info("Testing TTS engine...")
    try:
        tts = TextToSpeechEngine(config)
        await tts.initialize()
        
        stats = tts.get_statistics()
        logger.info(f"✓ TTS engine initialized")
        logger.info(f"  Model: {stats['model_name']}")
        
        await tts.shutdown()
        return True
    except Exception as e:
        logger.error(f"✗ TTS engine failed: {e}")
        return False


async def test_persona(config):
    """Test persona engine."""
    logger.info("Testing persona engine...")
    try:
        persona = SkillsPersonaEngine(config)
        await persona.initialize()
        
        stats = persona.get_statistics()
        logger.info(f"✓ Persona engine initialized")
        logger.info(f"  Name: {stats['persona_name']}")
        logger.info(f"  Skills: {len(persona.skills)}")
        
        # Test a simple interaction
        response = await persona.process_input("What's your name?")
        logger.info(f"  Test response: {response}")
        
        await persona.shutdown()
        return True
    except Exception as e:
        logger.error(f"✗ Persona engine failed: {e}")
        return False


async def test_full_pipeline():
    """Test all components."""
    logger.info("=" * 60)
    logger.info("Athina Voice Assistant Component Test")
    logger.info("=" * 60)
    
    # Test configuration
    config = await test_config()
    if not config:
        logger.error("Cannot proceed without configuration")
        return
    
    logger.info("")
    
    # Test each component
    results = {
        "Audio": await test_audio(config),
        "Wake Word": await test_wake_word(config),
        "STT": await test_stt(config),
        "TTS": await test_tts(config),
        "Persona": await test_persona(config)
    }
    
    # Summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("Test Summary:")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for component, success in results.items():
        logger.info(f"  {component}: {'✓ Passed' if success else '✗ Failed'}")
    
    logger.info(f"\nTotal: {passed}/{total} components passed")
    
    if passed == total:
        logger.info("\n✓ All components working! Athina is ready to use.")
    else:
        logger.warning(f"\n⚠ {total - passed} components failed. Check the errors above.")


async def main():
    """Main entry point."""
    try:
        await test_full_pipeline()
    except KeyboardInterrupt:
        logger.info("\nTest interrupted by user")
    except Exception as e:
        logger.error(f"Test failed with error: {e}")


if __name__ == "__main__":
    asyncio.run(main())