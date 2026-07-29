"""
Seed script - creates the initial admin user.

Usage:
    .venv/Scripts/python.exe scripts/seed.py

Or from the project root:
    uv run scripts/seed.py
"""

import asyncio

from sqlalchemy import select

from app.database import get_session_maker
from app.models import User
from app.utils.security import hash_password

ADMIN = {
    "name": "Mits Klang Admin",
    "email": "info@mitsklang.edu.my",
    "password": "admin123",
    "role": "admin",
}


async def seed():
    async_session = get_session_maker()
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.email == ADMIN["email"])
        )
        if result.scalar_one_or_none():
            print("Admin already exists. Skipping.")
            return

        db.add(
            User(
                email=ADMIN["email"],
                password_hash=hash_password(ADMIN["password"]),
                name=ADMIN["name"],
                role=ADMIN["role"],
                status="active",
            )
        )
        await db.commit()

        print("Seed complete!")
        print(f"  Admin: {ADMIN['email']} / {ADMIN['password']}")
        print("  Add wardens via POST /api/wardens (admin-only)")


asyncio.run(seed())
