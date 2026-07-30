# Email Service

Uses Motion-U's email API (`/api/v1/emails/send-html`) to send HTML emails.

## Configuration

```bash
MOTIONU_API_URL=https://api.motionukict.com/
MOTIONU_API_KEY=your-api-key-here
FRONTEND_URL=http://localhost:3000
```

## Email Triggers

### 1. Warden Welcome

**Trigger:** `POST /api/wardens` — after admin creates a new warden.

**To:** The new warden's email

**Content:**
- Congratulations message
- Hostel assignment
- Login credentials (email + temp password)
- "Log Masuk ke Sistem" button linking to frontend login page
- Note to change password on first login

**Template:** `server/app/email_templates/warden_welcome.html`

### 2. Substitution Notice

**Trigger:** `POST /api/reports/{id}/submit` or `POST /api/reports` (with `status=submitted`) when `is_substitution=True`.

**To:** The duty warden (the person rostered for that shift)

**Condition:** Only sent when `is_substitution=True` (submitter ≠ duty warden).

**Content:**
- Notification that someone submitted a report on their behalf
- Date, hostel, and who submitted it
- Reminder to check the system

**Template:** `server/app/email_templates/substitution_notice.html`

## Architecture

```
app/services/email_service.py
├── send_email()              # Core: POST to Motion-U API
├── _render_template()        # Simple {{ var }} replacement
├── notify_warden_created()   # Welcome email wrapper
└── notify_substitution()     # Substitution notice wrapper
```

Emails are **fire-and-forget**: failures are logged but never block the API response.

## Adding a New Email

1. Create template in `server/app/email_templates/`
2. Add render + send function in `email_service.py`
3. Call it from the appropriate router or service

## Sender

All emails use `mail@mitsklang.edu.my` as the sender.

## Template Language

Templates use `{{ variable }}` placeholders replaced by Python `str.replace()` — no Jinja2 dependency needed.
