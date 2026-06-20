"""Utility functions for validation and error handling"""
from functools import wraps
from flask import request, jsonify, current_app
import os


def validate_required_fields(required_fields):
    """Decorator to validate required JSON fields in request"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json() or {}
            missing = [field for field in required_fields if not data.get(field)]
            
            if missing:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_data_types(type_spec):
    """
    Decorator to validate data types.
    type_spec: dict mapping field names to expected types
    Example: {'title': str, 'order': int}
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json() or {}
            
            for field, expected_type in type_spec.items():
                if field in data and data[field] is not None:
                    if not isinstance(data[field], expected_type):
                        return jsonify({
                            'error': 'Invalid data type',
                            'field': field,
                            'expected': expected_type.__name__,
                            'received': type(data[field]).__name__
                        }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def is_allowed_file(filename):
    """Check if file extension is allowed"""
    allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', set())
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def validate_string_length(field_name, min_length=1, max_length=1000):
    """Validate string field length"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json() or {}
            
            if field_name in data and data[field_name] is not None:
                value = data[field_name]
                if isinstance(value, str):
                    if len(value) < min_length or len(value) > max_length:
                        return jsonify({
                            'error': f'Field {field_name} length must be between {min_length} and {max_length}',
                            'field': field_name
                        }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def sanitize_string(value, max_length=1000):
    """Sanitize string input"""
    if not isinstance(value, str):
        return value
    return value.strip()[:max_length]
