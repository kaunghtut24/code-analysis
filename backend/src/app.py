#!/usr/bin/env python3
"""
AI Code Assistant - Main Application Entry Point

This is the main Flask application for the AI Code Assistant.
It provides a web API for code analysis using multiple AI providers.
"""

# Import the Flask app from main.py
from main import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
