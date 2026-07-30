import logging
from pathlib import Path

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "email_templates"

FROM_EMAIL = "mail@mitsklang.edu.my"


def _render_template(template_name: str, **kwargs: str) -> str:
    path = TEMPLATES_DIR / template_name
    raw = path.read_text(encoding="utf-8")
    for key, val in kwargs.items():
        raw = raw.replace("{{ " + key + " }}", val)
    return raw


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
) -> bool:
    url = settings.MOTIONU_API_URL.rstrip("/") + "/api/v1/emails/send-html"
    headers = {
        "Content-Type": "application/json",
        "motionu-api-key": settings.MOTIONU_API_KEY,
    }
    payload = {
        "toEmail": to_email,
        "subject": subject,
        "fromEmail": FROM_EMAIL,
        "htmlContent": html_content,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            logger.info("Email sent to %s — subject=%s", to_email, subject)
            return True
        except httpx.HTTPError as exc:
            logger.error(
                "Failed to send email to %s — subject=%s — %s",
                to_email,
                subject,
                exc,
            )
            return False


async def notify_warden_created(
    to_email: str,
    name: str,
    hostel: str,
    password: str,
) -> bool:
    html = _render_template(
        "warden_welcome.html",
        name=name,
        hostel=hostel,
        email=to_email,
        password=password,
        login_url=settings.FRONTEND_URL.rstrip("/") + "/login",
    )
    return await send_email(
        to_email=to_email,
        subject="Selamat Datang ke Sistem Log Tugas Warden",
        html_content=html,
    )


async def notify_substitution(
    to_email: str,
    duty_warden_name: str,
    submitted_by_name: str,
    date: str,
    hostel: str,
) -> bool:
    html = _render_template(
        "substitution_notice.html",
        duty_warden_name=duty_warden_name,
        submitted_by_name=submitted_by_name,
        date=date,
        hostel=hostel,
    )
    return await send_email(
        to_email=to_email,
        subject="Notifikasi Penggantian Tugasan Warden",
        html_content=html,
    )
