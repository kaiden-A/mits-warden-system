# API Reference

Base URL: `http://localhost:8000/api`

All protected endpoints require header: `Authorization: Bearer <access_token>`

---

## Auth

### `POST /api/auth/login`

Authenticate with email and password.

**Request:**
```json
{
  "email": "faiz@sekolah.edu.my",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### `POST /api/auth/refresh`

Issue new tokens. Revokes old refresh token (rotation).

**Request:**
```json
{
  "refresh_token": "abc123..."
}
```

**Response:** Same as login.

### `POST /api/auth/logout`

Revoke refresh token. Requires JWT.

**Request:**
```json
{
  "refresh_token": "abc123..."
}
```

**Response:** `{ "message": "Logged out successfully" }`

### `GET /api/auth/me`

Get current user profile. Requires JWT.

**Response:**
```json
{
  "id": "550e8400-...",
  "email": "faiz@sekolah.edu.my",
  "name": "Muhammad Faiz Bin Ahmad",
  "role": "warden",
  "hostel": "Asrama Putera",
  "status": "active"
}
```

---

## Wardens (Admin only)

### `GET /api/wardens`

List all wardens with report stats.

**Response:**
```json
{
  "wardens": [
    {
      "id": "...",
      "email": "faiz@sekolah.edu.my",
      "name": "Muhammad Faiz Bin Ahmad",
      "hostel": "Asrama Putera",
      "status": "active",
      "report_count": 12,
      "last_submission": "2026-07-28T..."
    }
  ]
}
```

### `POST /api/wardens`

Create a new warden. Sends welcome email.

**Request:**
```json
{
  "email": "faiz@sekolah.edu.my",
  "name": "Muhammad Faiz Bin Ahmad",
  "hostel": "Asrama Putera",
  "password": "optional-password"
}
```

If `password` is omitted, defaults to `changeme123` and `must_change_password` is set.

### `PATCH /api/wardens/{id}/status`

Activate or revoke a warden.

**Request:**
```json
{
  "status": "active"
}
```

---

## Roster

### `GET /api/roster?week_start=2026-07-27`

Get weekly roster. Defaults to current week.

**Response:**
```json
{
  "week_start": "2026-07-27",
  "days": [
    {
      "date": "2026-07-27",
      "day": "Isnin",
      "putera": { "id": "...", "name": "Khairul Azman" },
      "puteri": { "id": "...", "name": "Aina Maisarah" }
    }
  ]
}
```

### `GET /api/roster/today`

Get today's duty wardens.

### `PUT /api/roster` (Admin)

Update one week's roster. Requires exactly 7 assignments.

**Request:**
```json
{
  "week_start": "2026-07-27",
  "assignments": [
    { "date": "2026-07-27", "putera_warden_id": "...", "puteri_warden_id": "..." }
  ]
}
```

---

## Reports

### `GET /api/reports`

List reports with filters.

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `week_start` | date | current Monday | ISO date |
| `hostel` | string | user's hostel | `Asrama Putera` / `Asrama Puteri` |
| `status` | string | — | `draft` / `submitted` / `reviewed` / `flagged` |
| `page` | int | 1 | Pagination |
| `per_page` | int | 20 | Max 50 |

### `GET /api/reports/{id}`

Full report detail with ratings, user names, and approval trail.

### `POST /api/reports` (Warden)

Create a new report. Backend resolves `duty_warden_id` from roster and sets `is_substitution`.

**Request:**
```json
{
  "date": "2026-07-29",
  "inspection_time": "07:30",
  "status": "draft",
  "ratings": {
    "rutinAktivitiMurid": { "rollCall": "4", "halaqahQuran": "3" }
  },
  "aduan_kerosakan": "TKD",
  "murid_sakit": "TLB",
  "kawalan_keselamatan": 4,
  "catatan_tambahan": ""
}
```

### `PATCH /api/reports/{id}` (Warden)

Update draft report. Only editable by the creator while in `draft` status.

### `POST /api/reports/{id}/submit` (Warden)

Submit a draft. Sets status to `submitted`. If `is_substitution=true`, sends email to duty warden.

### `POST /api/reports/{id}/review` (Admin)

Review a submitted/flagged report.

**Request:**
```json
{
  "admin_note": "Clean report. No follow-up needed."
}
```

### `POST /api/reports/{id}/flag` (Admin)

Flag a report for follow-up.

**Request:**
```json
{
  "admin_note": "Please revise section 2."
}
```

---

## Dashboard

### `GET /api/dashboard` (Warden)

Warden's personal dashboard: stats, today's duty, weekly progress.

### `GET /api/dashboard/admin` (Admin)

Admin overview: active wardens, pending reviews, recent entries.

---

## Health

### `GET /api/health`

```json
{ "status": "ok" }
```

---

## Error Responses

All errors return:
```json
{
  "detail": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation) |
| 401 | Unauthorized (missing/expired token) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
