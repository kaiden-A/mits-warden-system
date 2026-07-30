# Log Tugas — Warden Duty Report Management System

Sistem pengurusan laporan tugasan warden untuk MITS Klang. Backend FastAPI + frontend Next.js.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.14+, FastAPI, SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (Neon serverless) |
| Migrations | Alembic |
| Auth | JWT (access + refresh token rotation) |
| Email | Motion-U API |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |

## Quick Start

```bash
# Server
cd server
uv sync
cp .env.example .env   # fill in secrets
alembic upgrade head
uv run uvicorn app.main:app --reload

# Client (separate terminal)
cd client
npm install
npm run dev
```

## Documentation

All documentation is in [docs/](./docs/):

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture & data flow |
| [SETUP.md](./docs/SETUP.md) | Local development setup |
| [API.md](./docs/API.md) | Full API reference |
| [DATABASE.md](./docs/DATABASE.md) | Schema, tables, migrations |
| [AUTH.md](./docs/AUTH.md) | Login, JWT, token rotation, RBAC |
| [EMAIL.md](./docs/EMAIL.md) | Email service (Motion-U integration) |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment |

## Environment Variables

See `.env.example` for all required variables.
