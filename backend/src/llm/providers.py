"""LLM Provider configurations and management"""

import os
from langchain_openai import ChatOpenAI

# Default LLM configurations
DEFAULT_PROVIDERS = {
    'openai': {
        'name': 'OpenAI',
        'models': [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo',
            'o1-preview',
            'o1-mini'
        ],
        'default_model': 'gpt-4o-mini',
        'api_key_env': 'OPENAI_API_KEY',
        'base_url': None,
        'allow_custom': True
    },
    'anthropic': {
        'name': 'Anthropic',
        'models': [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ],
        'default_model': 'claude-3-5-sonnet-20241022',
        'api_key_env': 'ANTHROPIC_API_KEY',
        'base_url': 'https://api.anthropic.com/v1',
        'allow_custom': True
    },
    'azure': {
        'name': 'Azure OpenAI',
        'models': [
            'gpt-4o',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-35-turbo'
        ],
        'default_model': 'gpt-4o',
        'api_key_env': 'AZURE_OPENAI_API_KEY',
        'base_url': None,  # Will be set from AZURE_OPENAI_ENDPOINT
        'allow_custom': True
    },
    'ollama': {
        'name': 'Ollama (Local)',
        'models': [
            'qwen3:latest',
            'llama3:8b',
            'deepseek-coder-v2:latest',
            'deepseek-r1:14b',
            'qwen3:4b',
            'gemma3:latest',
            'phi3.5:latest'
        ],
        'default_model': 'qwen3:latest',
        'api_key_env': None,  # Ollama doesn't need API key
        'base_url': 'http://localhost:11434/v1',
        'allow_custom': True,
        'cloud_available': False  # Not available in cloud deployment
    },
    'custom': {
        'name': 'Custom Provider',
        'models': [
            'gpt-3.5-turbo',
            'gpt-4',
            'llama-2-7b-chat',
            'llama-2-13b-chat',
            'codellama-7b-instruct',
            'mistral-7b-instruct'
        ],
        'default_model': 'gpt-3.5-turbo',
        'api_key_env': 'CUSTOM_API_KEY',
        'base_url': None,
        'allow_custom': True
    }
}

def get_llm(provider='openai', model=None, api_key=None, base_url=None, temperature=0.7, 
           max_tokens=None, top_p=None, frequency_penalty=None, presence_penalty=None):
    """Initialize and return LLM instance with configurable provider and advanced parameters"""

    # Get provider configuration
    provider_config = DEFAULT_PROVIDERS.get(provider, DEFAULT_PROVIDERS['openai'])

    # Set intelligent max_tokens based on model and analysis type
    if max_tokens is None:
        if model and ('gpt-4' in model.lower() or 'claude' in model.lower()):
            max_tokens = 4000  # Higher for more capable models
        elif model and ('gpt-3.5' in model.lower()):
            max_tokens = 2000  # Moderate for GPT-3.5
        else:
            max_tokens = 1500  # Conservative default

    # Determine API key (Ollama doesn't need one)
    if not api_key and provider != 'ollama':
        api_key_env = provider_config['api_key_env']
        if api_key_env:  # Some providers might not need API keys
            api_key = os.getenv(api_key_env)
            if not api_key:
                raise ValueError(f"API key not found. Please set {api_key_env} environment variable or provide api_key parameter")

    # For Ollama, we don't need an API key, use a dummy one
    if provider == 'ollama' and not api_key:
        api_key = 'ollama-local'

    # Determine model
    if not model:
        model = provider_config['default_model']

    # Determine base URL
    if not base_url:
        if provider == 'azure':
            base_url = os.getenv('AZURE_OPENAI_ENDPOINT')
            if not base_url:
                raise ValueError("Azure OpenAI endpoint not found. Please set AZURE_OPENAI_ENDPOINT environment variable")
        else:
            base_url = provider_config['base_url']

    # Create LLM instance with advanced parameters
    llm_kwargs = {
        'api_key': api_key,
        'model': model,
        'temperature': temperature,
        'max_tokens': max_tokens,
    }

    # Add optional parameters if provided (with compatibility checks)
    try:
        if top_p is not None:
            llm_kwargs['top_p'] = top_p
        if frequency_penalty is not None:
            llm_kwargs['frequency_penalty'] = frequency_penalty
        if presence_penalty is not None:
            llm_kwargs['presence_penalty'] = presence_penalty
    except Exception as param_error:
        # Some models/providers might not support these parameters
        # Remove them and continue with basic parameters
        llm_kwargs = {k: v for k, v in llm_kwargs.items()
                     if k not in ['top_p', 'frequency_penalty', 'presence_penalty']}
        print(f"Warning: Advanced parameters not supported by {provider}/{model}: {param_error}")

    if base_url:
        llm_kwargs['base_url'] = base_url

    # Handle provider-specific configurations
    if provider == 'azure':
        llm_kwargs['azure_endpoint'] = base_url
        llm_kwargs['api_version'] = "2024-02-15-preview"
        # Remove base_url for Azure as it uses azure_endpoint
        if 'base_url' in llm_kwargs:
            del llm_kwargs['base_url']

    # Try to create LLM with all parameters, fallback to basic if needed
    try:
        return ChatOpenAI(**llm_kwargs)
    except Exception as llm_error:
        # If advanced parameters cause issues, try with basic parameters only
        if any(param in llm_kwargs for param in ['top_p', 'frequency_penalty', 'presence_penalty']):
            basic_kwargs = {k: v for k, v in llm_kwargs.items()
                           if k not in ['top_p', 'frequency_penalty', 'presence_penalty']}
            print(f"Warning: Falling back to basic parameters for {provider}/{model}: {llm_error}")
            return ChatOpenAI(**basic_kwargs)
        else:
            raise llm_error

def get_model_context_limits():
    """Get context limits for different models"""
    return {
        'gpt-4': 8192,
        'gpt-4-turbo': 128000,
        'gpt-4o': 128000,
        'gpt-3.5-turbo': 4096,
        'claude-3-sonnet': 200000,
        'claude-3-opus': 200000,
        'claude-3-haiku': 200000
    }

def get_providers():
    """Get all available LLM providers and their configurations"""
    import os

    # Filter providers based on deployment environment
    available_providers = {}
    is_cloud_deployment = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('DATABASE_URL')

    for provider_id, provider_config in DEFAULT_PROVIDERS.items():
        # Skip Ollama in cloud deployment unless explicitly enabled
        if provider_id == 'ollama' and is_cloud_deployment:
            if not provider_config.get('cloud_available', False):
                continue

        available_providers[provider_id] = provider_config

    # Set default provider based on environment
    default_provider = 'openai'  # Default to OpenAI
    if not is_cloud_deployment:
        default_provider = 'ollama'  # Use Ollama locally if available

    return {
        'providers': available_providers,
        'default_provider': default_provider,
        'environment': 'cloud' if is_cloud_deployment else 'local'
    }
