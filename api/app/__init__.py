from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import logging

db = SQLAlchemy()

def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    
    # Disable strict slash redirects so CORS preflight OPTIONS requests
    # are not 308-redirected (which breaks CORS in browsers/Electron)
    app.url_map.strict_slashes = False
    
    # Load config
    from config import config
    app.config.from_object(config[config_name])
    
    # Validate SECRET_KEY for production
    if config_name == 'production' and not app.config.get('SECRET_KEY'):
        raise ValueError(
            "SECRET_KEY environment variable is required and must be set in production. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    
    # Set default SECRET_KEY for development if not provided
    if not app.config.get('SECRET_KEY'):
        app.config['SECRET_KEY'] = 'dev-insecure-key-do-not-use-in-production'
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS with whitelisted origins
    cors_origins = app.config.get('CORS_ORIGINS', [])
    if isinstance(cors_origins, str):
        cors_origins = [o.strip() for o in cors_origins.split(',')]
    
    CORS(app, 
         resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Create upload folders (use /tmp on Vercel — writable)
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['PDF_FOLDER'], exist_ok=True)
    except OSError:
        logging.warning("Could not create upload folders, uploads may not work")
    
    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Global error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'message': str(error)}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        logging.error(f"Internal server error: {str(error)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(error)
        }), 500
    
    # Create tables and seed data
    with app.app_context():
        db.create_all()
        try:
            from app.seed_data import seed_from_md
            seed_from_md(app)
        except Exception as e:
            logging.error(f"Seed failed (non-fatal): {e}")
    
    return app

