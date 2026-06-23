#!/bin/sh
set -e

echo "Running migrations..."
alembic -c /app/fastapi_application/alembic.ini upgrade head

echo "Starting server..."
exec uvicorn fastapi_application.main:main_app --host 0.0.0.0 --port 8000
