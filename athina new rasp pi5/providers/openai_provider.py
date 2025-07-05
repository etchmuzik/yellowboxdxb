"""
OpenAI Provider for Athina

Provides integration with OpenAI's API for enhanced responses when online,
with proper fallback handling and rate limiting.
"""

import asyncio
import logging
import time
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import json

try:
    import openai
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from ..errors import NetworkError, TimeoutError


@dataclass
class TokenUsage:
    """Track token usage for rate limiting."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    requests: int = 0
    last_reset: float = 0


class OpenAIProvider:
    """
    OpenAI integration provider for enhanced responses.
    
    Provides smart routing, fallback handling, and rate limiting
    for OpenAI API integration.
    """
    
    def __init__(self, config):
        """
        Initialize OpenAI provider.
        
        Args:
            config: Configuration object with OpenAI settings
        """
        self.logger = logging.getLogger(__name__)
        self.config = config.openai
        
        # API configuration
        self.enabled = self.config.enabled
        self.api_key = os.getenv(self.config.api_key_env_var)
        self.base_url = self.config.base_url
        self.timeout = self.config.timeout
        self.max_retries = self.config.max_retries
        
        # Model configuration
        self.models = self.config.models
        
        # Usage limits
        self.usage_limits = self.config.usage_limits
        
        # Fallback configuration
        self.fallback_config = self.config.fallback
        
        # Smart routing configuration
        self.smart_routing = self.config.smart_routing
        
        # Enhancement configuration
        self.enhancement_config = self.config.enhancement
        
        # Initialize client
        self.client = None
        self.is_initialized = False
        
        # Usage tracking
        self.usage = TokenUsage()
        self.usage.last_reset = time.time()
        
        # Response cache
        self.response_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def initialize(self) -> None:
        """Initialize the OpenAI provider."""
        if self.is_initialized:
            return
        
        try:
            if not self.enabled:
                self.logger.info("OpenAI provider disabled in configuration")
                return
            
            if not OPENAI_AVAILABLE:
                self.logger.warning("OpenAI library not available")
                self.enabled = False
                return
            
            if not self.api_key:
                self.logger.warning("OpenAI API key not found")
                self.enabled = False
                return
            
            # Initialize async client
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=self.timeout,
                max_retries=self.max_retries
            )
            
            # Test connection
            await self._test_connection()
            
            self.is_initialized = True
            self.logger.info("OpenAI provider initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI provider: {e}")
            self.enabled = False
    
    async def _test_connection(self) -> None:
        """Test OpenAI API connection."""
        try:
            # Make a minimal API call to test connectivity
            response = await self.client.chat.completions.create(
                model=self.models['chat'],
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            self.logger.info("OpenAI API connection successful")
            
        except Exception as e:
            raise NetworkError(f"OpenAI API connection failed: {e}")
    
    def should_use_openai(self, query: str, context: Dict[str, Any]) -> bool:
        """
        Determine if OpenAI should be used for this query.
        
        Args:
            query: User query
            context: Additional context
            
        Returns:
            True if OpenAI should be used
        """
        if not self.enabled or not self.is_initialized:
            return False
        
        # Check if within rate limits
        if not self._check_rate_limits():
            return False
        
        # Check fallback mode
        fallback_mode = self.fallback_config['mode']
        
        if fallback_mode == 'never':
            return False
        elif fallback_mode == 'always':
            return True
        elif fallback_mode == 'smart':
            # Smart routing based on query analysis
            return self._analyze_query_complexity(query, context)
        
        return False
    
    def _analyze_query_complexity(self, query: str, context: Dict[str, Any]) -> bool:
        """
        Analyze query complexity to determine if OpenAI is needed.
        
        Args:
            query: User query
            context: Additional context
            
        Returns:
            True if query is complex enough for OpenAI
        """
        query_lower = query.lower()
        
        # Check for complex keywords
        complex_keywords = self.smart_routing['complex_keywords']
        if any(keyword in query_lower for keyword in complex_keywords):
            return True
        
        # Check query length
        if len(query) > self.smart_routing['long_query_threshold']:
            return True
        
        # Check for OpenAI-specific topics
        openai_topics = self.smart_routing['openai_topics']
        if any(topic in query_lower for topic in openai_topics):
            return True
        
        # Check context for complexity indicators
        if context.get('requires_reasoning', False):
            return True
        
        if context.get('local_confidence', 1.0) < self.fallback_config['local_confidence_threshold']:
            return True
        
        return False
    
    def _check_rate_limits(self) -> bool:
        """
        Check if within rate limits.
        
        Returns:
            True if within limits
        """
        # Reset hourly counters
        current_time = time.time()
        if current_time - self.usage.last_reset > 3600:  # 1 hour
            self.usage.requests = 0
            self.usage.total_tokens = 0
            self.usage.last_reset = current_time
        
        # Check request limit
        if self.usage.requests >= self.usage_limits['max_requests_per_hour']:
            self.logger.warning("OpenAI hourly request limit reached")
            return False
        
        # Check token limit
        if self.usage.total_tokens >= self.usage_limits['daily_token_limit']:
            self.logger.warning("OpenAI daily token limit reached")
            return False
        
        return True
    
    async def get_response(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Get response from OpenAI.
        
        Args:
            prompt: User prompt
            context: Optional context
            
        Returns:
            Response text or None if failed
        """
        if not self.enabled or not self.is_initialized:
            return None
        
        try:
            # Check cache
            cache_key = self._get_cache_key(prompt, context)
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                return cached_response
            
            # Prepare messages
            messages = self._prepare_messages(prompt, context)
            
            # Make API call with timeout
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.models['chat'],
                    messages=messages,
                    max_tokens=self.usage_limits['max_tokens_per_request'],
                    temperature=0.7,
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                ),
                timeout=self.fallback_config['api_timeout']
            )
            
            # Extract response
            response_text = response.choices[0].message.content
            
            # Update usage
            if response.usage:
                self.usage.prompt_tokens += response.usage.prompt_tokens
                self.usage.completion_tokens += response.usage.completion_tokens
                self.usage.total_tokens += response.usage.total_tokens
            self.usage.requests += 1
            
            # Cache response
            self._cache_response(cache_key, response_text)
            
            return response_text
            
        except asyncio.TimeoutError:
            self.logger.error("OpenAI API timeout")
            raise TimeoutError("OpenAI API timeout", operation="chat_completion")
        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")
            raise NetworkError(f"OpenAI API error: {e}")
    
    def _prepare_messages(self, prompt: str, context: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Prepare messages for OpenAI API.
        
        Args:
            prompt: User prompt
            context: Optional context
            
        Returns:
            List of messages
        """
        messages = []
        
        # System message
        system_prompt = "You are Athina, an elegant and sophisticated voice assistant."
        if context and context.get('persona_traits'):
            traits = context['persona_traits']
            system_prompt += f" Your personality traits: {', '.join(traits)}."
        
        messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history if available
        if context and context.get('conversation_history'):
            for entry in context['conversation_history'][-5:]:  # Last 5 exchanges
                messages.append({"role": entry['role'], "content": entry['content']})
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        return messages
    
    def _get_cache_key(self, prompt: str, context: Optional[Dict[str, Any]]) -> str:
        """Generate cache key for response."""
        key_data = {
            'prompt': prompt,
            'context': context.get('conversation_history', [])[-2:] if context else []
        }
        return json.dumps(key_data, sort_keys=True)
    
    def _get_cached_response(self, cache_key: str) -> Optional[str]:
        """Get cached response if available."""
        if cache_key in self.response_cache:
            cached_item = self.response_cache[cache_key]
            if time.time() - cached_item['timestamp'] < self.cache_ttl:
                self.logger.debug("Using cached OpenAI response")
                return cached_item['response']
            else:
                del self.response_cache[cache_key]
        return None
    
    def _cache_response(self, cache_key: str, response: str) -> None:
        """Cache response."""
        self.response_cache[cache_key] = {
            'response': response,
            'timestamp': time.time()
        }
        
        # Limit cache size
        if len(self.response_cache) > 100:
            # Remove oldest entries
            sorted_items = sorted(
                self.response_cache.items(),
                key=lambda x: x[1]['timestamp']
            )
            for key, _ in sorted_items[:20]:
                del self.response_cache[key]
    
    async def enhance_response(self, local_response: str, original_query: str) -> str:
        """
        Enhance a local response using OpenAI.
        
        Args:
            local_response: Response from local processing
            original_query: Original user query
            
        Returns:
            Enhanced response or original if enhancement fails
        """
        if not self.enhancement_config['enhance_local_responses']:
            return local_response
        
        try:
            enhancement_prompt = f"""
            Original query: {original_query}
            Local response: {local_response}
            
            Please enhance this response to be more helpful, natural, and conversational
            while maintaining accuracy and the core information.
            """
            
            enhanced = await self.get_response(enhancement_prompt)
            return enhanced if enhanced else local_response
            
        except Exception as e:
            self.logger.warning(f"Response enhancement failed: {e}")
            return local_response
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """
        Get usage statistics.
        
        Returns:
            Dictionary with usage stats
        """
        return {
            'enabled': self.enabled,
            'is_initialized': self.is_initialized,
            'total_requests': self.usage.requests,
            'total_tokens': self.usage.total_tokens,
            'prompt_tokens': self.usage.prompt_tokens,
            'completion_tokens': self.usage.completion_tokens,
            'cache_size': len(self.response_cache),
            'rate_limit_status': {
                'requests_remaining': max(0, self.usage_limits['max_requests_per_hour'] - self.usage.requests),
                'tokens_remaining': max(0, self.usage_limits['daily_token_limit'] - self.usage.total_tokens)
            }
        }
    
    async def shutdown(self) -> None:
        """Shutdown the OpenAI provider."""
        try:
            self.logger.info("Shutting down OpenAI provider...")
            
            self.is_initialized = False
            self.client = None
            self.response_cache.clear()
            
            self.logger.info("OpenAI provider shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during OpenAI provider shutdown: {e}")