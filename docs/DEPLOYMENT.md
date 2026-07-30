# Deployment

## Server (FastAPI)

### Build

```bash
cd server
uv sync --no-dev
```

### Environment Variables

Set on the hosting platform (Render / Railway / Fly.io / VPS):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Random 256-bit secret |
| `ALLOWED_ORIGINS` | `https://your-frontend-domain.com` |
| `MOTIONU_API_KEY` | Motion-U API key |
| `FRONTEND_URL` | `https://your-frontend-domain.com` |
| `PYTHONPATH` | `.` (if needed) |

### Run

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or use a `Procfile` for Render:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Migrations

Run on deploy:
```bash
alembic upgrade head
```

## Client (Next.js)

### Build

```bash
cd client
npm ci
npm run build
```

### Environment Variables

Set on the hosting platform (Vercel / Netlify / VPS):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com/api` |

### Start

```bash
npm start
```

## Database (Neon)

- Use [Neon](https://neon.tech) serverless PostgreSQL
- Connection string format: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
- Pool size: 5 (max_overflow: 10)
- Run `alembic upgrade head` on each deploy

## Domain Setup

- API: `api.your-domain.com` → points to server
- App: `your-domain.com` → points to client
- Set `ALLOWED_ORIGINS` to the client domain
- Set `FRONTEND_URL` to the client domain (for email links)

## Health Check

```
GET /api/health
→ { "status": "ok" }
```
