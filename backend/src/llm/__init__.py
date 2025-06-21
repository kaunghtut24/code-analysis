"""LLM package for code analysis functionality"""

from .providers import DEFAULT_PROVIDERS, get_llm
from .analysis import analyze_code, analyze_multiple_files, get_conversation_memory, clear_session_memory, get_all_sessions, get_session_history
from .chat import handle_chat_followup
from .connection_test import test_llm_connection
from .error_handling import handle_llm_error

__all__ = [
    'DEFAULT_PROVIDERS',
    'get_llm',
    'analyze_code',
    'analyze_multiple_files',
    'get_conversation_memory',
    'clear_session_memory',
    'get_all_sessions',
    'get_session_history',
    'handle_chat_followup',
    'test_llm_connection',
    'handle_llm_error'
]
