from flask import Blueprint, request, jsonify
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.memory import ConversationBufferMemory
import os
import json
import requests

llm_bp = Blueprint('llm', __name__)

# Global memory storage for conversations (in production, use a database)
conversation_memories = {}

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
            'llama3.2:3b',
            'llama3.2:1b',
            'llama3.1:8b',
            'llama3.1:70b',
            'codellama:7b',
            'codellama:13b',
            'mistral:7b',
            'phi3:mini',
            'qwen2.5:7b',
            'deepseek-coder:6.7b'
        ],
        'default_model': 'llama3.2:3b',
        'api_key_env': None,  # Ollama doesn't need API key
        'base_url': 'http://localhost:11434/v1',
        'allow_custom': True
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

def get_llm(provider='openai', model=None, api_key=None, base_url=None, temperature=0.7):
    """Initialize and return LLM instance with configurable provider and model"""
    
    # Get provider configuration
    provider_config = DEFAULT_PROVIDERS.get(provider, DEFAULT_PROVIDERS['openai'])
    
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
    
    # Create LLM instance with proper parameters
    llm_kwargs = {
        'api_key': api_key,  # Use 'api_key' instead of 'openai_api_key'
        'model': model,
        'temperature': temperature,
    }
    
    if base_url:
        llm_kwargs['base_url'] = base_url  # Use 'base_url' instead of 'openai_api_base'
    
    return ChatOpenAI(**llm_kwargs)

@llm_bp.route('/providers', methods=['GET'])
def get_providers():
    """Get list of available LLM providers and their models"""
    try:
        return jsonify({
            'providers': DEFAULT_PROVIDERS,
            'default_provider': 'openai'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/models', methods=['GET'])
def get_models():
    """Get available models for a specific provider"""
    try:
        provider = request.args.get('provider', 'openai')
        provider_config = DEFAULT_PROVIDERS.get(provider, DEFAULT_PROVIDERS['openai'])
        
        return jsonify({
            'provider': provider,
            'models': provider_config['models'],
            'default_model': provider_config['default_model']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/analyze', methods=['POST'])
def analyze_code():
    """Analyze code and provide suggestions"""
    try:
        data = request.get_json()
        code = data.get('code')
        analysis_type = data.get('type', 'general')  # general, debug, improve, correct
        session_id = data.get('session_id', 'default')
        
        # LLM configuration from request
        provider = data.get('provider', 'openai')
        model = data.get('model')
        api_key = data.get('api_key')
        base_url = data.get('base_url')
        temperature = data.get('temperature', 0.7)
        
        if not code:
            return jsonify({'error': 'Code content required'}), 400
        
        if not api_key and provider != 'ollama':
            return jsonify({'error': 'API key required. Please configure your API key in Settings.'}), 400
        
        llm = get_llm(
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature
        )
        
        # Get or create conversation memory for this session
        if session_id not in conversation_memories:
            conversation_memories[session_id] = ConversationBufferMemory()
        
        memory = conversation_memories[session_id]
        
        # Define different prompts based on analysis type
        prompts = {
            'general': """You are an expert programmer providing code quality analysis. Analyze the following code and provide comprehensive feedback including:
            1. Code structure and organization
            2. Potential bugs or issues
            3. Performance considerations
            4. Best practices and coding standards
            5. Security considerations
            6. Maintainability improvements
            
            Code to analyze:
            {code}""",
            
            'debug': """You are an expert debugger. Analyze the following code and identify:
            1. Potential bugs and errors
            2. Logic issues
            3. Runtime errors
            4. Edge cases that might cause problems
            5. Specific solutions for each issue found
            
            Code to debug:
            {code}""",
            
            'improve': """You are an expert code reviewer. Analyze the following code and suggest specific improvements for:
            1. Performance optimization
            2. Code readability and clarity
            3. Maintainability enhancements
            4. Modern language features usage
            5. Design patterns implementation
            6. Code organization and structure
            
            Code to improve:
            {code}""",
            
            'correct': """You are an expert programmer. Analyze the following code and provide:
            1. Corrected versions of any issues found
            2. Explanations for each correction
            3. Before/after comparisons
            4. Best practices applied in corrections
            
            Code to correct:
            {code}"""
        }
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are an expert programmer providing code analysis and improvements. Provide detailed, actionable feedback."),
            ("human", prompts.get(analysis_type, prompts['general']))
        ])
        
        # Get LLM response
        messages = prompt_template.format_messages(code=code)
        response = llm.invoke(messages)
        
        # Store in conversation memory
        memory.chat_memory.add_user_message(f"Analyze this {analysis_type} code: {code[:100]}...")
        memory.chat_memory.add_ai_message(response.content)
        
        return jsonify({
            'analysis': response.content,
            'type': analysis_type,
            'session_id': session_id,
            'provider': provider,
            'model': model or DEFAULT_PROVIDERS[provider]['default_model']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/analyze-multiple', methods=['POST'])
def analyze_multiple_files():
    """Analyze multiple files and provide comprehensive analysis"""
    try:
        data = request.get_json()
        files = data.get('files', [])
        analysis_type = data.get('type', 'general')
        session_id = data.get('session_id', 'default')
        
        # LLM configuration from request
        provider = data.get('provider', 'openai')
        model = data.get('model')
        api_key = data.get('api_key')
        base_url = data.get('base_url')
        temperature = data.get('temperature', 0.7)
        
        if not files:
            return jsonify({'error': 'Files array required'}), 400
        
        if not api_key and provider != 'ollama':
            return jsonify({'error': 'API key required. Please configure your API key in Settings.'}), 400
        
        llm = get_llm(
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature
        )
        
        # Get or create conversation memory for this session
        if session_id not in conversation_memories:
            conversation_memories[session_id] = ConversationBufferMemory()
        
        memory = conversation_memories[session_id]
        
        # Prepare files summary for analysis
        files_summary = ""
        for i, file in enumerate(files[:10]):  # Limit to 10 files to avoid token limits
            files_summary += f"\n--- File {i+1}: {file.get('path', 'Unknown')} ---\n"
            files_summary += file.get('content', '')[:2000]  # Limit content length
            files_summary += "\n"
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are an expert programmer analyzing multiple files from a codebase. Provide comprehensive analysis covering overall architecture, patterns, and improvements."),
            ("human", f"""Analyze the following codebase files and provide:
            1. Overall code quality assessment
            2. Architecture and design patterns used
            3. Common issues across files
            4. Consistency in coding style
            5. Recommendations for improvement
            6. Security considerations
            7. Performance optimization opportunities
            
            Files to analyze:
            {files_summary}""")
        ])
        
        # Get LLM response
        response = llm.invoke(prompt_template.format_messages())
        
        # Store in conversation memory
        memory.chat_memory.add_user_message(f"Analyze {len(files)} files from codebase")
        memory.chat_memory.add_ai_message(response.content)
        
        return jsonify({
            'analysis': response.content,
            'type': 'multiple_files',
            'files_analyzed': len(files),
            'session_id': session_id,
            'provider': provider,
            'model': model or DEFAULT_PROVIDERS[provider]['default_model']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/chat', methods=['POST'])
def chat_followup():
    """Handle follow-up questions and conversations"""
    try:
        data = request.get_json()
        message = data.get('message')
        session_id = data.get('session_id', 'default')
        
        # LLM configuration from request
        provider = data.get('provider', 'openai')
        model = data.get('model')
        api_key = data.get('api_key')
        base_url = data.get('base_url')
        temperature = data.get('temperature', 0.7)
        
        if not message:
            return jsonify({'error': 'Message required'}), 400
        
        if not api_key and provider != 'ollama':
            return jsonify({'error': 'API key required. Please configure your API key in Settings.'}), 400
        
        llm = get_llm(
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature
        )
        
        # Get conversation memory for this session
        if session_id not in conversation_memories:
            conversation_memories[session_id] = ConversationBufferMemory()
        
        memory = conversation_memories[session_id]
        
        # Build context from conversation history
        context = ""
        if memory.chat_memory.messages:
            context = "Previous conversation context:\n"
            for msg in memory.chat_memory.messages[-6:]:  # Last 6 messages for context
                role = "User" if msg.type == "human" else "Assistant"
                content = msg.content[:300] + "..." if len(msg.content) > 300 else msg.content
                context += f"{role}: {content}\n"
            context += "\n"
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are an expert programming assistant. Use the conversation context to provide relevant and helpful responses. Be specific and actionable in your advice."),
            ("human", f"{context}Current question: {message}")
        ])
        
        # Get LLM response
        response = llm.invoke(prompt_template.format_messages())
        
        # Update conversation memory
        memory.chat_memory.add_user_message(message)
        memory.chat_memory.add_ai_message(response.content)
        
        return jsonify({
            'response': response.content,
            'session_id': session_id,
            'provider': provider,
            'model': model or DEFAULT_PROVIDERS[provider]['default_model']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/test-connection', methods=['POST'])
def test_connection():
    """Test connection to LLM provider with given configuration"""
    try:
        data = request.get_json()
        provider = data.get('provider', 'openai')
        model = data.get('model')
        api_key = data.get('api_key')
        base_url = data.get('base_url')
        
        if not api_key and provider != 'ollama':
            return jsonify({'error': 'API key required for testing'}), 400
        
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
        
        return jsonify({
            'success': True,
            'message': 'Connection test successful',
            'response': response.content,
            'provider': provider,
            'model': model or DEFAULT_PROVIDERS[provider]['default_model']
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@llm_bp.route('/sessions/<session_id>/clear', methods=['DELETE'])
def clear_session(session_id):
    """Clear conversation memory for a session"""
    try:
        if session_id in conversation_memories:
            del conversation_memories[session_id]
        
        return jsonify({'message': f'Session {session_id} cleared successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Get list of active sessions"""
    try:
        sessions = []
        for session_id, memory in conversation_memories.items():
            message_count = len(memory.chat_memory.messages)
            sessions.append({
                'session_id': session_id,
                'message_count': message_count,
                'last_activity': 'recent'  # In production, track actual timestamps
            })
        
        return jsonify({'sessions': sessions})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/sessions/<session_id>/history', methods=['GET'])
def get_session_history(session_id):
    """Get conversation history for a session"""
    try:
        if session_id not in conversation_memories:
            return jsonify({'messages': []})
        
        memory = conversation_memories[session_id]
        messages = []
        
        for msg in memory.chat_memory.messages:
            messages.append({
                'type': 'user' if msg.type == 'human' else 'assistant',
                'content': msg.content,
                'timestamp': 'recent'  # In production, use actual timestamps
            })
        
        return jsonify({'messages': messages})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

