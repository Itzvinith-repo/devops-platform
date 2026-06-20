from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__)


@api_bp.route('/ping', methods=['GET'])
def ping():
    """Simple health check that doesn't touch the DB."""
    import sys
    return jsonify({
        'ok': True,
        'python': sys.version,
    })


from app.routes import course_routes, lab_routes, resource_routes, progress_routes

# Register routes
api_bp.register_blueprint(course_routes.bp)
api_bp.register_blueprint(lab_routes.bp)
api_bp.register_blueprint(resource_routes.bp)
api_bp.register_blueprint(progress_routes.bp)
