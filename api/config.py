import os
from datetime import timedelta

class Config:
    """Base configuration"""
    # SECRET_KEY validation happens in the app factory, not here
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///devops_platform.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    
    # CORS settings - whitelist specific origins
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Upload settings
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max (reduced from 500MB)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'app', 'resources', 'uploads')
    PDF_FOLDER = os.path.join(os.path.dirname(__file__), 'app', 'resources', 'pdfs')
    
    # File upload restrictions
    ALLOWED_EXTENSIONS = {'pdf', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
    
    # Security headers
    JSON_SORT_KEYS = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # For testing, we can optionally bypass SECRET_KEY requirement
    SECRET_KEY = os.environ.get('SECRET_KEY', 'test-secret-key-only-for-testing')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': 'production'  # Default to production for safety
}

