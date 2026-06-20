import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

app = create_app(os.environ.get('FLASK_ENV', 'development'))

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy', 'version': '1.0'}

if __name__ == '__main__':
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Run app
    app.run(debug=True, host='0.0.0.0', port=5000)
