from flask import Blueprint, request, jsonify
import sys
import os

# Add the parent directory to the path to import from llm package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm.providers import DEFAULT_PROVIDERS
from llm.analysis import analyze_code, analyze_multiple_files, get_all_sessions, get_session_history, clear_session_memory
from llm.chat import handle_chat_followup
from llm.connection_test import test_llm_connection
from llm.error_handling import handle_llm_error

llm_bp = Blueprint('llm', __name__)



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
def analyze_code_route():
    """Analyze code and provide suggestions"""
    try:
        data = request.get_json()
        result = analyze_code(data)
        return jsonify(result)
    except Exception as e:
        error_response, status_code = handle_llm_error(e)
        return jsonify(error_response), status_code
        
@llm_bp.route('/analyze-multiple', methods=['POST'])
def analyze_multiple_files_route():
    """Analyze multiple files and provide comprehensive analysis"""
    try:
        data = request.get_json()
        result = analyze_multiple_files(data)
        return jsonify(result)
    except Exception as e:
        error_response, status_code = handle_llm_error(e)
        return jsonify(error_response), status_code

@llm_bp.route('/chat', methods=['POST'])
def chat_route():
    """Handle follow-up questions and conversations"""
    try:
        data = request.get_json()
        result = handle_chat_followup(data)
        return jsonify(result)
    except Exception as e:
        error_response, status_code = handle_llm_error(e)
        return jsonify(error_response), status_code

@llm_bp.route('/test-connection', methods=['POST'])
def test_connection_route():
    """Test connection to LLM provider with given configuration"""
    try:
        data = request.get_json()
        result = test_llm_connection(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@llm_bp.route('/sessions/<session_id>/clear', methods=['DELETE'])
def clear_session_route(session_id):
    """Clear conversation memory for a session"""
    try:
        success = clear_session_memory(session_id)
        if success:
            return jsonify({'message': f'Session {session_id} cleared successfully'})
        else:
            return jsonify({'message': f'Session {session_id} not found'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/sessions', methods=['GET'])
def get_sessions_route():
    """Get list of active sessions"""
    try:
        sessions = get_all_sessions()
        return jsonify({'sessions': sessions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@llm_bp.route('/sessions/<session_id>/history', methods=['GET'])
def get_session_history_route(session_id):
    """Get conversation history for a session"""
    try:
        messages = get_session_history(session_id)
        return jsonify({'messages': messages})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

