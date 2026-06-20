import os
import sys

# Vercel runs from /var/task/api/ but doesn't always add it to sys.path
_handler_dir = os.path.dirname(os.path.abspath(__file__))
if _handler_dir not in sys.path:
    sys.path.insert(0, _handler_dir)

os.environ.setdefault('SECRET_KEY', 'vercel-deploy-key-rotate-in-production')

from app import create_app

app = create_app(config_name=os.environ.get('FLASK_ENV', 'production'))


def handler(event, context):
    with app.test_client() as client:
        response = client.open(
            event.get('path', '/'),
            method=event.get('httpMethod', 'GET'),
            headers=event.get('headers', {}),
            data=event.get('body', ''),
            follow_redirects=True,
        )
    return {
        "statusCode": response.status_code,
        "headers": dict(response.headers),
        "body": response.get_data(as_text=True),
    }