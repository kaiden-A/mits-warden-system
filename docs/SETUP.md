# Setup Guide

## Prerequisites

- Python 3.14+
- Node.js 20+
- PostgreSQL (local or [Neon](https://neon.tech) serverless)

## Server

```bash
cd server

# Create virtual environment
uv sync

# Copy environment file
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: random 256-bit secret
# - MOTIONU_API_KEY: Motion-U email API key
# - FRONTEND_URL: URL of the frontend (for email links)

# Run migrations
alembic upgrade head

# Seed sample data
uv run python scripts/seed.py

# Start dev server
uv run uvicorn app.main:app --reload --port 8000
```

API will be available at `http://localhost:8000/api/health`. Swagger UI at `http://localhost:8000/docs`.

## Client

```bash
cd client

npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token TTL |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS origins (comma-separated) |
| `MOTIONU_API_URL` | No | `https://api.motionukict.com/` | Motion-U API base URL |
| `MOTIONU_API_KEY` | No | `""` | Motion-U API key |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL (used in email links) |

## Seed Data

The seed script creates:
- 1 admin (`admin@mitsklang.edu.my` / `admin123`)
- 6 wardens (3 Putera, 3 Puteri)
- 5 weeks of roster entries
- 18 sample reports with mixed statuses and substitutions

Run anytime to reset data:
```bash
uv run python scripts/seed.py
```
