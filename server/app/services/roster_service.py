from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.roster import Roster
from app.models.user import User
from app.utils.timezone import today_malaysia


async def get_weekly_roster(week_start: date, db: AsyncSession) -> list[dict]:
    week_end = week_start + timedelta(days=6)

    result = await db.execute(
        select(Roster)
        .where(Roster.date >= week_start, Roster.date <= week_end)
        .order_by(Roster.date)
    )
    roster_entries = result.scalars().all()

    days_map = {}
    for entry in roster_entries:
        putera = await db.get(User, entry.putera_warden_id)
        puteri = await db.get(User, entry.puteri_warden_id)
        days_map[entry.date.isoformat()] = {
            "date": entry.date,
            "day": entry.date.strftime("%A"),
            "putera": {"id": putera.id, "name": putera.name} if putera else None,
            "puteri": {"id": puteri.id, "name": puteri.name} if puteri else None,
        }

    result = []
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        if day_date.isoformat() in days_map:
            result.append(days_map[day_date.isoformat()])
        else:
            result.append(
                {
                    "date": day_date,
                    "day": day_date.strftime("%A"),
                    "putera": None,
                    "puteri": None,
                }
            )

    return result


async def get_today_roster(db: AsyncSession) -> dict | None:
    today = today_malaysia()

    result = await db.execute(
        select(Roster).where(Roster.date == today)
    )
    roster = result.scalar_one_or_none()

    if not roster:
        return None

    putera = await db.get(User, roster.putera_warden_id)
    puteri = await db.get(User, roster.puteri_warden_id)

    return {
        "date": roster.date,
        "day": roster.date.strftime("%A"),
        "putera": {"id": putera.id, "name": putera.name} if putera else None,
        "puteri": {"id": puteri.id, "name": puteri.name} if puteri else None,
    }


async def update_weekly_roster(
    week_start: date,
    assignments: list[dict],
    current_user: User,
    db: AsyncSession,
) -> list[dict]:
    for assignment in assignments:
        existing = await db.execute(
            select(Roster).where(Roster.date == assignment["date"])
        )
        roster_entry = existing.scalar_one_or_none()

        if roster_entry:
            roster_entry.putera_warden_id = assignment["putera_warden_id"]
            roster_entry.puteri_warden_id = assignment["puteri_warden_id"]
            roster_entry.updated_by = current_user.id
            roster_entry.updated_at = datetime.now(timezone.utc)
        else:
            db.add(
                Roster(
                    date=assignment["date"],
                    putera_warden_id=assignment["putera_warden_id"],
                    puteri_warden_id=assignment["puteri_warden_id"],
                    updated_by=current_user.id,
                )
            )

    await db.commit()

    return await get_weekly_roster(week_start, db)
