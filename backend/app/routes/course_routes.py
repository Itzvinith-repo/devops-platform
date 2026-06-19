from flask import Blueprint, request, jsonify
from app import db
from app.models import Course, Module
from app.utils import validate_required_fields, validate_data_types, sanitize_string
import logging

bp = Blueprint('courses', __name__, url_prefix='/courses')
bp.strict_slashes = False

logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_all_courses():
    """Get all courses with modules"""
    try:
        courses = Course.query.order_by(Course.order).all()
        return jsonify([{
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'order': c.order,
            'modules': [{
                'id': m.id,
                'title': m.title,
                'description': m.description,
                'order': m.order
            } for m in sorted(c.modules, key=lambda m: m.order)]
        } for c in courses])
    except Exception as e:
        logger.error(f"Error fetching courses: {str(e)}")
        return jsonify({'error': 'Failed to fetch courses'}), 500

@bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Get single course detail"""
    try:
        course = Course.query.get_or_404(course_id)
        return jsonify({
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'order': course.order,
            'modules': [{
                'id': m.id,
                'title': m.title,
                'description': m.description,
                'order': m.order
            } for m in sorted(course.modules, key=lambda m: m.order)]
        })
    except Exception as e:
        logger.error(f"Error fetching course {course_id}: {str(e)}")
        return jsonify({'error': 'Course not found'}), 404

@bp.route('/<int:course_id>/modules/<int:module_id>', methods=['GET'])
def get_module(course_id, module_id):
    """Get module content"""
    try:
        module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
        return jsonify({
            'id': module.id,
            'title': module.title,
            'description': module.description,
            'content': module.content,
            'order': module.order,
            'labs': [{
                'id': lab.id,
                'title': lab.title,
                'order': lab.order
            } for lab in module.labs]
        })
    except Exception as e:
        logger.error(f"Error fetching module {module_id}: {str(e)}")
        return jsonify({'error': 'Module not found'}), 404

@bp.route('/', methods=['POST'])
@validate_required_fields(['title', 'description'])
@validate_data_types({'title': str, 'description': str, 'order': (int, type(None))})
def create_course():
    """Create new course"""
    try:
        data = request.get_json()
        
        # Validate string lengths
        if len(data.get('title', '')) < 1 or len(data.get('title', '')) > 200:
            return jsonify({'error': 'Title must be between 1 and 200 characters'}), 400
        
        if len(data.get('description', '')) < 1 or len(data.get('description', '')) > 1000:
            return jsonify({'error': 'Description must be between 1 and 1000 characters'}), 400
        
        course = Course(
            title=sanitize_string(data.get('title')),
            description=sanitize_string(data.get('description')),
            order=data.get('order', 0)
        )
        db.session.add(course)
        db.session.commit()
        return jsonify({'id': course.id, 'message': 'Course created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating course: {str(e)}")
        return jsonify({'error': 'Failed to create course'}), 500

@bp.route('/<int:course_id>/modules', methods=['POST'])
@validate_required_fields(['title', 'description'])
@validate_data_types({'title': str, 'description': str, 'content': (str, type(None))})
def create_module(course_id):
    """Create module in course"""
    try:
        course = Course.query.get_or_404(course_id)
        data = request.get_json()
        
        # Validate string lengths
        if len(data.get('title', '')) < 1 or len(data.get('title', '')) > 200:
            return jsonify({'error': 'Module title must be between 1 and 200 characters'}), 400
        
        module = Module(
            course_id=course_id,
            title=sanitize_string(data.get('title')),
            description=sanitize_string(data.get('description')),
            content=sanitize_string(data.get('content', '')),
            order=data.get('order', 0)
        )
        db.session.add(module)
        db.session.commit()
        return jsonify({'id': module.id, 'message': 'Module created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating module: {str(e)}")
        return jsonify({'error': 'Failed to create module'}), 500

@bp.route('/<int:course_id>', methods=['PUT'])
@validate_data_types({'title': (str, type(None)), 'description': (str, type(None)), 'order': (int, type(None))})
def update_course(course_id):
    """Update single course details"""
    try:
        course = Course.query.get_or_404(course_id)
        data = request.get_json() or {}
        
        if 'title' in data and data['title']:
            if len(data['title']) < 1 or len(data['title']) > 200:
                return jsonify({'error': 'Title must be between 1 and 200 characters'}), 400
            course.title = sanitize_string(data['title'])
        
        if 'description' in data and data['description']:
            if len(data['description']) < 1 or len(data['description']) > 1000:
                return jsonify({'error': 'Description must be between 1 and 1000 characters'}), 400
            course.description = sanitize_string(data['description'])
        
        if 'order' in data and data['order'] is not None:
            course.order = data['order']
        
        db.session.commit()
        return jsonify({'message': 'Course updated successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating course: {str(e)}")
        return jsonify({'error': 'Failed to update course'}), 500

@bp.route('/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete course and cascaded modules/labs"""
    try:
        course = Course.query.get_or_404(course_id)
        db.session.delete(course)
        db.session.commit()
        return jsonify({'message': 'Course deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting course: {str(e)}")
        return jsonify({'error': 'Failed to delete course'}), 500

@bp.route('/<int:course_id>/modules/<int:module_id>', methods=['PUT'])
@validate_data_types({'title': (str, type(None)), 'description': (str, type(None)), 'content': (str, type(None)), 'order': (int, type(None))})
def update_module(course_id, module_id):
    """Update module details within a course"""
    try:
        module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
        data = request.get_json() or {}
        
        if 'title' in data and data['title']:
            if len(data['title']) < 1 or len(data['title']) > 200:
                return jsonify({'error': 'Title must be between 1 and 200 characters'}), 400
            module.title = sanitize_string(data['title'])
        
        if 'description' in data and data['description']:
            if len(data['description']) < 1 or len(data['description']) > 1000:
                return jsonify({'error': 'Description must be between 1 and 1000 characters'}), 400
            module.description = sanitize_string(data['description'])
        
        if 'content' in data:
            module.content = sanitize_string(data['content'])
        
        if 'order' in data and data['order'] is not None:
            module.order = data['order']
        
        db.session.commit()
        return jsonify({'message': 'Module updated successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating module: {str(e)}")
        return jsonify({'error': 'Failed to update module'}), 500

@bp.route('/<int:course_id>/modules/<int:module_id>', methods=['DELETE'])
def delete_module(course_id, module_id):
    """Delete module within a course"""
    try:
        module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
        db.session.delete(module)
        db.session.commit()
        return jsonify({'message': 'Module deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting module: {str(e)}")
        return jsonify({'error': 'Failed to delete module'}), 500


