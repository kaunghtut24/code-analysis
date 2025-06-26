"""Chat functionality for follow-up questions and conversations"""

from langchain_core.prompts import ChatPromptTemplate
from .providers import get_llm, DEFAULT_PROVIDERS
from .analysis import get_conversation_memory

def handle_chat_followup(data):
    """Handle follow-up questions and conversations"""
    message = data.get('message')
    session_id = data.get('session_id', 'default')
    
    # LLM configuration from request
    provider = data.get('provider', 'openai')
    model = data.get('model')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    temperature = data.get('temperature', 0.7)
    
    if not message:
        raise ValueError('Message required')
    
    # API key handling:
    # - Ollama: No API key needed
    # - Standard providers (openai, anthropic, azure): Can use environment variables if no API key provided
    # - Custom providers: Must provide API key in request
    if provider == 'custom' and not api_key:
        raise ValueError('API key required for custom providers. Please configure your API key in Settings.')

    # For standard providers, let get_llm handle environment variable fallback
    
    llm = get_llm(
        provider=provider,
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature
    )
    
    # Get conversation memory for this session
    memory = get_conversation_memory(session_id)
    
    # Build context from conversation history
    context = ""
    messages = memory.get_messages()
    if messages:
        context = "Previous conversation context:\n"
        for msg in messages[-6:]:  # Last 6 messages for context
            role = "User" if msg['type'] == "human" else "Assistant"
            content = msg['content'][:300] + "..." if len(msg['content']) > 300 else msg['content']
            context += f"{role}: {content}\n"
        context += "\n"
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "You are an expert programming assistant. Use the conversation context to provide relevant and helpful responses. Be specific and actionable in your advice."),
        ("human", f"{context}Current question: {message}")
    ])
    
    # Get LLM response
    response = llm.invoke(prompt_template.format_messages())
    
    # Update conversation memory
    memory.add_user_message(message)
    memory.add_ai_message(response.content)
    
    return {
        'response': response.content,
        'session_id': session_id,
        'provider': provider,
        'model': model or DEFAULT_PROVIDERS[provider]['default_model']
    }
