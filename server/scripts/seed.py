"""
Seed script - create admin users and optional demo wardens.

Usage:
    uv run scripts/seed.py --name "Name" --email "email@example.com" --password "pass123"
    uv run scripts/seed.py --wardens --password "pass123"

Options:
    --name      Full name (required)
    --email     Email address (required)
    --password  Password (required)
    --role      Role (default: admin)
    --wardens   Seed 3 Asrama Putera + 3 Asrama Puteri demo wardens
"""

import argparse
import asyncio

from sqlalchemy import select

from app.database import get_session_maker
from app.models import User
from app.utils.security import hash_password

DEMO_WARDENS = [
    ("Ahmad Fauzi", "warden.putera1@example.com", "Asrama Putera"),
    ("Muhammad Faiz", "warden.putera2@example.com", "Asrama Putera"),
    ("Ridzuan Hakim", "warden.putera3@example.com", "Asrama Putera"),
    ("Nurul Aisyah", "warden.puteri1@example.com", "Asrama Puteri"),
    ("Siti Maisarah", "warden.puteri2@example.com", "Asrama Puteri"),
    ("Aina Balqis", "warden.puteri3@example.com", "Asrama Puteri"),
]


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


async def seed_wardens(password: str):
    async_session = get_session_maker()
    async with async_session() as db:
        created = 0
        for name, email, hostel in DEMO_WARDENS:
            result = await db.execute(
                select(User).where(User.email == email)
            )
            if result.scalar_one_or_none():
                print(f"Warden '{email}' already exists. Skipping.")
                continue

            db.add(
                User(
                    email=email,
                    password_hash=hash_password(password),
                    name=name,
                    role="warden",
                    hostel=hostel,
                    status="active",
                )
            )
            created += 1
        await db.commit()
        print(f"Created {created} demo wardens (3 putera + 3 puteri).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed admin user and/or demo wardens")
    parser.add_argument("--name", help="Full name")
    parser.add_argument("--email", help="Email address")
    parser.add_argument("--password", required=True, help="Password")
    parser.add_argument("--role", default="admin", help="Role (default: admin)")
    parser.add_argument("--wardens", action="store_true", help="Seed 3 putera + 3 puteri demo wardens")
    args = parser.parse_args()

    if args.wardens:
        asyncio.run(seed_wardens(args.password))
    if args.name and args.email:
        asyncio.run(seed(args.name, args.email, args.password, args.role))
