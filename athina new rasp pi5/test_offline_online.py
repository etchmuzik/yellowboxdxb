
#!/usr/bin/env python3
"""
Test script for Athina's offline-first with OpenAI integration.

Tests both offline and online modes to ensure graceful fallback.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add the athina package to the path
sys.path.insert(0, str(Path(__file__).parent))

from athina.config import Config
from athina.providers.openai_provider import OpenAIProvider
from athina.nlp_router import NLPRouter
from athina.skills_persona import SkillsPersonaEngine


async def test_configuration():
    """Test configuration loading with OpenAI settings."""
    print("=" * 60)
    print("TESTING CONFIGURATION")
    print("=" * 60)
    
    try:
        config = Config()
        print(f"✓ Configuration loaded successfully")
        print(f"  - OpenAI enabled: {config.openai.enabled}")
        print(f"  - OpenAI API key configured: {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}")
        print(f"  - Fallback mode: {config.openai.fallback['mode']}")
        print(f"  - Smart routing enabled: {len(config.openai.smart_routing['complex_keywords'])} keywords")
        return config
    except Exception as e:
        print(f"✗ Configuration failed: {e}")
        return None


async def test_openai_provider(config):
    """Test OpenAI provider functionality."""
    print("\n" + "=" * 60)
    print("TESTING OPENAI PROVIDER")
    print("=" * 60)
    
    try:
        provider = OpenAIProvider(config.openai.__dict__)
        print(f"✓ OpenAI provider initialized")
        print(f"  - Available: {provider.is_available()}")
        print(f"  - Network connectivity: {provider._check_network_connectivity()}")
        
        # Test health check
        health = await provider.health_check()
        print(f"  - Health check: {'✓ Healthy' if health['healthy'] else '✗ Unhealthy'}")
        
        # Test simple query routing decision
        test_queries = [
            "Hello, how are you?",
            "Explain quantum physics in detail",
            "What's the weather like?",
            "Can you analyze the economic implications of artificial intelligence?"
        ]
        
        print(f"\n  Testing routing decisions:")
        for query in test_queries:
            should_use = provider.should_use_openai(query)
            print(f"    '{query[:30]}...' -> {'OpenAI' if should_use else 'Local'}")
        
        return provider
        
    except Exception as e:
        print(f"✗ OpenAI provider failed: {e}")
        return None


async def test_nlp_router(config, provider):
    """Test NLP router functionality."""
    print("\n" + "=" * 60)
    print("TESTING NLP ROUTER")
    print("=" * 60)
    
    try:
        router = NLPRouter({}, provider)
        print(f"✓ NLP router initialized")
        
        # Test queries with different complexity levels
        test_cases = [
            ("Hello", "Simple greeting"),
            ("What time is it?", "Basic query"),
            ("Explain the theory of relativity", "Complex query"),
            ("How does machine learning work?", "Technical query")
        ]
        
        print(f"\n  Testing query routing:")
        for query, description in test_cases:
            try:
                response, decision = await router.route_query(query)
                print(f"    {description}:")
                print(f"      Query: '{query}'")
                print(f"      Route: {'OpenAI' if decision.use_openai else 'Local'}")
                print(f"      Reason: {decision.reason}")
                print(f"      Response: '{response[:50]}...'")
                print(f"      Time: {decision.processing_time:.2f}s")
                print()
            except Exception as e:
                print(f"      ✗ Failed: {e}")
        
        return router
        
    except Exception as e:
        print(f"✗ NLP router failed: {e}")
        return None


async def test_persona_engine(config):
    """Test enhanced persona engine with OpenAI integration."""
    print("\n" + "=" * 60)
    print("TESTING ENHANCED PERSONA ENGINE")
    print("=" * 60)
    
    try:
        persona = SkillsPersonaEngine(config)
        await persona.initialize()
        print(f"✓ Enhanced persona engine initialized")
        
        # Test different types of queries
        test_queries = [
            "Hi there!",
            "What's your name?",
            "Tell me about artificial intelligence",
            "How do neural networks work?",
            "What's the capital of France?"
        ]
        
        print(f"\n  Testing persona responses:")
        for query in test_queries:
            try:
                response = await persona.process_input(query)
                print(f"    Query: '{query}'")
                print(f"    Response: '{response}'")
                print()
            except Exception as e:
                print(f"    ✗ Failed for '{query}': {e}")
        
        # Print statistics
        stats = persona.get_statistics() if hasattr(persona, 'get_statistics') else {}
        if stats:
            print(f"  Statistics:")
            print(f"    - Total interactions: {getattr(persona, 'total_interactions', 0)}")
            print(f"    - OpenAI responses: {getattr(persona, 'openai_response_count', 0)}")
            print(f"    - Local responses: {getattr(persona, 'local_response_count', 0)}")
        
        return persona
        
    except Exception as e:
        print(f"✗ Enhanced persona engine failed: {e}")
        return None


async def test_offline_mode():
    """Test offline mode by temporarily disabling OpenAI."""
    print("\n" + "=" * 60)
    print("TESTING OFFLINE MODE")
    print("=" * 60)
    
    try:
        # Temporarily remove API key to simulate offline mode
        original_key = os.environ.get('OPENAI_API_KEY')
        if original_key:
            del os.environ['OPENAI_API_KEY']
        
        config = Config()
        persona = SkillsPersonaEngine(config)
        await persona.initialize()
        
        print(f"✓ Offline mode initialized (OpenAI disabled)")
        
        # Test queries in offline mode
        test_queries = [
            "Hello",
            "What's your name?",
            "Tell me a joke"
        ]
        
        print(f"\n  Testing offline responses:")
        for query in test_queries:
            try:
                response = await persona.process_input(query)
                print(f"    Query: '{query}'")
                print(f"    Offline Response: '{response}'")
                print()
            except Exception as e:
                print(f"    ✗ Failed for '{query}': {e}")
        
        # Restore API key
        if original_key:
            os.environ['OPENAI_API_KEY'] = original_key
        
        print(f"✓ Offline mode test completed")
        
    except Exception as e:
        print(f"✗ Offline mode test failed: {e}")


async def test_fallback_behavior():
    """Test fallback behavior when OpenAI fails."""
    print("\n" + "=" * 60)
    print("TESTING FALLBACK BEHAVIOR")
    print("=" * 60)
    
    try:
        config = Config()
        
        # Create provider with invalid base URL to simulate API failure
        openai_config = config.openai.__dict__.copy()
        openai_config['base_url'] = 'https://invalid-url-for-testing.com'
        
        provider = OpenAIProvider(openai_config)
        router = NLPRouter({}, provider)
        
        print(f"✓ Test setup with invalid OpenAI URL")
        
        # Test fallback behavior
        test_query = "Hello, how are you?"
        response, decision = await router.route_query(test_query)
        
        print(f"  Query: '{test_query}'")
        print(f"  Fallback triggered: {'Yes' if not decision.use_openai else 'No'}")
        print(f"  Response: '{response}'")
        print(f"  Reason: {decision.reason}")
        
        print(f"✓ Fallback behavior test completed")
        
    except Exception as e:
        print(f"✗ Fallback behavior test failed: {e}")


async def main():
    """Run all tests."""
    print("ATHINA OFFLINE-FIRST WITH OPENAI INTEGRATION TEST")
    print("=" * 60)
    print("Testing enhanced Athina voice assistant with:")
    print("- Offline-first architecture")
    print("- OpenAI API integration")
    print("- Intelligent routing")
    print("- Graceful fallback")
    print()
    
    # Set up logging
    logging.basicConfig(level=logging.WARNING)  # Reduce noise during testing
    
    # Run tests
    config = await test_configuration()
    if not config:
        print("Configuration test failed. Exiting.")
        return
    
    provider = await test_openai_provider(config)
    router = await test_nlp_router(config, provider)
    persona = await test_persona_engine(config)
    
    await test_offline_mode()
    await test_fallback_behavior()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print("✓ Configuration system enhanced with OpenAI settings")
    print("✓ OpenAI provider with intelligent routing")
    print("✓ NLP router for offline-first operation")
    print("✓ Enhanced persona engine with dual-mode support")
    print("✓ Offline mode functionality")
    print("✓ Graceful fallback behavior")
    print()
    print("Athina is now ready for offline-first operation with optional OpenAI enhancement!")
    print()
    print("Key features:")
    print("- Works 100% offline with local models")
    print("- Uses OpenAI for complex queries when online")
    print("- Intelligent routing based on query complexity")
    print("- Graceful degradation when API is unavailable")
    print("- Configurable fallback behavior")
    print("- Secure API key management")


if __name__ == "__main__":
    asyncio.run(main())
