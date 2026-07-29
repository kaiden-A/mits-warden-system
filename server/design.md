# Log Tugas — Backend Design

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (Python 3.11+) |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| Auth | Google OAuth 2.0 + JWT (access + refresh) |
| ORM | SQLAlchemy 2.0 (async) + Alembic migrations |
| Validation | Pydantic v2 |
| Deployment | Render / Railway / Fly.io |

---

## 1. Database Schema

### 1.1 `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id       VARCHAR(255) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'warden')),
    hostel          VARCHAR(20) CHECK (hostel IN ('Asrama Putera', 'Asrama Puteri')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);
```

| Column | Notes |
|--------|-------|
| `role` | `admin` has full access; `warden` is scoped to their hostel |
| `hostel` | `NULL` for admins; `'Asrama Putera'` or `'Asrama Puteri'` for wardens |
| `status` | `active` = can login; `revoked` = blocked |

### 1.2 `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_hash ON refresh_tokens(token_hash);
```

### 1.3 `roster`

```sql
CREATE TABLE roster (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date              DATE NOT NULL UNIQUE,
    putera_warden_id  UUID NOT NULL REFERENCES users(id),
    puteri_warden_id  UUID NOT NULL REFERENCES users(id),
    updated_by        UUID REFERENCES users(id),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roster_date ON roster(date);
```

Each row maps one calendar date to the two wardens on duty.

### 1.4 `reports`

```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE NOT NULL,
    hostel          VARCHAR(20) NOT NULL CHECK (hostel IN ('Asrama Putera', 'Asrama Puteri')),

    -- Submission tracking
    submitted_by    UUID NOT NULL REFERENCES users(id),
    duty_warden_id  UUID NOT NULL REFERENCES users(id),
    is_substitution BOOLEAN NOT NULL DEFAULT FALSE,
    inspection_time TIME,

    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'submitted', 'reviewed', 'flagged')),
    submitted_at    TIMESTAMPTZ,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    flagged_by      UUID REFERENCES users(id),
    flagged_at      TIMESTAMPTZ,
    admin_note      TEXT DEFAULT '',

    -- Sections 8–11 (text / security)
    aduan_kerosakan     TEXT    DEFAULT 'TKD',
    murid_sakit         TEXT    DEFAULT 'TLB',
    kawalan_keselamatan SMALLINT CHECK (kawalan_keselamatan BETWEEN 1 AND 5),
    catatan_tambahan    TEXT    DEFAULT '',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(date, hostel)
);

CREATE INDEX idx_reports_date    ON reports(date);
CREATE INDEX idx_reports_hostel  ON reports(hostel);
CREATE INDEX idx_reports_status  ON reports(status);
CREATE INDEX idx_reports_submitted_by ON reports(submitted_by);
CREATE INDEX idx_reports_duty_warden  ON reports(duty_warden_id);
```

**Constraint**: one report per date per hostel (enforced by `UNIQUE(date, hostel)`). If a warden submits a report for a date+hostel that already exists, it must be a `PATCH` of the existing draft or rejected.

### 1.5 `report_ratings`

Sections 1–7 each contain multiple rating items (52 total across all sections).

```sql
CREATE TABLE report_ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    section_id  VARCHAR(50) NOT NULL,   -- e.g. 'rutinAktivitiMurid'
    item_key    VARCHAR(50) NOT NULL,   -- e.g. 'halaqahQuran'
    rating      VARCHAR(2) CHECK (rating IN ('1','2','3','4','NA','')),

    UNIQUE(report_id, section_id, item_key)
);

CREATE INDEX idx_ratings_report  ON report_ratings(report_id);
CREATE INDEX idx_ratings_section ON report_ratings(report_id, section_id);
```

### 1.6 `approval_log`

Immutable audit trail.

```sql
CREATE TABLE approval_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(20) NOT NULL
                    CHECK (action IN ('created', 'submitted', 'reviewed', 'flagged')),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_report ON approval_log(report_id);
```

---

## 2. Authentication & Security

### 2.1 Google OAuth Flow

```
Client                            Server                      Google
  │                                 │                           │
  │  1. GET /api/auth/google/login  │                           │
  │  <── redirect to Google ──────> │                           │
  │                                 │                           │
  │  2. User consents, Google redirects to /api/auth/google/callback?code=XYZ
  │                                 │                           │
  │  3. Server exchanges code for tokens                         │
  │     POST https://oauth2.googleapis.com/token                 │
  │     <── id_token + access_token ──                           │
  │                                 │                           │
  │  4. Server verifies id_token, extracts email/sub/name        │
  │  5. Server upserts user in `users` table                     │
  │  6. Server checks user.status == 'active'                    │
  │  7. Server issues JWT access_token (15 min)                  │
  │           + opaque refresh_token (7 days)                    │
  │                                 │                           │
  │  8. Client stores tokens, uses access_token for API calls    │
```

**Google OAuth Config (Google Cloud Console)**:
- Authorized redirect URI: `https://api.example.com/api/auth/google/callback`
- Scopes requested: `openid email profile`
- Allowed domains: restricted to the school's Google Workspace domain

### 2.2 JWT Payload

```json
{
  "sub":   "550e8400-e29b-41d4-a716-446655440000",
  "email": "faiz.ahmad@sekolah.edu.my",
  "name":  "Muhammad Faiz Bin Ahmad",
  "role":  "warden",
  "hostel":"Asrama Putera",
  "exp":   1720000000,
  "iat":   1719999100,
  "jti":   "unique-token-id"
}
```

### 2.3 Token Lifecycle

| Token | Duration | Storage | Purpose |
|-------|----------|---------|---------|
| Access token (JWT) | 15 minutes | Client memory | API authorization header |
| Refresh token (opaque) | 7 days | HTTP-only cookie | Issue new access tokens |
| Google `id_token` | 1 hour | Not stored | One-time verification |

Refresh token is hashed (SHA-256) before storage in `refresh_tokens.token_hash`. The plain token is sent to the client once and never stored on the server.

### 2.4 RBAC Middleware

```python
# FastAPI dependency
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = verify_jwt(token)
    user = await db.get(User, payload["sub"])
    if not user or user.status != "active":
        raise HTTPException(403, "Account revoked or not found")
    return user

# Admin-only
def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user

# Warden (hostel-scoped)
def require_warden(user: User = Depends(get_current_user)) -> User:
    if user.role != "warden":
        raise HTTPException(403, "Warden access required")
    return user
```

**Authorization matrix**:

| Resource | Admin | Warden |
|----------|-------|--------|
| `GET /wardens` | All wardens | Forbidden |
| `POST /wardens` | Yes | Forbidden |
| `GET /roster` | Any week | Current week only |
| `PUT /roster` | Yes | Forbidden |
| `GET /reports` | All reports | Own hostel + own submissions |
| `POST /reports` | Forbidden | Only for own hostel's date |
| `PATCH /reports/{id}` | Admin note only | Only own drafts |
| `POST /reports/{id}/submit` | Forbidden | Yes (own reports) |
| `POST /reports/{id}/review` | Yes | Forbidden |
| `GET /dashboard` | Admin dashboard | Warden dashboard |

---

## 3. API Design

Base URL: `https://api.example.com/api`

### 3.1 Auth

| Method | Path | Auth | Body / Notes |
|--------|------|------|-------------|
| `GET` | `/auth/google/login` | None | Redirects to Google |
| `GET` | `/auth/google/callback` | None | Query: `?code=` |
| `POST` | `/auth/refresh` | None | `{ refresh_token }` → `{ access_token, refresh_token }` |
| `POST` | `/auth/logout` | JWT | Revokes current refresh token |
| `GET` | `/auth/me` | JWT | Returns current user profile |

**`POST /auth/refresh` response**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123def456...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**`GET /auth/me` response**:
```json
{
  "id": "550e8400-...",
  "email": "faiz.ahmad@sekolah.edu.my",
  "name": "Muhammad Faiz Bin Ahmad",
  "role": "warden",
  "hostel": "Asrama Putera",
  "status": "active"
}
```

### 3.2 Wardens (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/wardens` | Admin | List all wardens |
| `POST` | `/wardens` | Admin | Add new warden |
| `PATCH` | `/wardens/{id}/status` | Admin | `{ status: "active" | "revoked" }` |

**`POST /wardens` request**:
```json
{
  "email": "faiz.ahmad@sekolah.edu.my",
  "name":  "Muhammad Faiz Bin Ahmad",
  "hostel": "Asrama Putera"
}
```

The `google_id` is populated on the user's first OAuth login. Until then it's `NULL`, and the warden cannot log in until they complete Google OAuth.

**`GET /wardens` response**:
```json
{
  "wardens": [
    {
      "id": "...", "email": "...", "name": "...",
      "hostel": "Asrama Putera", "status": "active",
      "report_count": 12, "last_submission": "2026-07-28"
    }
  ]
}
```

### 3.3 Roster

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/roster?week_start=2026-07-27` | Admin/Warden | Get roster for a week |
| `GET` | `/roster/today` | Admin/Warden | Get today's duty wardens |
| `PUT` | `/roster` | Admin | Update one week's roster |

**`GET /roster/today` response**:
```json
{
  "date": "2026-07-29",
  "day": "Rabu",
  "putera": { "id": "...", "name": "Khairul Azman Bin Razak" },
  "puteri": { "id": "...", "name": "Aina Maisarah Binti Mohd" }
}
```

**`PUT /roster` request**:
```json
{
  "week_start": "2026-07-27",
  "assignments": [
    { "date": "2026-07-27", "putera_warden_id": "...", "puteri_warden_id": "..." },
    { "date": "2026-07-28", "putera_warden_id": "...", "puteri_warden_id": "..." }
    // ... 5 more
  ]
}
```

A 7-element array is expected. Missing dates are inserted; existing dates are upserted.

### 3.4 Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/reports` | Admin/Warden | List reports (query filters) |
| `GET` | `/reports/{id}` | Admin/Warden | Full report detail + ratings |
| `POST` | `/reports` | Warden | Create new report (draft or submitted) |
| `PATCH` | `/reports/{id}` | Warden | Update draft report |
| `POST` | `/reports/{id}/submit` | Warden | Finalise draft → submitted |
| `POST` | `/reports/{id}/review` | Admin | Mark as reviewed |
| `POST` | `/reports/{id}/flag` | Admin | Flag for follow-up |

**`GET /reports` query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `week_start` | date | current Monday | ISO date |
| `warden_id` | UUID | none | Filter by warden (admin only) |
| `hostel` | string | user's hostel | `Asrama Putera` or `Asrama Puteri` |
| `status` | string | none | `draft`, `submitted`, `reviewed`, `flagged` |
| `page` | int | 1 | Pagination |
| `per_page` | int | 20 | Max 50 |

**`GET /reports/{id}` response**:
```json
{
  "id": "...",
  "date": "2026-07-28",
  "hostel": "Asrama Putera",
  "status": "submitted",

  "submitted_by": { "id": "...", "name": "Ahmad Syafiq Bin Ismail" },
  "duty_warden":   { "id": "...", "name": "Ahmad Syafiq Bin Ismail" },
  "is_substitution": false,
  "inspection_time": "07:30",
  "submitted_at": "2026-07-28T07:45:00+08:00",

  "reviewed_by": { "id": "...", "name": "C. Whitfield" },
  "reviewed_at": "2026-07-28T10:30:00+08:00",
  "admin_note": "Clean report. No follow-up needed.",

  "ratings": {
    "rutinAktivitiMurid": {
      "halaqahQuran": "3", "rollCall": "4", "riadhah": "2",
      "muraqabah": "3", "prep": "3", "tabassam": "NA",
      "melawat": "NA", "gotongRoyong": "4", "tidur": "3"
    },
    "tarbiyyahRohaniyyah": { "...": "..." },
    "kebersihanArasBawah": { "...": "..." },
    "kebersihanAras1":     { "...": "..." },
    "kebersihanAras2":     { "...": "..." },
    "kebersihanAras3":     { "...": "..." },
    "dewanMakan":          { "...": "..." }
  },

  "aduan_kerosakan": "TKD",
  "murid_sakit": "TLB",
  "kawalan_keselamatan": 4,
  "catatan_tambahan": "Laporan rutin harian.",

  "approval_trail": [
    { "action": "created",    "user": "...", "at": "2026-07-28T07:30:00" },
    { "action": "submitted",  "user": "...", "at": "2026-07-28T07:45:00" },
    { "action": "reviewed",   "user": "...", "at": "2026-07-28T10:30:00" }
  ]
}
```

**`POST /reports` request**:
```json
{
  "date": "2026-07-29",
  "inspection_time": "07:30",
  "status": "draft",

  "ratings": {
    "rutinAktivitiMurid": {
      "halaqahQuran": "3", "rollCall": "4"
    }
  },

  "aduan_kerosakan": "TKD",
  "murid_sakit": "TLB",
  "kawalan_keselamatan": 4,
  "catatan_tambahan": ""
}
```

**Server-side on `POST /reports`**:
1. Validate `date` — must be ≤ today, no duplicate report for same `date+hostel`
2. Look up `roster[date]` to determine `duty_warden_id`
3. Set `submitted_by = current_user.id`
4. Set `is_substitution = submitted_by != duty_warden_id`
5. If `status == "submitted"`, set `submitted_at = now()` and write approval_log
6. Upsert `report_ratings` rows

**`POST /reports/{id}/review` request**:
```json
{
  "admin_note": "Clean report. No follow-up needed."
}
```

Sets `status = 'reviewed'`, `reviewed_by = current_user.id`, `reviewed_at = now()`, writes approval_log.

**`POST /reports/{id}/flag` request**:
```json
{
  "admin_note": "Sila semak laporan ini."
}
```

Sets `status = 'flagged'`, `flagged_by = current_user.id`, `flagged_at = now()`, writes approval_log.

### 3.5 Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/dashboard` | Warden | Warden dashboard summary |
| `GET` | `/dashboard/admin` | Admin | Admin dashboard summary |

**`GET /dashboard` response** (warden):
```json
{
  "user": { "id": "...", "name": "...", "hostel": "Asrama Putera" },

  "stats": {
    "total_reports": 12,
    "submitted_this_week": 3,
    "reviewed_total": 8
  },

  "today": {
    "date": "2026-07-29",
    "day": "Rabu",
    "duty_warden": { "id": "...", "name": "Khairul Azman Bin Razak" },
    "is_user_on_duty": false,
    "report": null
  },

  "week_recap": [
    {
      "date": "2026-07-27",
      "day": "Isnin",
      "putera": {
        "duty_warden": { "id": "...", "name": "Muhammad Faiz Bin Ahmad" },
        "report": {
          "status": "submitted",
          "submitted_by_name": "Muhammad Faiz Bin Ahmad",
          "is_substitution": false
        }
      },
      "puteri": {
        "duty_warden": { "id": "...", "name": "Nurul Aisyah Binti Hassan" },
        "report": {
          "status": "submitted",
          "submitted_by_name": "Nurul Aisyah Binti Hassan",
          "is_substitution": false
        }
      }
    },
    { "date": "2026-07-28", "day": "Selasa", "...": "..." }
  ],

  "week_progress": [
    { "date": "2026-07-27", "status": "submitted" },
    { "date": "2026-07-28", "status": "draft" },
    { "date": "2026-07-29", "status": "none" }
  ]
}
```

**`GET /dashboard/admin` response** (admin):
```json
{
  "stats": {
    "active_wardens": 6,
    "pending_review_this_week": 2,
    "reviewed_this_week": 5,
    "flagged_total": 1
  },
  "recent_entries": [
    {
      "id": "...", "date": "2026-07-28",
      "hostel": "Asrama Putera",
      "warden_name": "Ahmad Syafiq Bin Ismail",
      "status": "submitted",
      "inspection_time": "07:30"
    }
  ]
}
```

---

## 4. Data Flow — Substitution

When Warden A submits a report but Warden B is rostered:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Warden-A (Faiz) logs in on Wednesday                    │
│     Today's roster[2026-07-29].putera = w3 (Khairul)       │
│                                                             │
│  2. Warden-A clicks "Buat Laporan Baru"                     │
│     Frontend calls GET /roster/today                        │
│     → duty_warden = Khairul (not Faiz)                     │
│     Frontend shows: "Anda melaporkan bagi pihak Khairul"    │
│                                                             │
│  3. Warden-A fills in the form and clicks "Hantar Laporan"  │
│     POST /reports { date, ratings, ..., status:"submitted" }│
│                                                             │
│  4. Backend processes:                                      │
│     a. Lookup roster → duty_warden_id = w3 (Khairul)       │
│     b. submitted_by = current_user.id = w1 (Faiz)           │
│     c. is_substitution = true (w1 != w3)                    │
│     d. INSERT report with duty_warden_id=w3, submitted_by=w1│
│     e. INSERT approval_log: action="submitted"              │
│                                                             │
│  5. Khairul's dashboard now shows:                          │
│     GET /dashboard → today.report.status = "submitted"      │
│     today.report.submitted_by_name = "M Faiz"               │
│     With "bagi pihak" tag in UI                             │
└─────────────────────────────────────────────────────────────┘
```

Wardens see **all reports for their hostel** in the dashboard recap — the `GET /dashboard` endpoint joins `reports` by `hostel` for the past days of the current week.

---

## 5. Project Structure

```
backend/
├── alembic/
│   └── versions/                    # migrations
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app, CORS, lifespan
│   ├── config.py                    # Settings (env vars)
│   ├── database.py                  # Engine, async session, Base
│   ├── dependencies.py              # get_db, get_current_user, role guards
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                  # User ORM
│   │   ├── report.py                # Report + ReportRating ORM
│   │   ├── roster.py                # Roster ORM
│   │   └── token.py                 # RefreshToken ORM
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py                  # TokenResponse, LoginRequest
│   │   ├── user.py                  # UserRead, UserCreate
│   │   ├── report.py                # ReportCreate, ReportRead, ReportUpdate
│   │   ├── roster.py                # RosterRead, RosterUpdate
│   │   └── dashboard.py             # DashboardRead
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                  # /api/auth/*
│   │   ├── wardens.py               # /api/wardens/*
│   │   ├── roster.py                # /api/roster/*
│   │   ├── reports.py               # /api/reports/*
│   │   └── dashboard.py             # /api/dashboard/*
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py          # Google OAuth, JWT
│   │   ├── report_service.py        # Report CRUD + validation
│   │   ├── roster_service.py        # Roster logic
│   │   └── dashboard_service.py     # Aggregation queries
│   │
│   └── utils/
│       ├── __init__.py
│       └── security.py              # JWT encode/decode, password hashing
│
├── tests/
├── alembic.ini
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

## 6. Key Implementation Notes

### 6.1 Neon DB Connection

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,       # postgresql+asyncpg://user:pass@ep-xxx.neon.tech/db?sslmode=require
    pool_size=5,
    max_overflow=10,
    echo=False,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

Neon provides a connection string; add `sslmode=require`.

### 6.2 Google OAuth (authlib)

```python
# app/services/auth_service.py
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

async def google_callback(code: str, db: AsyncSession):
    token = await oauth.google.authorize_access_token(code)
    user_info = await oauth.google.parse_id_token(token)
    # Upsert user, issue JWT
    ...
```

### 6.3 JWT

```python
# app/utils/security.py
import jwt  # PyJWT
from datetime import datetime, timedelta, timezone

def create_access_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "hostel": user.hostel,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def verify_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
```

### 6.4 Refresh Token Rotation

Every time a refresh token is used, it is revoked and a new one is issued. This limits the window for token theft.

```python
async def rotate_refresh_token(user_id: UUID, old_token_hash: str, db: AsyncSession):
    # Revoke old
    stmt = update(RefreshToken).where(
        RefreshToken.token_hash == old_token_hash
    ).values(revoked=True)
    await db.execute(stmt)

    # Issue new
    new_token = secrets.token_urlsafe(64)
    new_hash = hashlib.sha256(new_token.encode()).hexdigest()
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=new_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    ))
    await db.commit()
    return new_token
```

### 6.5 Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/logtugas?sslmode=require
JWT_SECRET=your-256-bit-secret
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
ALLOWED_DOMAIN=sekolah.edu.my         # only this Google Workspace domain
ALLOWED_ORIGINS=https://logtugas.example.com
```

### 6.6 Seed Data Script

A standalone script (`scripts/seed.py`) that creates:
- 1 admin (`c.whitfield@sekolah.edu.my`)
- 6 wardens with Malay names
- 5 weeks of roster entries
- 18 days of sample reports with mixed statuses and ~3 substitution examples

---

## 7. ER Diagram

```
┌──────────┐       ┌────────────────┐       ┌──────────────┐
│  users   │       │ refresh_tokens │       │    roster     │
├──────────┤       ├────────────────┤       ├──────────────┤
│ id (PK)  │──┐    │ id (PK)        │       │ id (PK)      │
│ google_id│  ├───>│ user_id (FK)   │       │ date (UNIQUE)│
│ email    │  │    │ token_hash     │       │ putera_id(FK)│──┐
│ name     │  │    │ expires_at     │       │ puteri_id(FK)│──┤
│ role     │  │    │ revoked        │       │ updated_by   │  │
│ hostel   │  │    └────────────────┘       └──────────────┘  │
│ status   │  │                                                │
└──────────┘  │    ┌──────────────┐    ┌──────────────┐       │
              │    │   reports    │    │report_ratings│       │
              ├───>│ id (PK)      │───>│ id (PK)      │       │
              │    │ date         │    │ report_id(FK)│       │
              ├───>│ hostel       │    │ section_id   │       │
              │    │ status       │    │ item_key     │       │
              ├───>│ submitted_by │    │ rating       │       │
              │    │ duty_warden  │    └──────────────┘       │
              ├───>│ reviewed_by  │                            │
              │    │ flagged_by   │    ┌──────────────┐       │
              │    │ inspection_tm│    │ approval_log │       │
              │    │ submitted_at │───>│ id (PK)      │       │
              │    │ reviewed_at  │    │ report_id(FK)│       │
              │    │ flagged_at   │    │ user_id (FK) │───────┘
              │    │ ... (texts)  │    │ action       │
              │    └──────────────┘    │ note         │
              │                        │ created_at   │
              └────────────────────────└──────────────┘
```

- `reports` has **5 FK references** to `users` (submitted_by, duty_warden_id, reviewed_by, flagged_by)
- `roster` has **2 FK references** to `users` (putera_warden_id, puteri_warden_id)
- `report_ratings` is a child of `reports` (CASCADE delete)
- `approval_log` is an immutable child of `reports` (writes only, no updates)

---

## 8. Sections Reference

The 52 rating items across 7 sections, for schema reference:

| # | Section ID | Item Keys (9–6 items each) |
|---|-----------|---------------------------|
| 1 | `rutinAktivitiMurid` | `halaqahQuran`, `rollCall`, `riadhah`, `muraqabah`, `prep`, `tabassam`, `melawat`, `gotongRoyong`, `tidur` |
| 2 | `tarbiyyahRohaniyyah` | `qiamullail`, `kuliahSubuh`, `subuh`, `zohor`, `asar`, `azkarMaghrib`, `kuliahMaghrib`, `isya`, `usrahMurid`, `bacaanAlMulk` |
| 3 | `kebersihanArasBawah` | `lobi`, `musolla`, `storSukan`, `storKebersihan`, `bilikDobi`, `bilikIsolasi`, `bilikICT`, `tandas`, `ampaiBaju` |
| 4 | `kebersihanAras1` | `bilikDorm`, `koridor`, `bilikPantri`, `tandas`, `bilikPrep`, `bilikIron`, `bilikRekreasi` |
| 5 | `kebersihanAras2` | (same as Aras 1) |
| 6 | `kebersihanAras3` | (same as Aras 1) |
| 7 | `dewanMakan` | `sarapan`, `minumPagi`, `makanTengahari`, `minumPetang`, `makanMalam`, `minumMalam` |
| 8 | (text) | `aduan_kerosakan` |
| 9 | (text) | `murid_sakit` |
| 10 | (int 1–5) | `kawalan_keselamatan` |
| 11 | (text) | `catatan_tambahan` |

---

## 9. Migration Plan

1. **Dev environment**: local PostgreSQL via Docker
2. **Run migrations**: `alembic upgrade head`
3. **Seed data**: `python scripts/seed.py`
4. **Test with Swagger UI**: `http://localhost:8000/docs`
5. **Promote to Neon**: change `DATABASE_URL`, run migrations again
6. **Deploy**: Render/Fly.io web service with env vars from `.env`

---

## 10. Security Checklist

- [x] Google OAuth restricted to school domain (`ALLOWED_DOMAIN`)
- [x] JWT signed with HS256, 15-min expiry
- [x] Refresh tokens stored as SHA-256 hash, 7-day expiry
- [x] Refresh token rotation on each use (prevents replay)
- [x] RBAC middleware on every protected endpoint
- [x] Warden scoped to their hostel (cannot view other hostel's reports except via dashboard recap)
- [x] Admin-only endpoints gated by `require_admin`
- [x] CORS restricted to `ALLOWED_ORIGINS`
- [x] Input validation via Pydantic schemas
- [x] SQL injection prevented by SQLAlchemy parameterised queries
- [x] Rate limiting recommended (e.g. `slowapi` for FastAPI)
