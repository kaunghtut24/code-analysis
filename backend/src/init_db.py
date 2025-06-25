#!/usr/bin/env python3
"""
Database initialization script for Fly.io deployment
This script runs during the release phase to set up the database
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from models.user import db
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_database():
    """Initialize the database with tables"""
    
    # Create Flask app
    app = Flask(__name__)
    
    # Database configuration
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Fly.io provides PostgreSQL URL
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print(f"✅ Using PostgreSQL database")
    else:
        # Fallback to SQLite for local development
        db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
        print(f"✅ Using SQLite database at {db_path}")
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Initialize database
    db.init_app(app)
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Verify tables exist
            tables = db.engine.table_names()
            print(f"✅ Created tables: {', '.join(tables)}")
            
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")
            sys.exit(1)

if __name__ == '__main__':
    print("🚀 Initializing database for Fly.io deployment...")
    init_database()
    print("✅ Database initialization complete!")
