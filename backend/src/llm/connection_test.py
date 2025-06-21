"""Connection testing functionality for LLM providers"""

from langchain_core.prompts import ChatPromptTemplate
from .providers import get_llm, DEFAULT_PROVIDERS

def test_llm_connection(data):
    """Test connection to LLM provider with given configuration"""
    provider = data.get('provider', 'openai')
    model = data.get('model')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    
    if not api_key and provider != 'ollama':
        raise ValueError('API key required for testing')
    
    # Create test LLM instance
    llm = get_llm(
        provider=provider,
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0.1
    )
    
    # Send a simple test message
    test_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("human", "Say 'Connection successful' if you can read this message.")
    ])

    response = llm.invoke(test_prompt.format_messages())
    
    return {
        'success': True,
        'message': 'Connection test successful',
        'response': response.content,
        'provider': provider,
        'model': model or DEFAULT_PROVIDERS[provider]['default_model']
    }
