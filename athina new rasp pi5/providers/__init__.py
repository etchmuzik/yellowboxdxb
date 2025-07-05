"""
Athina Providers Package

Contains provider implementations for external services like OpenAI
that can enhance Athina's capabilities when online.
"""

from .openai_provider import OpenAIProvider

__all__ = ['OpenAIProvider']