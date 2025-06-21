"""Error handling utilities for LLM operations"""

def handle_llm_error(error):
    """Handle and categorize LLM errors"""
    error_message = str(error).lower()
    
    if 'connection' in error_message or 'network' in error_message:
        return {
            'error': 'Network connection error. Please check your internet connection and try again.',
            'type': 'network_error'
        }, 503
    elif 'timeout' in error_message:
        return {
            'error': 'Request timeout. The analysis is taking too long. Try with shorter code.',
            'type': 'timeout_error'
        }, 504
    elif 'rate limit' in error_message:
        return {
            'error': 'Rate limit exceeded. Please wait a moment and try again.',
            'type': 'rate_limit'
        }, 429
    elif 'api key' in error_message or 'authentication' in error_message:
        return {
            'error': 'Invalid API key. Please check your API key configuration.',
            'type': 'auth_error'
        }, 401
    elif 'quota' in error_message or 'billing' in error_message:
        return {
            'error': 'API quota exceeded or billing issue. Please check your account.',
            'type': 'quota_error'
        }, 402
    else:
        return {
            'error': f'Analysis failed: {str(error)}',
            'type': 'general_error'
        }, 500
