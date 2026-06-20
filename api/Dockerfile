FROM python:3.10

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

# Default to development mode so SECRET_KEY isn't required at build time
# Override via -e FLASK_ENV=production -e SECRET_KEY=<key> for production
ENV FLASK_ENV=development

CMD ["python", "run.py"]