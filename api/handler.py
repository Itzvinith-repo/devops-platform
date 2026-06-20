import os
from app import create_app

# Create the Flask app once (shared across invocations)
# Use production config when FLASK_ENV is explicitly set; default to development
app = create_app(config_name=os.environ.get('FLASK_ENV', 'development'))

def handler(event, context):
    """
    Vercel Python serverless function entry point.

    Parameters
    ----------
    event : dict
        The Vercel event payload containing request data.
    context : dict
        The Vercel context (unused here).

    Returns
    -------
    dict
        A response dictionary with keys: statusCode, headers, body.
    """
    # Extract request information from the Vercel event
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    # Vercel may provide the body as a string; ensure it's bytes for Flask
    body = event.get('body', '')

    # Use Flask's test client to invoke the route internally
    with app.test_client() as client:
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