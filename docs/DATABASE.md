# Database

## Schema

```
┌──────────┐       ┌────────────────┐       ┌──────────────┐
│  users   │       │ refresh_tokens │       │    roster     │
├──────────┤       ├────────────────┤       ├──────────────┤
│ id (PK)  │──┐    │ id (PK)        │       │ id (PK)      │
│ email    │  ├───>│ user_id (FK)   │       │ date (UNIQUE)│
│ password │  │    │ token_hash     │       │ putera_id(FK)│──┐
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
              │    │ ...          │    │ action       │
              │    └──────────────┘    │ note         │
              │                        │ created_at   │
              └────────────────────────└──────────────┘
```

## Tables

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `email` | VARCHAR(255) UNIQUE | Login identifier |
| `password_hash` | VARCHAR(255) | bcrypt hash |
| `name` | VARCHAR(255) | Full name |
| `role` | VARCHAR(20) | `admin` or `warden` (warden = warden membership) |
| `is_admin` | BOOLEAN | Independent admin privilege; a warden with `is_admin = true` is a dual admin+warden |
| `hostel` | VARCHAR(20) | `Asrama Putera` / `Asrama Puteri` / NULL for admin |
| `status` | VARCHAR(20) | `active` or `revoked` |
| `must_change_password` | BOOLEAN | True if admin-generated password |
| `last_login_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `roster`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `date` | DATE UNIQUE | Calendar date |
| `putera_warden_id` | UUID FK→users | Warden on duty for Asrama Putera |
| `puteri_warden_id` | UUID FK→users | Warden on duty for Asrama Puteri |
| `updated_by` | UUID FK→users | Admin who last updated |
| `updated_at` | TIMESTAMPTZ | |

### `reports`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `date` | DATE | Report date |
| `hostel` | VARCHAR(20) | `Asrama Putera` or `Asrama Puteri` |
| `submitted_by` | UUID FK→users | Who filled the report |
| `duty_warden_id` | UUID FK→users | Who was rostered |
| `is_substitution` | BOOLEAN | true if submitter ≠ duty warden |
| `inspection_time` | TIME | |
| `status` | VARCHAR(20) | `draft` → `submitted` → `reviewed` / `flagged` |
| `submitted_at` | TIMESTAMPTZ | |
| `reviewed_by` | UUID FK→users | |
| `reviewed_at` | TIMESTAMPTZ | |
| `flagged_by` | UUID FK→users | |
| `flagged_at` | TIMESTAMPTZ | |
| `admin_note` | TEXT | |
| `aduan_kerosakan` | TEXT | Damage report (default `TKD`) |
| `murid_sakit` | TEXT | Sick students (default `TLB`) |
| `kawalan_keselamatan` | SMALLINT | Security rating 1–5 |
| `catatan_tambahan` | TEXT | Additional notes |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Constraint:** UNIQUE(date, hostel) — one report per date per hostel.

### `report_ratings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `report_id` | UUID FK→reports | Cascade delete |
| `section_id` | VARCHAR(50) | e.g. `rutinAktivitiMurid` |
| `item_key` | VARCHAR(50) | e.g. `rollCall` |
| `rating` | VARCHAR(2) | `1`–`4`, `NA`, or empty |

**Constraint:** UNIQUE(report_id, section_id, item_key)

### `approval_log`

Immutable audit trail.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `report_id` | UUID FK→reports | Cascade delete |
| `user_id` | UUID FK→users | Who performed the action |
| `action` | VARCHAR(20) | `created`, `submitted`, `reviewed`, `flagged` |
| `note` | TEXT | Optional admin note |
| `created_at` | TIMESTAMPTZ | |

### `refresh_tokens`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK→users | Cascade delete |
| `token_hash` | VARCHAR(255) | SHA-256 of raw token |
| `expires_at` | TIMESTAMPTZ | |
| `revoked` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

## Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Sections Reference

52 rating items across 7 sections:

| Section | Items |
|---------|-------|
| `rutinAktivitiMurid` | halaqahQuran, rollCall, riadhah, muraqabah, prep, tabassam, melawat, gotongRoyong, tidur |
| `tarbiyyahRohaniyyah` | qiamullail, kuliahSubuh, subuh, zohor, asar, azkarMaghrib, kuliahMaghrib, isya, usrahMurid, bacaanAlMulk |
| `kebersihanArasBawah` | lobi, musolla, storSukan, storKebersihan, bilikDobi, bilikIsolasi, bilikICT, tandas, ampaiBaju |
| `kebersihanAras1` | bilikDorm, koridor, bilikPantri, tandas, bilikPrep, bilikIron, bilikRekreasi |
| `kebersihanAras2` | (same as Aras 1) |
| `kebersihanAras3` | (same as Aras 1) |
| `dewanMakan` | sarapan, minumPagi, makanTengahari, minumPetang, makanMalam, minumMalam |
