import uuid
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.roster import Roster, RosterDefault
from app.models.user import User
from app.utils.timezone import today_malaysia

_DAY_NAMES = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"]


async def _resolve_warden(
    db: AsyncSession, warden_id: uuid.UUID | None
) -> dict | None:
    if not warden_id:
        return None
    user = await db.get(User, warden_id)
    if not user or user.status != "active":
        return None
    return {"id": user.id, "name": user.name}


async def _get_defaults_map(db: AsyncSession) -> dict[int, dict]:
    result = await db.execute(select(RosterDefault))
    defaults = result.scalars().all()
    return {
        d.updated_at.toordinal(): {
            "putera": await _resolve_warden(db, d.putera_warden_id),
            "puteri": await _resolve_warden(db, d.puteri_warden_id),
        }
        for d in defaults
    }


async def get_weekly_roster(week_start: date, db: AsyncSession) -> list[dict]:
    week_end = week_start + timedelta(days=6)

    result = await db.execute(
        select(Roster)
        .where(Roster.date >= week_start, Roster.date <= week_end)
        .order_by(Roster.date)
    )
    roster_entries = result.scalars().all()

    default = await db.execute(select(RosterDefault))
    default_entry = default.scalar_one_or_none()

    default_putera = None
    default_puteri = None
    if default_entry:
        default_putera = await _resolve_warden(db, default_entry.putera_warden_id)
        default_puteri = await _resolve_warden(db, default_entry.puteri_warden_id)

    days_map = {}
    for entry in roster_entries:
        putera = await _resolve_warden(db, entry.putera_warden_id)
        puteri = await _resolve_warden(db, entry.puteri_warden_id)
        days_map[entry.date.isoformat()] = {
            "date": entry.date,
            "day": _DAY_NAMES[entry.date.weekday()],
            "putera": putera,
            "puteri": puteri,
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
                    "day": _DAY_NAMES[day_date.weekday()],
                    "putera": default_putera,
                    "puteri": default_puteri,
                }
            )

    return result


async def get_roster_for_date(
    db: AsyncSession, target_date: date
) -> Roster | SimpleNamespace | None:
    result = await db.execute(
        select(Roster).where(Roster.date == target_date)
    )
    roster = result.scalar_one_or_none()
    if roster:
        return roster

    default = await db.execute(select(RosterDefault))
    default_entry = default.scalar_one_or_none()
    if default_entry:
        return SimpleNamespace(
            date=target_date,
            putera_warden_id=default_entry.putera_warden_id,
            puteri_warden_id=default_entry.puteri_warden_id,
        )

    return None


async def get_today_roster(db: AsyncSession) -> dict | None:
    today = today_malaysia()

    roster = await get_roster_for_date(db, today)
    if not roster:
        return None

    putera = await _resolve_warden(db, roster.putera_warden_id)
    puteri = await _resolve_warden(db, roster.puteri_warden_id)
    return {
        "date": roster.date,
        "day": _DAY_NAMES[roster.date.weekday()],
        "putera": putera,
        "puteri": puteri,
    }


async def update_weekly_roster(
    week_start: date,
    assignments: list[dict],
    current_user: User,
    db: AsyncSession,
) -> list[dict]:
    for i, assignment in enumerate(assignments):
        putera_id = assignment.get("putera_warden_id")
        puteri_id = assignment.get("puteri_warden_id")

        if not putera_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warden Asrama Putera untuk hari {_DAY_NAMES[i]} mesti dipilih.",
            )
        if not puteri_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warden Asrama Puteri untuk hari {_DAY_NAMES[i]} mesti dipilih.",
            )

        putera = await db.get(User, putera_id)
        if not putera or putera.role != "warden" or putera.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warden Asrama Putera untuk hari {_DAY_NAMES[i]} tidak sah.",
            )
        puteri = await db.get(User, puteri_id)
        if not puteri or puteri.role != "warden" or puteri.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warden Asrama Puteri untuk hari {_DAY_NAMES[i]} tidak sah.",
            )

        existing = await db.execute(
            select(Roster).where(Roster.date == assignment["date"])
        )
        roster_entry = existing.scalar_one_or_none()

        if roster_entry:
            roster_entry.putera_warden_id = putera_id
            roster_entry.puteri_warden_id = puteri_id
            roster_entry.updated_by = current_user.id
            roster_entry.updated_at = datetime.now(timezone.utc)
        else:
            db.add(
                Roster(
                    date=assignment["date"],
                    putera_warden_id=putera_id,
                    puteri_warden_id=puteri_id,
                    updated_by=current_user.id,
                )
            )

    default = await db.execute(select(RosterDefault))
    default_entry = default.scalar_one_or_none()
    if default_entry:
        default_entry.putera_warden_id = assignments[0]["putera_warden_id"]
        default_entry.puteri_warden_id = assignments[0]["puteri_warden_id"]
        default_entry.updated_by = current_user.id
        default_entry.updated_at = datetime.now(timezone.utc)
    else:
        db.add(
            RosterDefault(
                putera_warden_id=assignments[0]["putera_warden_id"],
                puteri_warden_id=assignments[0]["puteri_warden_id"],
                updated_by=current_user.id,
            )
        )

    await db.commit()

    return await get_weekly_roster(week_start, db)
