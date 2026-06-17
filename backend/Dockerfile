# Используем более легкий образ
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN apt-get update && apt-get install -y --no-install-recommends libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir poetry==1.8.0
RUN poetry config virtualenvs.create false
# Update lock file if needed and install dependencies
RUN poetry lock --no-update || true
RUN poetry install --no-interaction --no-root --only main

COPY fastapi_application ./fastapi_application
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PYTHONPATH=/app/fastapi_application

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
