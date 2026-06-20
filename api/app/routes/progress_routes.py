from datetime import datetime
from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Course, Module, Lab, Progress
import logging

bp = Blueprint('progress', __name__, url_prefix='/progress')
bp.strict_slashes = False

logger = logging.getLogger(__name__)

DEFAULT_USERNAME = 'local'


def get_default_user():
    """Get or create default user for local progress tracking"""
    try:
        user = User.query.filter_by(username=DEFAULT_USERNAME).first()
        if not user:
            user = User(username=DEFAULT_USERNAME, email='local@devops-platform.local')
            db.session.add(user)
            db.session.commit()
        return user
    except Exception as e:
        logger.error(f"Error getting default user: {str(e)}")
        raise


def lab_progress_map(user_id):
    """Map completed labs for a user"""
    rows = Progress.query.filter_by(user_id=user_id, completed=True).filter(
        Progress.lab_id.isnot(None)
    ).all()
    return {row.lab_id: row for row in rows}


@bp.route('/stats', methods=['GET'])
def get_stats():
    """Aggregate study progress for analytics dashboard."""
    try:
        user = get_default_user()
        completed_rows = Progress.query.filter_by(user_id=user.id, completed=True).filter(
            Progress.lab_id.isnot(None)
        ).all()
        completed_lab_ids = {row.lab_id for row in completed_rows}

        courses = Course.query.order_by(Course.order).all()
        total_modules = Module.query.count()
        total_labs = Lab.query.count()
        completed_labs = len(completed_lab_ids)

        course_breakdown = []
        for course in courses:
            course_modules = Module.query.filter_by(course_id=course.id).order_by(Module.order).all()
            course_lab_ids = []
            for mod in course_modules:
                course_lab_ids.extend([lab.id for lab in Lab.query.filter_by(module_id=mod.id).all()])

            course_completed = sum(1 for lid in course_lab_ids if lid in completed_lab_ids)
            course_total_labs = len(course_lab_ids)

            course_breakdown.append({
                'id': course.id,
                'title': course.title,
                'order': course.order,
                'modules': len(course_modules),
                'total_labs': course_total_labs,
                'completed_labs': course_completed,
                'progress_percent': round((course_completed / course_total_labs * 100) if course_total_labs else 0, 1),
            })

        recent = sorted(completed_rows, key=lambda r: r.completion_date or r.updated_at, reverse=True)[:8]
        recent_activity = []
        for row in recent:
            lab = Lab.query.get(row.lab_id)
            if not lab:
                continue
            module = Module.query.get(lab.module_id)
            course = Course.query.get(module.course_id) if module else None
            recent_activity.append({
                'lab_id': lab.id,
                'lab_title': lab.title,
                'module_title': module.title if module else '',
                'course_title': course.title if course else '',
                'completed_at': (row.completion_date or row.updated_at).isoformat() if (row.completion_date or row.updated_at) else None,
            })

        overall_percent = round((completed_labs / total_labs * 100) if total_labs else 0, 1)

        return jsonify({
            'courses': len(courses),
            'modules': total_modules,
            'labs': total_labs,
            'completed_labs': completed_labs,
            'overall_percent': overall_percent,
            'course_breakdown': course_breakdown,
            'recent_activity': recent_activity,
        })
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch stats'}), 500


@bp.route('/labs', methods=['GET'])
def get_all_lab_progress():
    """Return completion status for all labs."""
    try:
        user = get_default_user()
        progress = lab_progress_map(user.id)
        labs = Lab.query.all()
        return jsonify([{
            'lab_id': lab.id,
            'module_id': lab.module_id,
            'completed': lab.id in progress,
            'completed_at': progress[lab.id].completion_date.isoformat() if lab.id in progress and progress[lab.id].completion_date else None,
        } for lab in labs])
    except Exception as e:
        logger.error(f"Error fetching lab progress: {str(e)}")
        return jsonify({'error': 'Failed to fetch lab progress'}), 500


@bp.route('/module/<int:module_id>', methods=['GET'])
def get_module_progress(module_id):
    """Return completion status for labs in a module."""
    try:
        Module.query.get_or_404(module_id)
        user = get_default_user()
        progress = lab_progress_map(user.id)
        labs = Lab.query.filter_by(module_id=module_id).order_by(Lab.order).all()
        return jsonify([{
            'lab_id': lab.id,
            'completed': lab.id in progress,
        } for lab in labs])
    except Exception as e:
        logger.error(f"Error fetching module progress: {str(e)}")
        return jsonify({'error': 'Module not found or error fetching progress'}), 404


@bp.route('/lab/<int:lab_id>', methods=['GET'])
def get_lab_progress(lab_id):
    """Return completion status for a single lab."""
    try:
        Lab.query.get_or_404(lab_id)
        user = get_default_user()
        row = Progress.query.filter_by(user_id=user.id, lab_id=lab_id).first()
        return jsonify({
            'lab_id': lab_id,
            'completed': bool(row and row.completed),
            'completed_at': row.completion_date.isoformat() if row and row.completion_date else None,
        })
    except Exception as e:
        logger.error(f"Error fetching lab progress for lab {lab_id}: {str(e)}")
        return jsonify({'error': 'Lab not found'}), 404


@bp.route('/lab/<int:lab_id>', methods=['POST'])
def toggle_lab_progress(lab_id):
    """Mark lab complete or incomplete."""
    try:
        lab = Lab.query.get_or_404(lab_id)
        user = get_default_user()
        data = request.get_json() or {}
        target_completed = data.get('completed')

        # Validate target_completed is boolean if provided
        if target_completed is not None and not isinstance(target_completed, bool):
            return jsonify({'error': 'completed field must be boolean'}), 400

        row = Progress.query.filter_by(user_id=user.id, lab_id=lab_id).first()
        if row is None:
            row = Progress(user_id=user.id, lab_id=lab_id, module_id=lab.module_id)
            db.session.add(row)

        if target_completed is None:
            row.completed = not row.completed
        else:
            row.completed = bool(target_completed)

        row.completion_date = datetime.utcnow() if row.completed else None
        row.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'lab_id': lab_id,
            'completed': row.completed,
            'completed_at': row.completion_date.isoformat() if row.completion_date else None,
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating lab progress: {str(e)}")
        return jsonify({'error': 'Failed to update lab progress'}), 500

