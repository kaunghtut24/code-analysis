"""Code analysis functionality"""

from langchain_core.prompts import ChatPromptTemplate
from .providers import get_llm, get_model_context_limits, DEFAULT_PROVIDERS
from .prompts import ANALYSIS_PROMPTS, SYSTEM_INSTRUCTIONS

# Simple message storage class to replace deprecated ConversationBufferMemory
class SimpleMemory:
    def __init__(self):
        self.messages = []

    def add_user_message(self, message):
        self.messages.append({"type": "human", "content": message})

    def add_ai_message(self, message):
        self.messages.append({"type": "ai", "content": message})

    def get_messages(self):
        return self.messages

    def clear(self):
        self.messages = []

# Global memory storage for conversations (in production, use a database)
conversation_memories = {}

def analyze_code(data):
    """Analyze code and provide suggestions"""
    code = data.get('code')
    analysis_type = data.get('type', 'general')
    session_id = data.get('session_id', 'default')
    
    # LLM configuration from request with advanced parameters
    provider = data.get('provider', 'openai')
    model = data.get('model')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    temperature = data.get('temperature', 0.7)
    max_tokens = data.get('max_tokens')
    top_p = data.get('top_p')
    frequency_penalty = data.get('frequency_penalty')
    presence_penalty = data.get('presence_penalty')

    if not code:
        raise ValueError('Code content required')

    # API key handling:
    # - Ollama: No API key needed
    # - Standard providers (openai, anthropic, azure): Can use environment variables if no API key provided
    # - Custom providers: Must provide API key in request
    if provider == 'custom' and not api_key:
        raise ValueError('API key required for custom providers. Please configure your API key in Settings.')

    # For standard providers, let get_llm handle environment variable fallback

    # Check code length and adjust max_tokens accordingly
    code_length = len(code)
    if max_tokens is None:
        if code_length > 5000:
            max_tokens = 4000  # Longer response for complex code
        elif code_length > 2000:
            max_tokens = 3000  # Medium response
        else:
            max_tokens = 2000  # Standard response

    llm = get_llm(
        provider=provider,
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty
    )
    
    # Get or create conversation memory for this session
    if session_id not in conversation_memories:
        conversation_memories[session_id] = SimpleMemory()

    memory = conversation_memories[session_id]
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_INSTRUCTIONS.get(analysis_type, SYSTEM_INSTRUCTIONS['general'])),
        ("human", ANALYSIS_PROMPTS.get(analysis_type, ANALYSIS_PROMPTS['general']))
    ])
    
    # Check for context length issues and truncate if necessary
    try:
        messages = prompt_template.format_messages(code=code)

        # Estimate token count (rough approximation: 1 token ≈ 4 characters)
        estimated_tokens = len(str(messages)) // 4
        model_context_limits = get_model_context_limits()

        # Get context limit for current model
        context_limit = model_context_limits.get(model, 4096)

        # If estimated tokens exceed 70% of context limit, truncate code
        if estimated_tokens > context_limit * 0.7:
            max_code_length = int((context_limit * 0.7 - 1000) * 4)  # Reserve 1000 tokens for prompt
            if len(code) > max_code_length:
                truncated_code = code[:max_code_length] + "\n\n... [Code truncated due to length limits] ..."
                messages = prompt_template.format_messages(code=truncated_code)

        response = llm.invoke(messages)

    except Exception as llm_error:
        # Handle specific LLM errors
        error_message = str(llm_error).lower()

        if 'context length' in error_message or 'token limit' in error_message:
            # Try with truncated code
            max_code_length = len(code) // 2
            truncated_code = code[:max_code_length] + "\n\n... [Code truncated due to context length limits] ..."
            messages = prompt_template.format_messages(code=truncated_code)
            response = llm.invoke(messages)
        elif 'rate limit' in error_message:
            raise Exception('Rate limit exceeded. Please wait a moment and try again.') from llm_error
        elif 'api key' in error_message or 'authentication' in error_message:
            raise Exception('Invalid API key. Please check your API key configuration.') from llm_error
        elif 'quota' in error_message or 'billing' in error_message:
            raise Exception('API quota exceeded or billing issue. Please check your account.') from llm_error
        else:
            raise llm_error

    # Store in conversation memory with truncated version for memory efficiency
    memory_code = code[:200] + "..." if len(code) > 200 else code
    memory.add_user_message(f"Analyze this {analysis_type} code: {memory_code}")
    memory.add_ai_message(response.content[:1000] + "..." if len(response.content) > 1000 else response.content)

    return {
        'analysis': response.content,
        'type': analysis_type,
        'session_id': session_id,
        'provider': provider,
        'model': model or DEFAULT_PROVIDERS[provider]['default_model'],
        'tokens_used': estimated_tokens if 'estimated_tokens' in locals() else None,
        'context_limit': context_limit if 'context_limit' in locals() else None
    }

def analyze_multiple_files(data):
    """Analyze multiple files and provide comprehensive analysis"""
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
        raise ValueError('Files array required')
    
    if not api_key and provider != 'ollama':
        raise ValueError('API key required. Please configure your API key in Settings.')
    
    llm = get_llm(
        provider=provider,
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature
    )
    
    # Get or create conversation memory for this session
    if session_id not in conversation_memories:
        conversation_memories[session_id] = SimpleMemory()

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
    memory.add_user_message(f"Analyze {len(files)} files from codebase")
    memory.add_ai_message(response.content)
    
    return {
        'analysis': response.content,
        'type': 'multiple_files',
        'files_analyzed': len(files),
        'session_id': session_id,
        'provider': provider,
        'model': model or DEFAULT_PROVIDERS[provider]['default_model']
    }

def get_conversation_memory(session_id):
    """Get or create conversation memory for a session"""
    if session_id not in conversation_memories:
        conversation_memories[session_id] = SimpleMemory()
    return conversation_memories[session_id]

def clear_session_memory(session_id):
    """Clear conversation memory for a session"""
    if session_id in conversation_memories:
        del conversation_memories[session_id]
        return True
    return False

def get_all_sessions():
    """Get list of active sessions"""
    sessions = []
    for session_id, memory in conversation_memories.items():
        message_count = len(memory.get_messages())
        sessions.append({
            'session_id': session_id,
            'message_count': message_count,
            'last_activity': 'recent'  # In production, track actual timestamps
        })
    return sessions

def get_session_history(session_id):
    """Get conversation history for a session"""
    if session_id not in conversation_memories:
        return []

    memory = conversation_memories[session_id]
    messages = []

    for msg in memory.get_messages():
        messages.append({
            'type': 'user' if msg['type'] == 'human' else 'assistant',
            'content': msg['content'],
            'timestamp': 'recent'  # In production, use actual timestamps
        })

    return messages
