# Architecture

## System Overview

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│  Next.js    │ ──────> │  FastAPI     │ ──────> │ PostgreSQL │
│  Frontend   │ <────── │  Backend     │ <────── │  (Neon)    │
│  :3000      │   HTTP  │  :8000       │   SQL   │            │
└─────────────┘         └──────┬───────┘         └────────────┘
                               │
                               │ Motion-U API
                               ├────────────────> Email Service
```

## Project Structure

```
├── server/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry, CORS, lifespan
│   │   ├── config.py               # Pydantic Settings (.env)
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   ├── dependencies.py         # Auth deps (get_current_user, require_admin)
│   │   │
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py             # User (admin/warden)
│   │   │   ├── report.py           # Report, ReportRating, ApprovalLog
│   │   │   ├── roster.py           # Daily roster
│   │   │   └── token.py            # Refresh tokens
│   │   │
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── report.py
│   │   │   ├── roster.py
│   │   │   └── dashboard.py
│   │   │
│   │   ├── routers/                # API route handlers
│   │   │   ├── auth.py             # /api/auth/*
│   │   │   ├── wardens.py          # /api/wardens/*
│   │   │   ├── roster.py           # /api/roster/*
│   │   │   ├── reports.py          # /api/reports/*
│   │   │   └── dashboard.py        # /api/dashboard/*
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── report_service.py
│   │   │   ├── roster_service.py
│   │   │   ├── dashboard_service.py
│   │   │   └── email_service.py
│   │   │
│   │   ├── email_templates/        # HTML email templates
│   │   │   ├── warden_welcome.html
│   │   │   └── substitution_notice.html
│   │   │
│   │   └── utils/
│   │       ├── security.py         # JWT encode/decode, bcrypt
│   │       └── timezone.py         # Malaysia time helpers
│   │
│   ├── alembic/                    # Database migrations
│   ├── scripts/
│   │   └── seed.py                 # Seed data script
│   ├── pyproject.toml
│   └── .env.example
│
├── client/                         # Next.js frontend
│   ├── app/
│   │   ├── (admin)/                # Admin routes
│   │   ├── (auth)/                 # Auth routes
│   │   ├── (warden)/               # Warden routes
│   │   ├── components/             # Shared UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   └── lib/                    # Utilities
│   ├── next.config.ts
│   └── package.json
│
├── docs/
└── README.md
```

## Data Flow

### Report Submission (Substitution)
```
Warden B logs in
  → GET /roster/today → sees Warden A is duty warden
  → Creates report with is_substitution=true
  → POST /reports → Backend links duty_warden_id=Warden A
  → Email sent to Warden A: "Warden B submitted report on your behalf"
```

### Auth Flow
```
Client                          Server
  │                                │
  │  POST /api/auth/login          │
  │  <── access_token (15m) + refresh_token (7d)
  │                                │
  │  GET /api/reports              │
  │  Authorization: Bearer <jwt>   │
  │  <── 200 OK                    │
  │                                │
  │  POST /api/auth/refresh        │
  │  <── new access_token + new refresh_token (rotation)
```

## Route -> Service -> Model Mapping

| Router | Service | Model |
|--------|---------|-------|
| `auth.py` | `auth_service.py` | `User`, `RefreshToken` |
| `wardens.py` | (inline) | `User` |
| `roster.py` | `roster_service.py` | `Roster` |
| `reports.py` | `report_service.py` | `Report`, `ReportRating`, `ApprovalLog` |
| `dashboard.py` | `dashboard_service.py` | `User`, `Report`, `Roster` |
