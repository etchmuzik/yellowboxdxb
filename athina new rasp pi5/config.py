
"""
Athina Configuration Management

Handles loading and validation of configuration files for the Athina voice assistant.
Supports YAML and JSON configuration formats with environment variable overrides.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Union
import yaml
import json
from dataclasses import dataclass, field

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

from .errors import ConfigurationError


@dataclass
class AudioConfig:
    """Audio system configuration."""
    sample_rate: int = 16000
    channels: int = 1
    chunk_size: int = 1024
    input_device_index: Optional[int] = None
    output_device_index: Optional[int] = None
    input_device_name: Optional[str] = None
    output_device_name: Optional[str] = None
    auto_detect_devices: bool = True
    noise_suppression: bool = True
    echo_cancellation: bool = True
    volume_threshold: float = 0.01
    silence_timeout: float = 2.0
    mock_mode: bool = False  # Enable mock audio for testing


@dataclass
class WakeWordConfig:
    """Wake word detection configuration."""
    model_name: str = "hey_athina"
    sensitivity: float = 0.5
    trigger_level: int = 1
    vad_enabled: bool = True
    noise_suppression: bool = True
    custom_model_path: Optional[str] = None
    inference_framework: str = "onnx"


@dataclass
class STTConfig:
    """Speech-to-Text configuration."""
    model_name: str = "tiny.en"
    model_path: Optional[str] = None
    language: str = "en"
    task: str = "transcribe"
    temperature: float = 0.0
    best_of: int = 5
    beam_size: int = 5
    patience: float = 1.0
    length_penalty: float = -0.05
    suppress_tokens: str = "-1"
    initial_prompt: Optional[str] = None
    condition_on_previous_text: bool = True
    fp16: bool = False
    compression_ratio_threshold: float = 2.4
    logprob_threshold: float = -1.0
    no_speech_threshold: float = 0.6
    mock_mode: bool = False  # Enable mock STT for testing


@dataclass
class TTSConfig:
    """Text-to-Speech configuration."""
    model_name: str = "en_US-ljspeech-high"
    voice_speed: float = 1.0
    voice_pitch: float = 0.0
    voice_volume: float = 1.0
    model_path: Optional[str] = None
    speaker_id: Optional[int] = None
    length_scale: float = 1.0
    noise_scale: float = 0.667
    noise_scale_w: float = 0.8
    streaming: bool = True
    mock_mode: bool = False  # Enable mock TTS for testing
    sentence_silence: float = 0.2


@dataclass
class PersonaConfig:
    """Persona and personality configuration."""
    name: str = "Athina"
    personality_traits: Dict[str, Any] = field(default_factory=lambda: {
        "elegance": 0.9,
        "warmth": 0.8,
        "wit": 0.7,
        "conciseness": 0.8,
        "professionalism": 0.9
    })
    voice_style: str = "elegant_warm"
    response_style: str = "concise_witty"
    catchphrases: list = field(default_factory=lambda: [
        "At your service",
        "How may I assist you today?",
        "Certainly",
        "Of course",
        "My pleasure"
    ])
    greeting_messages: list = field(default_factory=lambda: [
        "Good morning! I'm Athina, your personal assistant.",
        "Hello! How may I help you today?",
        "Welcome back! What can I do for you?"
    ])
    error_messages: list = field(default_factory=lambda: [
        "I apologize, but I didn't quite catch that.",
        "Could you please repeat that?",
        "I'm having trouble understanding. Please try again."
    ])


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    file: Optional[str] = None
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    max_file_size_mb: int = 10
    backup_count: int = 5
    console_output: bool = True


@dataclass
class PipelineConfig:
    """Pipeline configuration."""
    speech_timeout: float = 5.0
    response_timeout: float = 10.0
    max_interaction_time: float = 30.0
    wake_sound_enabled: bool = True


@dataclass
class OpenAIConfig:
    """OpenAI integration configuration."""
    enabled: bool = True
    api_key_env_var: str = "OPENAI_API_KEY"
    base_url: str = "https://api.openai.com/v1"
    timeout: int = 30
    max_retries: int = 3
    models: Dict[str, str] = field(default_factory=lambda: {
        "chat": "gpt-3.5-turbo",
        "chat_fallback": "gpt-3.5-turbo-instruct",
        "embedding": "text-embedding-ada-002"
    })
    usage_limits: Dict[str, int] = field(default_factory=lambda: {
        "max_tokens_per_request": 1000,
        "max_requests_per_minute": 20,
        "max_requests_per_hour": 100,
        "daily_token_limit": 50000
    })
    fallback: Dict[str, Any] = field(default_factory=lambda: {
        "mode": "smart",
        "use_for_complex_queries": True,
        "use_for_general_knowledge": True,
        "use_for_conversation": False,
        "network_timeout": 5,
        "api_timeout": 10,
        "retry_on_failure": True,
        "retry_delay": 1,
        "local_confidence_threshold": 0.7
    })
    smart_routing: Dict[str, Any] = field(default_factory=lambda: {
        "complex_keywords": [
            "explain", "analyze", "compare", "research", "detailed",
            "comprehensive", "complex", "advanced"
        ],
        "long_query_threshold": 100,
        "openai_topics": [
            "science", "history", "literature", "philosophy",
            "current events", "news", "research"
        ]
    })
    enhancement: Dict[str, bool] = field(default_factory=lambda: {
        "enhance_local_responses": False,
        "add_personality": True,
        "improve_quality": True
    })


@dataclass
class SystemConfig:
    """System and performance configuration."""
    log_level: str = "INFO"
    log_dir: str = "logs"
    max_memory_usage_mb: int = 2048
    cpu_threads: int = 0  # 0 = auto-detect
    gpu_enabled: bool = False
    model_cache_dir: str = "models"
    temp_dir: str = "/tmp/athina"
    speech_timeout: float = 5.0
    response_timeout: float = 10.0
    health_check_interval: int = 30
    auto_restart_on_error: bool = True
    play_wake_sound: bool = True
    debug_mode: bool = False


class Config:
    """
    Main configuration manager for Athina voice assistant.
    
    Loads configuration from YAML/JSON files and environment variables.
    Provides validation and easy access to all configuration parameters.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration manager.
        
        Args:
            config_path: Optional path to configuration file
        """
        # Load environment variables first
        self._load_environment_variables()
        
        self.logger = logging.getLogger(__name__)
        self.config_path = self._resolve_config_path(config_path)
        self.config_data: Dict[str, Any] = {}
        
        # Configuration sections
        self.audio: AudioConfig = AudioConfig()
        self.wake_word: WakeWordConfig = WakeWordConfig()
        self.stt: STTConfig = STTConfig()
        self.tts: TTSConfig = TTSConfig()
        self.persona: PersonaConfig = PersonaConfig()
        self.openai: OpenAIConfig = OpenAIConfig()
        self.system: SystemConfig = SystemConfig()
        self.logging: LoggingConfig = LoggingConfig()
        self.pipeline: PipelineConfig = PipelineConfig()
        
        # Load configuration
        self._load_config()
        self._apply_environment_overrides()
        self._validate_config()
        
        self.logger.info(f"Configuration loaded from: {self.config_path}")
    
    def _resolve_config_path(self, config_path: Optional[str]) -> Path:
        """
        Resolve the configuration file path.
        
        Args:
            config_path: Optional explicit path
            
        Returns:
            Resolved Path object
        """
        if config_path:
            return Path(config_path)
        
        # Try environment variable
        env_path = os.getenv("ATHINA_CONFIG_PATH")
        if env_path:
            return Path(env_path)
        
        # Default locations
        default_paths = [
            Path("configs/persona.yaml"),
            Path("configs/openai.yaml"),
            Path("configs/config.yaml"),
            Path("/etc/athina/config.yaml"),
            Path.home() / ".athina" / "config.yaml",
        ]
        
        for path in default_paths:
            if path.exists():
                return path
        
        # Return default path (will be created if needed)
        return Path("configs/persona.yaml")
    
    def _load_environment_variables(self) -> None:
        """Load environment variables from .env file if available."""
        if DOTENV_AVAILABLE:
            # Try to load from .env file in current directory
            env_file = Path(".env")
            if env_file.exists():
                load_dotenv(env_file)
            
            # Also try project root
            project_root = Path(__file__).parent.parent
            env_file = project_root / ".env"
            if env_file.exists():
                load_dotenv(env_file)
    
    def _load_config(self) -> None:
        """Load configuration from file."""
        try:
            if not self.config_path.exists():
                self.logger.warning(f"Config file not found: {self.config_path}")
                self.logger.info("Using default configuration")
                return
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                if self.config_path.suffix.lower() == '.json':
                    self.config_data = json.load(f)
                else:
                    self.config_data = yaml.safe_load(f) or {}
            
            # Apply loaded configuration to dataclasses
            self._apply_config_data()
            
        except Exception as e:
            raise ConfigurationError(f"Failed to load config from {self.config_path}: {e}")
    
    def _apply_config_data(self) -> None:
        """Apply loaded configuration data to dataclass instances."""
        try:
            # Audio configuration
            if 'audio' in self.config_data:
                audio_data = self.config_data['audio']
                for key, value in audio_data.items():
                    if hasattr(self.audio, key):
                        setattr(self.audio, key, value)
            
            # Wake word configuration
            if 'wake_word' in self.config_data:
                wake_word_data = self.config_data['wake_word']
                for key, value in wake_word_data.items():
                    if hasattr(self.wake_word, key):
                        setattr(self.wake_word, key, value)
            
            # STT configuration
            if 'stt' in self.config_data:
                stt_data = self.config_data['stt']
                for key, value in stt_data.items():
                    if hasattr(self.stt, key):
                        setattr(self.stt, key, value)
            
            # TTS configuration
            if 'tts' in self.config_data:
                tts_data = self.config_data['tts']
                for key, value in tts_data.items():
                    if hasattr(self.tts, key):
                        setattr(self.tts, key, value)
            
            # Persona configuration
            if 'persona' in self.config_data:
                persona_data = self.config_data['persona']
                for key, value in persona_data.items():
                    if hasattr(self.persona, key):
                        setattr(self.persona, key, value)
            
            # System configuration
            if 'system' in self.config_data:
                system_data = self.config_data['system']
                for key, value in system_data.items():
                    if hasattr(self.system, key):
                        setattr(self.system, key, value)
            
            # OpenAI configuration
            if 'openai' in self.config_data:
                openai_data = self.config_data['openai']
                for key, value in openai_data.items():
                    if hasattr(self.openai, key):
                        setattr(self.openai, key, value)
                        
        except Exception as e:
            raise ConfigurationError(f"Failed to apply configuration data: {e}")
    
    def _apply_environment_overrides(self) -> None:
        """Apply environment variable overrides."""
        env_mappings = {
            'ATHINA_LOG_LEVEL': ('system', 'log_level'),
            'ATHINA_WAKE_WORD': ('wake_word', 'model_name'),
            'ATHINA_STT_MODEL': ('stt', 'model_name'),
            'ATHINA_TTS_MODEL': ('tts', 'model_name'),
            'ATHINA_PERSONA_NAME': ('persona', 'name'),
            'ATHINA_DEBUG': ('system', 'debug_mode'),
            'ATHINA_OPENAI_ENABLED': ('openai', 'enabled'),
            'ATHINA_OFFLINE_MODE': ('openai', 'enabled'),  # Inverse mapping
            'OPENAI_BASE_URL': ('openai', 'base_url'),
            'ATHINA_NETWORK_TIMEOUT': ('openai', 'fallback.network_timeout'),
        }
        
        for env_var, (section, key) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                section_obj = getattr(self, section)
                
                # Handle nested keys (e.g., 'fallback.network_timeout')
                if '.' in key:
                    keys = key.split('.')
                    target_obj = section_obj
                    for k in keys[:-1]:
                        if hasattr(target_obj, k):
                            target_obj = getattr(target_obj, k)
                        else:
                            break
                    final_key = keys[-1]
                else:
                    target_obj = section_obj
                    final_key = key
                
                if hasattr(target_obj, final_key):
                    # Convert string values to appropriate types
                    if final_key in ['debug_mode', 'enabled'] and value.lower() in ['true', '1', 'yes']:
                        converted_value = True
                    elif final_key in ['debug_mode', 'enabled'] and value.lower() in ['false', '0', 'no']:
                        converted_value = False
                    elif final_key in ['network_timeout'] and value.isdigit():
                        converted_value = int(value)
                    else:
                        converted_value = value
                    
                    # Handle inverse mapping for ATHINA_OFFLINE_MODE
                    if env_var == 'ATHINA_OFFLINE_MODE':
                        converted_value = not converted_value
                    
                    setattr(target_obj, final_key, converted_value)
                    self.logger.info(f"Applied environment override: {env_var}={converted_value}")
    
    def _validate_config(self) -> None:
        """Validate configuration parameters."""
        try:
            # Validate audio configuration
            if self.audio.sample_rate not in [8000, 16000, 22050, 44100, 48000]:
                raise ConfigurationError(f"Invalid sample rate: {self.audio.sample_rate}")
            
            if self.audio.channels not in [1, 2]:
                raise ConfigurationError(f"Invalid channel count: {self.audio.channels}")
            
            # Validate wake word configuration
            if not 0.0 <= self.wake_word.sensitivity <= 1.0:
                raise ConfigurationError(f"Wake word sensitivity must be 0.0-1.0: {self.wake_word.sensitivity}")
            
            # Validate STT configuration
            valid_models = ['tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en']
            if self.stt.model_name not in valid_models:
                self.logger.warning(f"STT model '{self.stt.model_name}' not in recommended list: {valid_models}")
            
            # Validate TTS configuration
            if not 0.1 <= self.tts.voice_speed <= 3.0:
                raise ConfigurationError(f"TTS voice speed must be 0.1-3.0: {self.tts.voice_speed}")
            
            # Validate system configuration
            if self.system.max_memory_usage_mb < 512:
                raise ConfigurationError(f"Max memory usage too low: {self.system.max_memory_usage_mb}MB")
            
            # Create required directories
            Path(self.system.log_dir).mkdir(parents=True, exist_ok=True)
            Path(self.system.model_cache_dir).mkdir(parents=True, exist_ok=True)
            Path(self.system.temp_dir).mkdir(parents=True, exist_ok=True)
            
        except Exception as e:
            raise ConfigurationError(f"Configuration validation failed: {e}")
    
    # Convenience properties for backward compatibility
    @property
    def wake_word_model(self) -> str:
        """Get the wake word model name."""
        return self.wake_word.model_name
    
    @property
    def persona_name(self) -> str:
        """Get the persona name."""
        return self.persona.name
    
    @property
    def tts_voice_model(self) -> str:
        """Get the TTS voice model name."""
        return self.tts.model_name
    
    @property
    def log_level(self) -> str:
        """Get the log level."""
        return self.system.log_level
    
    @property
    def log_dir(self) -> str:
        """Get the log directory."""
        return self.system.log_dir
    
    @property
    def max_memory_usage_mb(self) -> int:
        """Get the maximum memory usage in MB."""
        return self.system.max_memory_usage_mb
    
    @property
    def speech_timeout(self) -> float:
        """Get the speech timeout in seconds."""
        return self.system.speech_timeout
    
    @property
    def play_wake_sound(self) -> bool:
        """Get whether to play wake sound."""
        return self.system.play_wake_sound
    
    def save_config(self, path: Optional[str] = None) -> None:
        """
        Save current configuration to file.
        
        Args:
            path: Optional path to save to (defaults to current config path)
        """
        save_path = Path(path) if path else self.config_path
        
        # Convert dataclasses to dictionaries
        config_dict = {
            'audio': self.audio.__dict__,
            'wake_word': self.wake_word.__dict__,
            'stt': self.stt.__dict__,
            'tts': self.tts.__dict__,
            'persona': self.persona.__dict__,
            'openai': self.openai.__dict__,
            'system': self.system.__dict__,
        }
        
        try:
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(save_path, 'w', encoding='utf-8') as f:
                if save_path.suffix.lower() == '.json':
                    json.dump(config_dict, f, indent=2)
                else:
                    yaml.dump(config_dict, f, default_flow_style=False, indent=2)
            
            self.logger.info(f"Configuration saved to: {save_path}")
            
        except Exception as e:
            raise ConfigurationError(f"Failed to save config to {save_path}: {e}")
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of current configuration.
        
        Returns:
            Dictionary containing configuration summary
        """
        return {
            'config_path': str(self.config_path),
            'persona_name': self.persona.name,
            'wake_word_model': self.wake_word.model_name,
            'stt_model': self.stt.model_name,
            'tts_model': self.tts.model_name,
            'audio_sample_rate': self.audio.sample_rate,
            'log_level': self.system.log_level,
            'debug_mode': self.system.debug_mode,
        }
