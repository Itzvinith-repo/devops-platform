from flask import Blueprint, request, jsonify
from app import db
from app.models import Lab, Module
from app.utils import validate_required_fields, validate_data_types, sanitize_string
import json
import logging

bp = Blueprint('labs', __name__, url_prefix='/labs')
bp.strict_slashes = False

logger = logging.getLogger(__name__)

@bp.route('/<int:lab_id>', methods=['GET'])
def get_lab(lab_id):
    """Get lab details"""
    try:
        lab = Lab.query.get_or_404(lab_id)
        return jsonify({
            'id': lab.id,
            'title': lab.title,
            'description': lab.description,
            'objective': lab.objective,
            'steps': json.loads(lab.steps) if lab.steps else [],
            'expected_outcome': lab.expected_outcome,
            'difficulty': lab.difficulty
        })
    except Exception as e:
        logger.error(f"Error fetching lab {lab_id}: {str(e)}")
        return jsonify({'error': 'Lab not found'}), 404

@bp.route('/module/<int:module_id>', methods=['GET'])
def get_module_labs(module_id):
    """Get all labs in a module"""
    try:
        module = Module.query.get_or_404(module_id)
        labs = Lab.query.filter_by(module_id=module_id).order_by(Lab.order).all()
        return jsonify([{
            'id': lab.id,
            'title': lab.title,
            'difficulty': lab.difficulty,
            'order': lab.order
        } for lab in labs])
    except Exception as e:
        logger.error(f"Error fetching labs for module {module_id}: {str(e)}")
        return jsonify({'error': 'Module not found'}), 404

@bp.route('/<int:module_id>', methods=['POST'])
@validate_required_fields(['title', 'description', 'objective'])
@validate_data_types({'title': str, 'description': str, 'objective': str, 'difficulty': (str, type(None))})
def create_lab(module_id):
    """Create new lab"""
    try:
        module = Module.query.get_or_404(module_id)
        data = request.get_json()
        
        # Validate string lengths
        if len(data.get('title', '')) < 1 or len(data.get('title', '')) > 200:
            return jsonify({'error': 'Lab title must be between 1 and 200 characters'}), 400
        
        difficulty = data.get('difficulty', 'Intermediate')
        if difficulty not in ['Beginner', 'Intermediate', 'Advanced']:
            return jsonify({'error': 'Difficulty must be Beginner, Intermediate, or Advanced'}), 400
        
        lab = Lab(
            module_id=module_id,
            title=sanitize_string(data.get('title')),
            description=sanitize_string(data.get('description')),
            objective=sanitize_string(data.get('objective')),
            steps=json.dumps(data.get('steps', [])),
            expected_outcome=sanitize_string(data.get('expected_outcome', '')),
            difficulty=difficulty,
            order=data.get('order', 0)
        )
        db.session.add(lab)
        db.session.commit()
        return jsonify({'id': lab.id, 'message': 'Lab created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating lab: {str(e)}")
        return jsonify({'error': 'Failed to create lab'}), 500

@bp.route('/<int:lab_id>', methods=['PUT'])
@validate_data_types({'title': (str, type(None)), 'description': (str, type(None)), 'objective': (str, type(None)), 'difficulty': (str, type(None))})
def update_lab(lab_id):
    """Update lab details"""
    try:
        lab = Lab.query.get_or_404(lab_id)
        data = request.get_json() or {}
        
        if 'title' in data and data['title']:
            if len(data['title']) < 1 or len(data['title']) > 200:
                return jsonify({'error': 'Lab title must be between 1 and 200 characters'}), 400
            lab.title = sanitize_string(data['title'])
        
        if 'description' in data and data['description']:
            lab.description = sanitize_string(data['description'])
        
        if 'objective' in data and data['objective']:
            lab.objective = sanitize_string(data['objective'])
        
        if 'steps' in data and data['steps'] is not None:
            lab.steps = json.dumps(data['steps'])
        
        if 'expected_outcome' in data and data['expected_outcome']:
            lab.expected_outcome = sanitize_string(data['expected_outcome'])
        
        if 'difficulty' in data and data['difficulty']:
            if data['difficulty'] not in ['Beginner', 'Intermediate', 'Advanced']:
                return jsonify({'error': 'Difficulty must be Beginner, Intermediate, or Advanced'}), 400
            lab.difficulty = data['difficulty']
        
        if 'order' in data and data['order'] is not None:
            lab.order = data['order']
        
        db.session.commit()
        return jsonify({'message': 'Lab updated successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating lab: {str(e)}")
        return jsonify({'error': 'Failed to update lab'}), 500

@bp.route('/<int:lab_id>', methods=['DELETE'])
def delete_lab(lab_id):
    """Delete lab"""
    try:
        lab = Lab.query.get_or_404(lab_id)
        db.session.delete(lab)
        db.session.commit()
        return jsonify({'message': 'Lab deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting lab: {str(e)}")
        return jsonify({'error': 'Failed to delete lab'}), 500


