"""
Athina Custom Exception Classes

Defines custom exceptions for better error handling and debugging throughout
the voice assistant pipeline.
"""


class AthinaError(Exception):
    """Base exception class for all Athina-related errors."""
    
    def __init__(self, message: str, code: str = None, details: dict = None):
        """
        Initialize AthinaError.
        
        Args:
            message: Error message
            code: Optional error code for categorization
            details: Optional dictionary with additional error details
        """
        super().__init__(message)
        self.message = message
        self.code = code or "ATHINA_ERROR"
        self.details = details or {}
    
    def __str__(self):
        """String representation of the error."""
        if self.details:
            return f"{self.code}: {self.message} - Details: {self.details}"
        return f"{self.code}: {self.message}"


class ConfigurationError(AthinaError):
    """Raised when there's an error in configuration."""
    
    def __init__(self, message: str, config_key: str = None):
        """
        Initialize ConfigurationError.
        
        Args:
            message: Error message
            config_key: Optional configuration key that caused the error
        """
        details = {"config_key": config_key} if config_key else {}
        super().__init__(message, "CONFIG_ERROR", details)


class AudioError(AthinaError):
    """Base class for audio-related errors."""
    
    def __init__(self, message: str, device: str = None):
        """
        Initialize AudioError.
        
        Args:
            message: Error message
            device: Optional audio device that caused the error
        """
        details = {"device": device} if device else {}
        super().__init__(message, "AUDIO_ERROR", details)


class MicrophoneError(AudioError):
    """Raised when there's an error with the microphone."""
    
    def __init__(self, message: str, device: str = None):
        """Initialize MicrophoneError."""
        super().__init__(message, device)
        self.code = "MICROPHONE_ERROR"


class SpeakerError(AudioError):
    """Raised when there's an error with the speaker/audio output."""
    
    def __init__(self, message: str, device: str = None):
        """Initialize SpeakerError."""
        super().__init__(message, device)
        self.code = "SPEAKER_ERROR"


class WakeWordError(AthinaError):
    """Raised when there's an error with wake word detection."""
    
    def __init__(self, message: str, model: str = None):
        """
        Initialize WakeWordError.
        
        Args:
            message: Error message
            model: Optional wake word model that caused the error
        """
        details = {"model": model} if model else {}
        super().__init__(message, "WAKE_WORD_ERROR", details)


class STTError(AthinaError):
    """Raised when there's an error with speech-to-text."""
    
    def __init__(self, message: str, model: str = None, audio_length: float = None):
        """
        Initialize STTError.
        
        Args:
            message: Error message
            model: Optional STT model that caused the error
            audio_length: Optional length of audio that failed to transcribe
        """
        details = {}
        if model:
            details["model"] = model
        if audio_length is not None:
            details["audio_length_seconds"] = audio_length
        super().__init__(message, "STT_ERROR", details)


class TTSError(AthinaError):
    """Raised when there's an error with text-to-speech."""
    
    def __init__(self, message: str, model: str = None, text_length: int = None):
        """
        Initialize TTSError.
        
        Args:
            message: Error message
            model: Optional TTS model that caused the error
            text_length: Optional length of text that failed to synthesize
        """
        details = {}
        if model:
            details["model"] = model
        if text_length is not None:
            details["text_length_chars"] = text_length
        super().__init__(message, "TTS_ERROR", details)


class ModelError(AthinaError):
    """Raised when there's an error loading or using AI models."""
    
    def __init__(self, message: str, model_path: str = None, model_type: str = None):
        """
        Initialize ModelError.
        
        Args:
            message: Error message
            model_path: Optional path to the model
            model_type: Optional type of model (stt, tts, wake_word)
        """
        details = {}
        if model_path:
            details["model_path"] = model_path
        if model_type:
            details["model_type"] = model_type
        super().__init__(message, "MODEL_ERROR", details)


class PersonaError(AthinaError):
    """Raised when there's an error with persona/skills processing."""
    
    def __init__(self, message: str, skill: str = None):
        """
        Initialize PersonaError.
        
        Args:
            message: Error message
            skill: Optional skill that caused the error
        """
        details = {"skill": skill} if skill else {}
        super().__init__(message, "PERSONA_ERROR", details)


class NetworkError(AthinaError):
    """Raised when there's a network-related error (for online features)."""
    
    def __init__(self, message: str, url: str = None, status_code: int = None):
        """
        Initialize NetworkError.
        
        Args:
            message: Error message
            url: Optional URL that caused the error
            status_code: Optional HTTP status code
        """
        details = {}
        if url:
            details["url"] = url
        if status_code is not None:
            details["status_code"] = status_code
        super().__init__(message, "NETWORK_ERROR", details)


class TimeoutError(AthinaError):
    """Raised when an operation times out."""
    
    def __init__(self, message: str, operation: str = None, timeout_seconds: float = None):
        """
        Initialize TimeoutError.
        
        Args:
            message: Error message
            operation: Optional operation that timed out
            timeout_seconds: Optional timeout duration
        """
        details = {}
        if operation:
            details["operation"] = operation
        if timeout_seconds is not None:
            details["timeout_seconds"] = timeout_seconds
        super().__init__(message, "TIMEOUT_ERROR", details)


class ResourceError(AthinaError):
    """Raised when there's a resource constraint (memory, CPU, etc.)."""
    
    def __init__(self, message: str, resource_type: str = None, current_usage: float = None):
        """
        Initialize ResourceError.
        
        Args:
            message: Error message
            resource_type: Optional type of resource (memory, cpu, disk)
            current_usage: Optional current usage percentage
        """
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        if current_usage is not None:
            details["current_usage_percent"] = current_usage
        super().__init__(message, "RESOURCE_ERROR", details)


class InitializationError(AthinaError):
    """Raised when a component fails to initialize."""
    
    def __init__(self, message: str, component: str = None):
        """
        Initialize InitializationError.
        
        Args:
            message: Error message
            component: Optional component that failed to initialize
        """
        details = {"component": component} if component else {}
        super().__init__(message, "INIT_ERROR", details)


class ShutdownError(AthinaError):
    """Raised when there's an error during shutdown."""
    
    def __init__(self, message: str, component: str = None):
        """
        Initialize ShutdownError.
        
        Args:
            message: Error message
            component: Optional component that failed to shutdown
        """
        details = {"component": component} if component else {}
        super().__init__(message, "SHUTDOWN_ERROR", details)


def handle_error(error: Exception, logger=None, reraise: bool = True):
    """
    Central error handler for consistent error processing.
    
    Args:
        error: The exception to handle
        logger: Optional logger instance for logging the error
        reraise: Whether to re-raise the exception after handling
        
    Returns:
        The error instance if not re-raising
    """
    if logger:
        if isinstance(error, AthinaError):
            logger.error(f"{error.code}: {error.message}", extra={"details": error.details})
        else:
            logger.error(f"Unexpected error: {str(error)}", exc_info=True)
    
    if reraise:
        raise error
    
    return error