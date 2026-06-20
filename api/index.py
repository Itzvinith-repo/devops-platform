from app import create_app
from vercel_wsgi import to_wsgi

app = create_app()

def handler(event, context):
    # Convert Vercel event to a WSGI environ
    environ = to_wsgi(event, context)
    # Let Flask handle the request
    return app.wsgi_app(environ, start_response=lambda s, h: None)
