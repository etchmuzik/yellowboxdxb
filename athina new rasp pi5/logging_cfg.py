"""
Athina Logging Configuration

Provides centralized logging setup with rotation, performance monitoring,
and colored console output for development.
"""

import logging
import logging.handlers
import os
import sys
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

try:
    import colorlog
    COLORLOG_AVAILABLE = True
except ImportError:
    COLORLOG_AVAILABLE = False


class PerformanceTimer:
    """Context manager for timing code execution and logging performance."""
    
    def __init__(self, name: str, logger: Optional[logging.Logger] = None):
        """
        Initialize PerformanceTimer.
        
        Args:
            name: Name of the operation being timed
            logger: Optional logger instance for logging timing results
        """
        self.name = name
        self.logger = logger or logging.getLogger(__name__)
        self.start_time = None
        self.end_time = None
        self.duration = None
    
    def __enter__(self):
        """Start timing."""
        self.start_time = time.perf_counter()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop timing and log results."""
        self.end_time = time.perf_counter()
        self.duration = self.end_time - self.start_time
        
        if exc_type is None:
            self.logger.debug(f"{self.name} completed in {self.duration:.3f}s")
        else:
            self.logger.warning(f"{self.name} failed after {self.duration:.3f}s")
        
        return False  # Don't suppress exceptions


class AthinaLogFilter(logging.Filter):
    """Custom log filter for adding context to log records."""
    
    def filter(self, record):
        """Add custom fields to log record."""
        # Add timestamp in milliseconds
        record.timestamp_ms = int(time.time() * 1000)
        
        # Add memory usage if available
        try:
            import psutil
            process = psutil.Process()
            record.memory_mb = process.memory_info().rss / 1024 / 1024
        except:
            record.memory_mb = 0
        
        return True


def setup_logging(config: Dict[str, Any]) -> None:
    """
    Setup logging configuration for Athina.
    
    Args:
        config: Logging configuration dictionary containing:
            - level: Log level (DEBUG, INFO, WARNING, ERROR)
            - file: Optional log file path
            - format: Log message format
            - max_file_size_mb: Maximum log file size before rotation
            - backup_count: Number of backup files to keep
            - console_output: Whether to log to console
    """
    # Extract configuration
    log_level = config.get('level', 'INFO').upper()
    log_file = config.get('file')
    log_format = config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    max_file_size_mb = config.get('max_file_size_mb', 10)
    backup_count = config.get('backup_count', 5)
    console_output = config.get('console_output', True)
    
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatters
    file_formatter = logging.Formatter(log_format)
    
    # Add custom filter
    log_filter = AthinaLogFilter()
    
    # Console handler with color support
    if console_output:
        if COLORLOG_AVAILABLE and sys.stdout.isatty():
            # Colored console output for development
            console_formatter = colorlog.ColoredFormatter(
                '%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s%(reset)s',
                datefmt='%Y-%m-%d %H:%M:%S',
                log_colors={
                    'DEBUG': 'cyan',
                    'INFO': 'green',
                    'WARNING': 'yellow',
                    'ERROR': 'red',
                    'CRITICAL': 'red,bg_white',
                },
                secondary_log_colors={},
                style='%'
            )
            console_handler = colorlog.StreamHandler(sys.stdout)
            console_handler.setFormatter(console_formatter)
        else:
            # Standard console output
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setFormatter(file_formatter)
        
        console_handler.addFilter(log_filter)
        root_logger.addHandler(console_handler)
    
    # File handler with rotation
    if log_file:
        # Create log directory if needed
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_file_size_mb * 1024 * 1024,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setFormatter(file_formatter)
        file_handler.addFilter(log_filter)
        root_logger.addHandler(file_handler)
    
    # Create separate error log file
    if log_file:
        error_log_file = log_path.parent / f"{log_path.stem}_errors{log_path.suffix}"
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=max_file_size_mb * 1024 * 1024,
            backupCount=backup_count,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        error_handler.addFilter(log_filter)
        root_logger.addHandler(error_handler)
    
    # Configure specific loggers
    _configure_module_loggers()
    
    # Log startup message
    root_logger.info("=" * 60)
    root_logger.info(f"Athina Voice Assistant - Logging initialized")
    root_logger.info(f"Log level: {log_level}")
    root_logger.info(f"Log file: {log_file or 'Console only'}")
    root_logger.info("=" * 60)


def _configure_module_loggers():
    """Configure logging levels for specific modules."""
    # Reduce noise from third-party libraries
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('pyaudio').setLevel(logging.WARNING)
    logging.getLogger('sounddevice').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)
    
    # Set specific levels for Athina modules
    logging.getLogger('athina.audio').setLevel(logging.INFO)
    logging.getLogger('athina.wake_word').setLevel(logging.INFO)
    logging.getLogger('athina.stt').setLevel(logging.INFO)
    logging.getLogger('athina.tts').setLevel(logging.INFO)
    logging.getLogger('athina.persona').setLevel(logging.INFO)


class LogContext:
    """Context manager for temporary logging context."""
    
    def __init__(self, **kwargs):
        """
        Initialize LogContext.
        
        Args:
            **kwargs: Key-value pairs to add to log context
        """
        self.context = kwargs
        self.old_factory = None
    
    def __enter__(self):
        """Enter context and update log record factory."""
        self.old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = self.old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record
        
        logging.setLogRecordFactory(record_factory)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context and restore log record factory."""
        logging.setLogRecordFactory(self.old_factory)
        return False


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def log_system_info(logger: Optional[logging.Logger] = None):
    """
    Log system information for debugging.
    
    Args:
        logger: Optional logger instance (uses root logger if None)
    """
    if logger is None:
        logger = logging.getLogger()
    
    try:
        import platform
        import psutil
        
        # System information
        logger.info("System Information:")
        logger.info(f"  Platform: {platform.system()} {platform.release()}")
        logger.info(f"  Machine: {platform.machine()}")
        logger.info(f"  Python: {platform.python_version()}")
        
        # Hardware information
        logger.info("Hardware Information:")
        logger.info(f"  CPU Cores: {psutil.cpu_count(logical=False)} physical, {psutil.cpu_count()} logical")
        logger.info(f"  Memory: {psutil.virtual_memory().total / (1024**3):.1f} GB total")
        logger.info(f"  Memory Available: {psutil.virtual_memory().available / (1024**3):.1f} GB")
        
        # Disk information
        disk_usage = psutil.disk_usage('/')
        logger.info(f"  Disk Space: {disk_usage.free / (1024**3):.1f} GB free of {disk_usage.total / (1024**3):.1f} GB")
        
    except ImportError:
        logger.warning("psutil not available - cannot log detailed system information")
    except Exception as e:
        logger.warning(f"Error logging system information: {e}")


@contextmanager
def log_performance(operation: str, logger: Optional[logging.Logger] = None):
    """
    Context manager for logging operation performance.
    
    Args:
        operation: Name of the operation
        logger: Optional logger instance
        
    Example:
        with log_performance("model_loading"):
            load_model()
    """
    timer = PerformanceTimer(operation, logger)
    with timer:
        yield timer


class PerformanceMonitor:
    """Monitor and log performance metrics over time."""
    
    def __init__(self, name: str, window_size: int = 100):
        """
        Initialize PerformanceMonitor.
        
        Args:
            name: Name of the monitor
            window_size: Number of samples to keep for rolling average
        """
        self.name = name
        self.window_size = window_size
        self.samples = []
        self.logger = logging.getLogger(f"athina.performance.{name}")
    
    def record(self, duration: float):
        """
        Record a duration sample.
        
        Args:
            duration: Duration in seconds
        """
        self.samples.append(duration)
        if len(self.samples) > self.window_size:
            self.samples.pop(0)
        
        # Log statistics periodically
        if len(self.samples) % 10 == 0:
            self._log_statistics()
    
    def _log_statistics(self):
        """Log performance statistics."""
        if not self.samples:
            return
        
        avg_duration = sum(self.samples) / len(self.samples)
        min_duration = min(self.samples)
        max_duration = max(self.samples)
        
        self.logger.debug(
            f"{self.name} performance - "
            f"Avg: {avg_duration:.3f}s, "
            f"Min: {min_duration:.3f}s, "
            f"Max: {max_duration:.3f}s "
            f"(last {len(self.samples)} samples)"
        )
    
    def get_average(self) -> float:
        """Get the average duration."""
        return sum(self.samples) / len(self.samples) if self.samples else 0.0


# Global performance monitors
PERFORMANCE_MONITORS = {
    'wake_word_detection': PerformanceMonitor('wake_word_detection'),
    'speech_recognition': PerformanceMonitor('speech_recognition'),
    'text_synthesis': PerformanceMonitor('text_synthesis'),
    'full_interaction': PerformanceMonitor('full_interaction'),
}