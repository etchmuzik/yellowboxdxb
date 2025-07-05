
"""
NLP Router for Athina Voice Assistant

Intelligent routing system that decides between local processing and OpenAI API
based on query complexity, network availability, and configuration settings.
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass

from .providers.openai_provider import OpenAIProvider
from .errors import AthinaError


@dataclass
class RoutingDecision:
    """Represents a routing decision with metadata."""
    use_openai: bool
    confidence: float
    reason: str
    fallback_available: bool
    processing_time: float = 0.0


class NLPRouter:
    """
    Intelligent NLP routing system for offline-first operation.
    
    Routes queries between local processing and OpenAI API based on:
    - Query complexity and type
    - Network availability
    - Local processing confidence
    - Rate limits and usage quotas
    - User preferences and configuration
    """
    
    def __init__(self, config: Dict[str, Any], openai_provider: Optional[OpenAIProvider] = None):
        """
        Initialize NLP router.
        
        Args:
            config: Router configuration
            openai_provider: OpenAI provider instance
        """
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.openai_provider = openai_provider
        
        # Routing statistics
        self.total_queries = 0
        self.openai_queries = 0
        self.local_queries = 0
        self.fallback_queries = 0
        self.failed_queries = 0
        
        # Performance tracking
        self.average_local_time = 0.0
        self.average_openai_time = 0.0
        
        self.logger.info("NLP Router initialized")
    
    async def route_query(self, user_input: str, context: Dict[str, Any] = None) -> Tuple[str, RoutingDecision]:
        """
        Route a query to the appropriate processing system.
        
        Args:
            user_input: User's input text
            context: Additional context for routing decision
            
        Returns:
            Tuple of (response_text, routing_decision)
        """
        start_time = time.time()
        context = context or {}
        
        self.total_queries += 1
        
        try:
            # Make routing decision
            decision = await self._make_routing_decision(user_input, context)
            
            response = None
            
            if decision.use_openai and self.openai_provider:
                # Try OpenAI first
                response = await self._process_with_openai(user_input, context)
                
                if response:
                    self.openai_queries += 1
                    decision.processing_time = time.time() - start_time
                    self.average_openai_time = self._update_average(
                        self.average_openai_time, decision.processing_time, self.openai_queries
                    )
                else:
                    # OpenAI failed, try local fallback
                    self.logger.warning("OpenAI processing failed, falling back to local")
                    response = await self._process_locally(user_input, context)
                    if response:
                        self.fallback_queries += 1
                        decision.reason += " (OpenAI failed, used local fallback)"
            
            if not response:
                # Use local processing
                response = await self._process_locally(user_input, context)
                
                if response:
                    self.local_queries += 1
                    decision.processing_time = time.time() - start_time
                    self.average_local_time = self._update_average(
                        self.average_local_time, decision.processing_time, self.local_queries
                    )
                    
                    if not decision.use_openai:
                        decision.reason = "Local processing (by design)"
                else:
                    self.failed_queries += 1
                    decision.reason = "All processing methods failed"
                    response = "I'm sorry, I'm having trouble processing your request right now."
            
            decision.processing_time = time.time() - start_time
            
            self.logger.debug(f"Query routed: {decision.reason} (time: {decision.processing_time:.2f}s)")
            
            return response, decision
            
        except Exception as e:
            self.logger.error(f"Query routing failed: {e}")
            self.failed_queries += 1
            
            decision = RoutingDecision(
                use_openai=False,
                confidence=0.0,
                reason=f"Routing error: {e}",
                fallback_available=False,
                processing_time=time.time() - start_time
            )
            
            return "I encountered an error processing your request.", decision
    
    async def _make_routing_decision(self, user_input: str, context: Dict[str, Any]) -> RoutingDecision:
        """Make intelligent routing decision."""
        
        # Check if OpenAI is available
        if not self.openai_provider or not self.openai_provider.is_available():
            return RoutingDecision(
                use_openai=False,
                confidence=1.0,
                reason="OpenAI not available",
                fallback_available=True
            )
        
        # Let OpenAI provider make the decision
        should_use_openai = self.openai_provider.should_use_openai(user_input, context)
        
        if should_use_openai:
            return RoutingDecision(
                use_openai=True,
                confidence=0.8,
                reason="OpenAI selected by smart routing",
                fallback_available=True
            )
        else:
            return RoutingDecision(
                use_openai=False,
                confidence=0.9,
                reason="Local processing selected",
                fallback_available=self.openai_provider.is_available()
            )
    
    async def _process_with_openai(self, user_input: str, context: Dict[str, Any]) -> Optional[str]:
        """Process query with OpenAI."""
        try:
            # Get conversation history and persona context
            conversation_history = context.get('conversation_history', [])
            persona_context = context.get('persona_context', {})
            
            # Use OpenAI for conversational response
            response = await self.openai_provider.get_conversational_response(
                user_input=user_input,
                conversation_history=conversation_history,
                persona_context=persona_context
            )
            
            return response
            
        except Exception as e:
            self.logger.error(f"OpenAI processing failed: {e}")
            return None
    
    async def _process_locally(self, user_input: str, context: Dict[str, Any]) -> Optional[str]:
        """Process query with local systems."""
        try:
            # Get the local persona manager from context
            persona_manager = context.get('persona_manager')
            
            if persona_manager:
                # Use existing local processing
                response = await persona_manager._fallback_response(user_input)
                return response
            else:
                # Fallback to simple response
                return self._generate_simple_response(user_input)
            
        except Exception as e:
            self.logger.error(f"Local processing failed: {e}")
            return None
    
    def _generate_simple_response(self, user_input: str) -> str:
        """Generate a simple response when all else fails."""
        user_input_lower = user_input.lower()
        
        # Simple pattern matching for basic responses
        if any(greeting in user_input_lower for greeting in ['hello', 'hi', 'hey']):
            return "Hello! How can I help you today?"
        
        elif any(question in user_input_lower for question in ['how are you', 'how do you do']):
            return "I'm doing well, thank you for asking! How can I assist you?"
        
        elif any(thanks in user_input_lower for thanks in ['thank you', 'thanks']):
            return "You're welcome! Is there anything else I can help you with?"
        
        elif any(goodbye in user_input_lower for goodbye in ['goodbye', 'bye', 'see you']):
            return "Goodbye! Have a great day!"
        
        elif 'time' in user_input_lower:
            import datetime
            current_time = datetime.datetime.now().strftime("%I:%M %p")
            return f"The current time is {current_time}."
        
        elif 'date' in user_input_lower:
            import datetime
            current_date = datetime.datetime.now().strftime("%B %d, %Y")
            return f"Today's date is {current_date}."
        
        else:
            return "I understand you're asking about something, but I'm operating in limited mode right now. Could you try rephrasing your question?"
    
    def _update_average(self, current_avg: float, new_value: float, count: int) -> float:
        """Update running average."""
        if count <= 1:
            return new_value
        return ((current_avg * (count - 1)) + new_value) / count
    
    async def enhance_local_response(self, local_response: str, user_query: str, 
                                   context: Dict[str, Any] = None) -> str:
        """
        Enhance a local response using OpenAI if available and configured.
        
        Args:
            local_response: Response from local processing
            user_query: Original user query
            context: Additional context
            
        Returns:
            Enhanced response or original response if enhancement fails
        """
        if not self.openai_provider or not self.openai_provider.is_available():
            return local_response
        
        try:
            enhanced = await self.openai_provider.enhance_response(
                original_response=local_response,
                user_query=user_query,
                context=context or {}
            )
            
            if enhanced:
                self.logger.debug("Response enhanced with OpenAI")
                return enhanced
            
        except Exception as e:
            self.logger.error(f"Response enhancement failed: {e}")
        
        return local_response
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get routing statistics."""
        total = max(self.total_queries, 1)  # Avoid division by zero
        
        return {
            'total_queries': self.total_queries,
            'openai_queries': self.openai_queries,
            'local_queries': self.local_queries,
            'fallback_queries': self.fallback_queries,
            'failed_queries': self.failed_queries,
            'openai_percentage': (self.openai_queries / total) * 100,
            'local_percentage': (self.local_queries / total) * 100,
            'fallback_percentage': (self.fallback_queries / total) * 100,
            'failure_percentage': (self.failed_queries / total) * 100,
            'average_local_time': self.average_local_time,
            'average_openai_time': self.average_openai_time,
            'openai_provider_stats': self.openai_provider.get_usage_stats() if self.openai_provider else {}
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on router and providers."""
        health_status = {
            'router_healthy': True,
            'local_processing_available': True,
            'openai_available': False,
            'statistics': self.get_statistics()
        }
        
        if self.openai_provider:
            openai_health = await self.openai_provider.health_check()
            health_status['openai_available'] = openai_health['healthy']
            health_status['openai_health'] = openai_health
        
        return health_status
