# Authentication

## Login Flow

```
Client                          Server
  │                                │
  │  POST /api/auth/login         │
  │  { email, password }          │
  │                                │── Verify bcrypt hash
  │                                │── Check user.status == "active"
  │                                │── Generate access_token (JWT, 15m)
  │                                │── Generate refresh_token (opaque, 7d)
  │                                │── Store SHA-256 hash of refresh_token
  │  <── { access_token,          │
  │         refresh_token,        │
  │         expires_in }          │
  │                                │
  │  POST /api/auth/refresh       │
  │  { refresh_token }            │
  │                                │── Hash token, find match in DB
  │                                │── Revoke old token (rotation)
  │                                │── Issue new pair
  │  <── { access_token,          │
  │         refresh_token }       │
```

## JWT Payload

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "faiz@sekolah.edu.my",
  "name": "Muhammad Faiz Bin Ahmad",
  "role": "warden",
  "hostel": "Asrama Putera",
  "exp": 1720000000,
  "iat": 1719999100,
  "jti": "unique-token-id"
}
```

## Token Lifecycle

| Token | Duration | Storage | Purpose |
|-------|----------|---------|---------|
| Access token (JWT) | 15 min | Client memory | `Authorization: Bearer <token>` |
| Refresh token (opaque) | 7 days | Client secure storage | Issue new access tokens |

Refresh token is SHA-256 hashed before DB storage. The plain value is returned to the client once and never stored server-side.

## Token Rotation

Every time a refresh token is used to get new tokens:
1. The old refresh token is **revoked** (marked `revoked = true`)
2. A new refresh token is issued
3. If an attacker steals a refresh token, using it will revoke the legitimate user's token

## RBAC Matrix

| Resource | Admin | Warden |
|----------|-------|--------|
| `GET /api/wardens` | All wardens | Forbidden |
| `POST /api/wardens` | Yes | Forbidden |
| `PATCH /api/wardens/{id}/status` | Yes | Forbidden |
| `GET /api/roster` | Any week | Current week |
| `PUT /api/roster` | Yes | Forbidden |
| `GET /api/reports` | All reports | Own hostel only |
| `POST /api/reports` | Forbidden | Yes |
| `PATCH /api/reports/{id}` | Admin note only | Own drafts only |
| `POST /api/reports/{id}/submit` | Forbidden | Own reports only |
| `POST /api/reports/{id}/review` | Yes | Forbidden |
| `POST /api/reports/{id}/flag` | Yes | Forbidden |
| `GET /api/dashboard` | Forbidden | Warden view |
| `GET /api/dashboard/admin` | Admin view | Forbidden |

## Implementation

### Dependencies

```python
# app/dependencies.py

async def get_current_user(token: str, db) -> User:
    payload = verify_access_token(token)
    user = await db.get(User, payload["sub"])
    if not user or user.status != "active":
        raise HTTPException(403)
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403)
    return user
```

### Security

- Passwords hashed with bcrypt
- JWT signed with HS256
- Refresh tokens stored as SHA-256 hash
- Automatic token rotation on refresh
- CORS restricted to `ALLOWED_ORIGINS`
- Input validation via Pydantic schemas
- SQL injection prevented by SQLAlchemy parameterised queries
