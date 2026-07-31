"""
Seed script - create admin users.

Usage:
    uv run scripts/seed.py --name "Name" --email "email@example.com" --password "pass123"

Options:
    --name      Full name (required)
    --email     Email address (required)
    --password  Password (required)
    --role      Role (default: admin)
"""

import argparse
import asyncio

from sqlalchemy import select

from app.database import get_session_maker
from app.models import User
from app.utils.security import hash_password


async def seed(name: str, email: str, password: str, role: str = "admin"):
    async_session = get_session_maker()
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )
        if result.scalar_one_or_none():
            print(f"User '{email}' already exists. Skipping.")
            return

        db.add(
            User(
                email=email,
                password_hash=hash_password(password),
                name=name,
                role=role,
                status="active",
            )
        )
        await db.commit()

        print(f"Created {role}: {name} <{email}>")
        print("  Add wardens via POST /api/wardens (admin-only)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--email", required=True, help="Email address")
    parser.add_argument("--password", required=True, help="Password")
    parser.add_argument("--role", default="admin", help="Role (default: admin)")
    args = parser.parse_args()

    asyncio.run(seed(args.name, args.email, args.password, args.role))
