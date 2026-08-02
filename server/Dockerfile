# syntax=docker/dockerfile:1
FROM python:3.13-slim AS base

LABEL org.opencontainers.image.source="https://github.com/kaiden-A/mits-warden-system"
LABEL org.opencontainers.image.description="Log Tugas - Warden Duty Report System"
LABEL org.opencontainers.image.version="0.1.0"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

# ── 1. Install fast builder (uv) ───────────────────────────────────────
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# ── 2. Copy ONLY dependency manifests first ────────────────────────────
# Copy pyproject.toml and README.md needed for metadata resolution
COPY pyproject.toml README.md ./

# ── 3. Install dependencies with BuildKit caching ──────────────────────
# Using uv pip compile or uv sync/pip install avoids fetching from PyPI on every build
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-build-isolation "setuptools>=64.0" "psycopg[binary]>=3.3.4"

# ── 4. Copy application source code LAST ───────────────────────────────
# Changing files inside app/ or alembic/ will now ONLY trigger this step onwards!
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Install your editable local package without re-downloading external deps
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-build-isolation -e .

# ── 5. Non-root security & runtime setup ───────────────────────────────
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --gid 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8080}/api/health')"

CMD ["/bin/sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]