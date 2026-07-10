# Stage 1: Build stage
FROM python:3.13-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Final production image
FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.13 /usr/local/lib/python3.13
COPY --from=builder /usr/local/bin /usr/local/bin

COPY --chown=appuser:appuser . .

RUN mkdir -p uploads/posters uploads/profiles uploads/certificates uploads/qrcodes && \
    chown -R appuser:appuser uploads/

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["sh", "-c", "alembic upgrade head && gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --access-logfile - --error-logfile -"]
