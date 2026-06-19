from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Resource
from app.utils import validate_required_fields, validate_data_types, sanitize_string, is_allowed_file
from sqlalchemy import or_
import logging

bp = Blueprint('resources', __name__, url_prefix='/resources')
bp.strict_slashes = False

logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_resources():
    """Get all resources"""
    try:
        resource_type = request.args.get('type')
        if resource_type:
            resources = Resource.query.filter_by(resource_type=resource_type).all()
        else:
            resources = Resource.query.all()
        
        return jsonify([{
            'id': r.id,
            'title': r.title,
            'url': r.url,
            'type': r.resource_type,
            'source': r.source
        } for r in resources])
    except Exception as e:
        logger.error(f"Error fetching resources: {str(e)}")
        return jsonify({'error': 'Failed to fetch resources'}), 500

@bp.route('/search', methods=['POST'])
def search_resources():
    """Search saved resources in the database."""
    try:
        data = request.get_json() or {}
        query = data.get('query', '').strip()

        if not query or len(query) < 2:
            return jsonify([])
        
        if len(query) > 100:
            return jsonify({'error': 'Search query too long (max 100 characters)'}), 400

        pattern = f'%{query}%'
        resources = Resource.query.filter(
            or_(
                Resource.title.ilike(pattern),
                Resource.url.ilike(pattern),
                Resource.source.ilike(pattern),
                Resource.resource_type.ilike(pattern),
            )
        ).order_by(Resource.created_at.desc()).all()

        return jsonify([{
            'id': r.id,
            'title': r.title,
            'url': r.url,
            'type': r.resource_type,
            'source': r.source
        } for r in resources])
    except Exception as e:
        logger.error(f"Error searching resources: {str(e)}")
        return jsonify({'error': 'Failed to search resources'}), 500

@bp.route('/', methods=['POST'])
@validate_required_fields(['title', 'url'])
@validate_data_types({'title': str, 'url': str, 'type': (str, type(None)), 'source': (str, type(None))})
def add_resource():
    """Add new resource"""
    try:
        data = request.get_json()
        
        # Validate string lengths
        if len(data.get('title', '')) < 1 or len(data.get('title', '')) > 300:
            return jsonify({'error': 'Title must be between 1 and 300 characters'}), 400
        
        url = data.get('url', '').strip()
        if len(url) < 5 or len(url) > 2000:
            return jsonify({'error': 'URL must be between 5 and 2000 characters'}), 400
        
        # Basic URL validation
        if not url.startswith(('http://', 'https://', 'ftp://')):
            return jsonify({'error': 'URL must start with http://, https://, or ftp://'}), 400
        
        valid_types = ['Article', 'Video', 'Documentation', 'Tutorial', 'Podcast', 'Tool', 'Other']
        resource_type = data.get('type', 'Article')
        if resource_type not in valid_types:
            return jsonify({'error': f'Type must be one of: {", ".join(valid_types)}'}), 400
        
        resource = Resource(
            title=sanitize_string(data.get('title')),
            url=sanitize_string(url),
            resource_type=resource_type,
            source=sanitize_string(data.get('source', 'Manual'), 100)
        )
        db.session.add(resource)
        db.session.commit()
        return jsonify({'id': resource.id, 'message': 'Resource added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding resource: {str(e)}")
        return jsonify({'error': 'Failed to add resource'}), 500

@bp.route('/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    """Delete resource"""
    try:
        resource = Resource.query.get_or_404(resource_id)
        db.session.delete(resource)
        db.session.commit()
        return jsonify({'message': 'Resource deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting resource: {str(e)}")
        return jsonify({'error': 'Failed to delete resource'}), 500

@bp.route('/<int:resource_id>', methods=['PUT'])
@validate_data_types({'title': (str, type(None)), 'url': (str, type(None)), 'type': (str, type(None)), 'source': (str, type(None))})
def update_resource(resource_id):
    """Update resource details"""
    try:
        resource = Resource.query.get_or_404(resource_id)
        data = request.get_json() or {}
        
        if 'title' in data and data['title']:
            if len(data['title']) < 1 or len(data['title']) > 300:
                return jsonify({'error': 'Title must be between 1 and 300 characters'}), 400
            resource.title = sanitize_string(data['title'])
        
        if 'url' in data and data['url']:
            url = data['url'].strip()
            if len(url) < 5 or len(url) > 2000:
                return jsonify({'error': 'URL must be between 5 and 2000 characters'}), 400
            if not url.startswith(('http://', 'https://', 'ftp://')):
                return jsonify({'error': 'URL must start with http://, https://, or ftp://'}), 400
            resource.url = sanitize_string(url)
        
        if 'type' in data and data['type']:
            valid_types = ['Article', 'Video', 'Documentation', 'Tutorial', 'Podcast', 'Tool', 'Other']
            if data['type'] not in valid_types:
                return jsonify({'error': f'Type must be one of: {", ".join(valid_types)}'}), 400
            resource.resource_type = data['type']
        
        if 'source' in data and data['source']:
            resource.source = sanitize_string(data['source'], 100)
        
        db.session.commit()
        return jsonify({'message': 'Resource updated successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating resource: {str(e)}")
        return jsonify({'error': 'Failed to update resource'}), 500


