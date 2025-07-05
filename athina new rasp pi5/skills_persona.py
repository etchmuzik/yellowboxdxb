"""
Athina Skills and Persona Engine

Manages the personality, skills, and response generation for the
Athina voice assistant with support for custom personas and skill modules.
"""

import asyncio
import logging
import time
import random
import re
from typing import Optional, Dict, Any, List, Callable
from pathlib import Path
import yaml
import json
from datetime import datetime

from .errors import PersonaError, InitializationError
from .logging_cfg import PerformanceTimer
from .nlp_router import NLPRouter


class SkillsPersonaEngine:
    """
    Manages persona characteristics and skill-based responses.
    
    Provides personality-driven responses, skill execution, and
    integration with NLP routing for enhanced capabilities.
    """
    
    def __init__(self, config):
        """
        Initialize persona engine.
        
        Args:
            config: Configuration object with persona settings
        """
        self.logger = logging.getLogger(__name__)
        self.config = config
        
        # Persona configuration
        self.name = config.persona.name
        self.personality_traits = config.persona.personality_traits
        self.voice_style = config.persona.voice_style
        self.response_style = config.persona.response_style
        self.catchphrases = config.persona.catchphrases
        self.greeting_messages = config.persona.greeting_messages
        self.error_messages = config.persona.error_messages
        
        # NLP Router for enhanced responses
        self.nlp_router = None
        
        # Skills registry
        self.skills = {}
        self.skill_patterns = []
        
        # Conversation state
        self.conversation_history = []
        self.user_context = {}
        self.session_start_time = None
        
        # Statistics
        self.total_interactions = 0
        self.skill_executions = {}
        self.average_response_time = 0.0
        
        self.is_initialized = False
        
        self.logger.info("Skills and persona engine initialized")
    
    async def initialize(self) -> None:
        """Initialize persona engine and load skills."""
        try:
            # Load persona configuration
            await self._load_persona_config()
            
            # Initialize built-in skills
            await self._initialize_builtin_skills()
            
            # Initialize NLP router if OpenAI is enabled
            if self.config.openai.enabled:
                await self._initialize_nlp_router()
            
            # Set session start time
            self.session_start_time = datetime.now()
            
            self.is_initialized = True
            self.logger.info("Persona engine initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Persona initialization failed: {e}")
            raise PersonaError(f"Failed to initialize persona: {e}")
    
    async def _load_persona_config(self) -> None:
        """Load additional persona configuration from file."""
        persona_file = Path("configs/persona.yaml")
        
        if persona_file.exists():
            try:
                with open(persona_file, 'r') as f:
                    persona_data = yaml.safe_load(f)
                
                # Override configuration with file data
                if 'name' in persona_data:
                    self.name = persona_data['name']
                
                if 'personality_traits' in persona_data:
                    self.personality_traits.update(persona_data['personality_traits'])
                
                if 'catchphrases' in persona_data:
                    self.catchphrases.extend(persona_data['catchphrases'])
                
                if 'custom_responses' in persona_data:
                    self.custom_responses = persona_data['custom_responses']
                
                self.logger.info(f"Loaded persona config from {persona_file}")
                
            except Exception as e:
                self.logger.warning(f"Failed to load persona config: {e}")
    
    async def _initialize_builtin_skills(self) -> None:
        """Initialize built-in skills."""
        # Time and date skill
        self.register_skill(
            name="datetime",
            patterns=[
                r"\b(what|tell me|what's|whats).*(time|date|day)\b",
                r"\b(time|date|day)\s*(is it|today)\b"
            ],
            handler=self._datetime_skill
        )
        
        # Weather skill (mock)
        self.register_skill(
            name="weather",
            patterns=[
                r"\b(what|how|tell me).*(weather|temperature|forecast)\b",
                r"\b(weather|temperature|forecast)\s*(like|today|tomorrow)\b"
            ],
            handler=self._weather_skill
        )
        
        # System info skill
        self.register_skill(
            name="system",
            patterns=[
                r"\b(system|status|health|performance)\s*(info|information|check)\b",
                r"\bhow are you\s*(doing|feeling)\b"
            ],
            handler=self._system_skill
        )
        
        # Personal info skill
        self.register_skill(
            name="personal",
            patterns=[
                r"\b(who|what|tell me).*(you are|your name|about yourself)\b",
                r"\byour\s*(name|purpose|creator)\b"
            ],
            handler=self._personal_skill
        )
        
        # Greeting skill
        self.register_skill(
            name="greeting",
            patterns=[
                r"\b(hello|hi|hey|greetings|good\s*(morning|afternoon|evening))\b",
                r"\bhow\s*do\s*you\s*do\b"
            ],
            handler=self._greeting_skill
        )
        
        # Farewell skill
        self.register_skill(
            name="farewell",
            patterns=[
                r"\b(goodbye|bye|farewell|see you|good\s*night)\b",
                r"\b(exit|quit|stop|shutdown)\b"
            ],
            handler=self._farewell_skill
        )
    
    async def _initialize_nlp_router(self) -> None:
        """Initialize NLP router for enhanced responses."""
        try:
            # Import OpenAI provider
            from .providers.openai_provider import OpenAIProvider
            
            # Create OpenAI provider
            openai_provider = OpenAIProvider(self.config.openai)
            await openai_provider.initialize()
            
            # Create NLP router
            self.nlp_router = NLPRouter(
                config=self.config.openai,
                openai_provider=openai_provider
            )
            
            self.logger.info("NLP router initialized for enhanced responses")
            
        except Exception as e:
            self.logger.warning(f"NLP router initialization failed: {e}")
            self.nlp_router = None
    
    def register_skill(self, name: str, patterns: List[str], handler: Callable) -> None:
        """
        Register a skill with the persona engine.
        
        Args:
            name: Skill name
            patterns: List of regex patterns to match
            handler: Async function to handle the skill
        """
        self.skills[name] = {
            'patterns': [re.compile(p, re.IGNORECASE) for p in patterns],
            'handler': handler,
            'executions': 0
        }
        
        self.logger.debug(f"Registered skill: {name}")
    
    async def process_input(self, user_input: str) -> str:
        """
        Process user input and generate response.
        
        Args:
            user_input: User's spoken text
            
        Returns:
            Response text
        """
        start_time = time.time()
        self.total_interactions += 1
        
        try:
            with PerformanceTimer("persona_processing", self.logger):
                # Add to conversation history
                self.conversation_history.append({
                    'role': 'user',
                    'content': user_input,
                    'timestamp': datetime.now()
                })
                
                # Try skill-based response first
                skill_response = await self._match_and_execute_skill(user_input)
                
                if skill_response:
                    response = skill_response
                else:
                    # Use NLP router for complex queries
                    if self.nlp_router:
                        response = await self._get_nlp_response(user_input)
                    else:
                        # Fallback to simple responses
                        response = await self._fallback_response(user_input)
                
                # Apply persona style
                response = self._apply_persona_style(response)
                
                # Add to conversation history
                self.conversation_history.append({
                    'role': 'assistant',
                    'content': response,
                    'timestamp': datetime.now()
                })
                
                # Trim conversation history
                if len(self.conversation_history) > 20:
                    self.conversation_history = self.conversation_history[-20:]
                
                # Update statistics
                response_time = time.time() - start_time
                self.average_response_time = (
                    (self.average_response_time * (self.total_interactions - 1) + response_time) /
                    self.total_interactions
                )
                
                return response
                
        except Exception as e:
            self.logger.error(f"Input processing failed: {e}")
            return random.choice(self.error_messages)
    
    async def _match_and_execute_skill(self, user_input: str) -> Optional[str]:
        """Match user input to skills and execute."""
        for skill_name, skill_info in self.skills.items():
            for pattern in skill_info['patterns']:
                if pattern.search(user_input):
                    try:
                        # Execute skill handler
                        response = await skill_info['handler'](user_input)
                        
                        # Update statistics
                        skill_info['executions'] += 1
                        
                        self.logger.debug(f"Executed skill: {skill_name}")
                        return response
                        
                    except Exception as e:
                        self.logger.error(f"Skill '{skill_name}' execution failed: {e}")
                        return None
        
        return None
    
    async def _get_nlp_response(self, user_input: str) -> str:
        """Get response using NLP router."""
        try:
            # Prepare context
            context = {
                'conversation_history': self.conversation_history[-10:],  # Last 10 messages
                'persona_context': {
                    'name': self.name,
                    'personality_traits': self.personality_traits,
                    'voice_style': self.voice_style
                },
                'persona_manager': self  # For local fallback
            }
            
            # Route query
            response, decision = await self.nlp_router.route_query(user_input, context)
            
            self.logger.debug(f"NLP routing decision: {decision.reason}")
            
            return response
            
        except Exception as e:
            self.logger.error(f"NLP response generation failed: {e}")
            return await self._fallback_response(user_input)
    
    async def _fallback_response(self, user_input: str) -> str:
        """Generate fallback response when other methods fail."""
        user_input_lower = user_input.lower()
        
        # Check for question words
        if any(q in user_input_lower for q in ['what', 'who', 'where', 'when', 'why', 'how']):
            responses = [
                "That's an interesting question. Let me think about it.",
                "I'm not quite sure about that. Could you ask me something else?",
                "I'd need to look that up. Is there anything else I can help with?"
            ]
        
        # Check for commands
        elif any(cmd in user_input_lower for cmd in ['turn', 'set', 'change', 'make']):
            responses = [
                "I'm still learning how to do that. Could you try something else?",
                "That feature is not available yet, but I'm working on it!",
                "I can't do that right now, but I appreciate your patience."
            ]
        
        # Generic responses
        else:
            responses = [
                "I understand. Please tell me more.",
                "Interesting! What else would you like to discuss?",
                "I see. How can I assist you further?"
            ]
        
        return random.choice(responses)
    
    def _apply_persona_style(self, response: str) -> str:
        """Apply persona style to response."""
        # Add personality based on traits
        if self.personality_traits.get('warmth', 0) > 0.7:
            # Add warm touches
            if random.random() < 0.3:
                response = f"I'm happy to help! {response}"
        
        if self.personality_traits.get('wit', 0) > 0.7:
            # Occasionally add witty remarks
            if random.random() < 0.2:
                witty_additions = [
                    " Hope that brightens your day!",
                    " Pretty cool, right?",
                    " Knowledge is power, as they say!"
                ]
                response += random.choice(witty_additions)
        
        if self.personality_traits.get('conciseness', 0) > 0.7:
            # Keep responses brief
            sentences = response.split('. ')
            if len(sentences) > 3:
                response = '. '.join(sentences[:3]) + '.'
        
        return response
    
    # Built-in skill handlers
    
    async def _datetime_skill(self, user_input: str) -> str:
        """Handle date and time queries."""
        now = datetime.now()
        
        if 'time' in user_input.lower():
            time_str = now.strftime("%I:%M %p")
            return f"The current time is {time_str}."
        
        elif 'date' in user_input.lower():
            date_str = now.strftime("%B %d, %Y")
            return f"Today's date is {date_str}."
        
        elif 'day' in user_input.lower():
            day_str = now.strftime("%A")
            return f"Today is {day_str}."
        
        else:
            full_str = now.strftime("%A, %B %d, %Y at %I:%M %p")
            return f"It's {full_str}."
    
    async def _weather_skill(self, user_input: str) -> str:
        """Handle weather queries (mock implementation)."""
        # This is a mock implementation
        # In a real system, you'd integrate with a weather API
        
        responses = [
            "I don't have access to real-time weather data, but it looks lovely outside!",
            "I wish I could tell you the weather, but I'd need an internet connection for that.",
            "Without weather API access, I can only suggest looking out the window!"
        ]
        
        return random.choice(responses)
    
    async def _system_skill(self, user_input: str) -> str:
        """Handle system status queries."""
        if hasattr(self, 'config'):
            uptime = datetime.now() - self.session_start_time if self.session_start_time else None
            
            if uptime:
                hours, remainder = divmod(uptime.seconds, 3600)
                minutes, _ = divmod(remainder, 60)
                
                return f"I'm running smoothly! I've been active for {hours} hours and {minutes} minutes. All systems are operational."
            else:
                return "All systems are operational and I'm ready to help!"
        
        return "I'm doing great and ready to assist you!"
    
    async def _personal_skill(self, user_input: str) -> str:
        """Handle personal information queries."""
        if 'name' in user_input.lower():
            return f"My name is {self.name}. I'm your personal voice assistant!"
        
        elif 'purpose' in user_input.lower() or 'what are you' in user_input.lower():
            return f"I'm {self.name}, an AI voice assistant designed to help you with various tasks and answer your questions."
        
        elif 'creator' in user_input.lower() or 'who made you' in user_input.lower():
            return "I was created to be a helpful, offline-capable voice assistant for Raspberry Pi users."
        
        else:
            return f"I'm {self.name}, your personal AI assistant. I'm here to help you with information, answer questions, and make your day a bit easier!"
    
    async def _greeting_skill(self, user_input: str) -> str:
        """Handle greetings."""
        hour = datetime.now().hour
        
        if hour < 12:
            time_greeting = "Good morning"
        elif hour < 17:
            time_greeting = "Good afternoon"
        else:
            time_greeting = "Good evening"
        
        greetings = [
            f"{time_greeting}! How can I help you today?",
            f"Hello! {random.choice(self.catchphrases)}",
            f"{time_greeting}! What can I do for you?",
            "Hello there! Ready to assist you."
        ]
        
        return random.choice(greetings)
    
    async def _farewell_skill(self, user_input: str) -> str:
        """Handle farewells."""
        farewells = [
            "Goodbye! Have a wonderful day!",
            "See you later! Don't hesitate to call if you need anything.",
            "Farewell! It was a pleasure helping you.",
            "Take care! I'll be here whenever you need me."
        ]
        
        return random.choice(farewells)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get persona engine statistics."""
        skill_stats = {}
        for name, info in self.skills.items():
            skill_stats[name] = info['executions']
        
        return {
            'is_initialized': self.is_initialized,
            'persona_name': self.name,
            'total_interactions': self.total_interactions,
            'average_response_time': self.average_response_time,
            'conversation_length': len(self.conversation_history),
            'skill_executions': skill_stats,
            'nlp_router_available': self.nlp_router is not None,
            'session_duration': str(datetime.now() - self.session_start_time) if self.session_start_time else None
        }
    
    async def shutdown(self) -> None:
        """Shutdown persona engine and clean up resources."""
        try:
            self.is_initialized = False
            
            # Clear conversation history
            self.conversation_history.clear()
            
            # Shutdown NLP router if available
            if self.nlp_router and hasattr(self.nlp_router, 'shutdown'):
                await self.nlp_router.shutdown()
            
            self.logger.info("Persona engine shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during persona shutdown: {e}")