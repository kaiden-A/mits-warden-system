# syntax=docker/dockerfile:1
FROM python:3.13-slim

LABEL org.opencontainers.image.source="https://github.com/kaiden-A/mits-warden-system"
LABEL org.opencontainers.image.description="Log Tugas - Warden Duty Report System"
LABEL org.opencontainers.image.version="0.1.0"

# ── Python runtime tuning ──────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

# ── Application source ─────────────────────────────────────────────────
# Must come BEFORE `pip install -e .`:
#   - pyproject.toml declares `readme = "README.md"`, so setuptools needs
#     that file present to build metadata.
#   - [tool.setuptools.packages.find] include = ["app*"] needs the actual
#     `app/` directory on disk to discover the package.
COPY pyproject.toml README.md ./
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# ── Install build dependencies + Python deps ──────────────────────────
RUN pip install --no-cache-dir "setuptools>=64.0" && \
    pip install --no-cache-dir -e . && \
    pip install --no-cache-dir "psycopg[binary]>=3.3.4"

# ── Non‑root user (Cloud Run security best practice) ───────────────────
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --gid 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

# ── Port ───────────────────────────────────────────────────────────────
# Cloud Run injects $PORT; 8080 is the default.
EXPOSE 8080

# ── Health check ───────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8080}/api/health')"

# ── Start server ───────────────────────────────────────────────────────
# --workers 1: Cloud Run handles concurrency at the instance level,
# so a single worker per container avoids unnecessary resource contention.
CMD ["/bin/sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]