import os
import sys
import traceback
import json

# Vercel runs from /var/task/api/ but doesn't always add it to sys.path
_handler_dir = os.path.dirname(os.path.abspath(__file__))
if _handler_dir not in sys.path:
    sys.path.insert(0, _handler_dir)

# Ensure a SECRET_KEY is always present
os.environ.setdefault('SECRET_KEY', 'vercel-deploy-key-rotate-in-production')

_app = None
_init_error = None

def _init_app():
    global _app, _init_error
    try:
        from app import create_app
        _app = create_app(config_name=os.environ.get('FLASK_ENV', 'production'))
    except Exception as e:
        _init_error = traceback.format_exc()


def handler(event, context):
    # Lazily initialize on first call (catches import errors gracefully)
    if _app is None and _init_error is None:
        _init_app()

    if _init_error:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "App initialization failed",
                "detail": _init_error.splitlines()[-8:]
            }),
        }

    # Extract request information from the Vercel event
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    body = event.get('body', '')

    # Use Flask's test client to invoke the route internally
    with _app.test_client() as client:
        response = client.open(
            path,
            method=method,
            headers=headers,
            data=body,
            follow_redirects=True
        )

    # Build the Vercel-compatible response
    return {
        "statusCode": response.status_code,
        "headers": dict(response.headers),
        "body": response.get_data(as_text=True)
    }