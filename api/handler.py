import os
import traceback
import json

# Ensure a SECRET_KEY is always present (override via Vercel env vars for real production use)
os.environ.setdefault('SECRET_KEY', 'vercel-deploy-key-rotate-in-production')

from app import create_app

# Wrap initialization so we can surface errors
_app = None
_init_error = None
try:
    _app = create_app(config_name=os.environ.get('FLASK_ENV', 'production'))
except Exception as e:
    _init_error = traceback.format_exc()


def handler(event, context):
    # If initialization failed, return the error
    if _init_error:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "App initialization failed",
                "detail": _init_error.splitlines()[-5:]  # last 5 lines of traceback
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