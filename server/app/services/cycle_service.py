import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.roster import Roster, RosterCycle, RosterCycleEntry
from app.models.user import User


def build_assignments(
    start_date: date, end_date: date, excluded_dates: list, pairs: list
) -> list[dict]:
    """Weekdays rotate one pair per day (continuous); each weekend
    (Saturday+Sunday) is covered by one pair, rotating independently
    A -> B -> C ... so every pair experiences weekend duty."""
    excluded = set()
    for d in excluded_dates:
        if isinstance(d, dict):
            excluded.add(d["date"])
        else:
            excluded.add(d.isoformat() if isinstance(d, date) else str(d))

    available = []
    current = start_date
    while current <= end_date:
        if current.isoformat() not in excluded:
            available.append(current)
        current += timedelta(days=1)

    if not pairs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sekurang-kurangnya satu pasangan warden diperlukan.",
        )
    if not available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tiada tarikh tersedia dalam tempoh ini selepas mengecualikan tarikh cuti.",
        )

    assignments = []
    weekday_idx = 0
    weekend_idx = 0
    i = 0
    while i < len(available):
        day = available[i]
        dow = day.weekday()
        if dow == 5 or dow == 6:  # Saturday or Sunday -> weekend slot
            pair = pairs[weekend_idx % len(pairs)]
            assignments.append(
                {
                    "date": day,
                    "pair_name": pair["name"],
                    "putera_warden_id": pair["putera_warden_id"],
                    "puteri_warden_id": pair["puteri_warden_id"],
                }
            )
            if dow == 5 and i + 1 < len(available) and available[i + 1] == day + timedelta(days=1):
                assignments.append(
                    {
                        "date": available[i + 1],
                        "pair_name": pair["name"],
                        "putera_warden_id": pair["putera_warden_id"],
                        "puteri_warden_id": pair["puteri_warden_id"],
                    }
                )
                i += 2
            else:
                i += 1
            weekend_idx += 1
        else:  # weekday -> one pair per day
            pair = pairs[weekday_idx % len(pairs)]
            assignments.append(
                {
                    "date": day,
                    "pair_name": pair["name"],
                    "putera_warden_id": pair["putera_warden_id"],
                    "puteri_warden_id": pair["puteri_warden_id"],
                }
            )
            weekday_idx += 1
            i += 1

    return assignments


async def create_cycle(body, current_user: User, db: AsyncSession) -> RosterCycle:
    if body.end_date < body.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tarikh akhir mesti selepas tarikh mula.",
        )
    if not body.pairs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sekurang-kurangnya satu pasangan warden diperlukan.",
        )
    for pair in body.pairs:
        await _validate_pair(pair.putera_warden_id, pair.puteri_warden_id, db)

    overlapping = await _find_overlapping(body.start_date, body.end_date, db)
    if overlapping:
        names = ", ".join(
            f"'{c.name}' ({c.start_date.isoformat()} – {c.end_date.isoformat()})"
            for c in overlapping
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tempoh ini bertindih dengan kitaran sedia ada: {names}. Sila pilih tempoh lain.",
        )

    cycle = RosterCycle(
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        pairs=[p.model_dump(mode="json") for p in body.pairs],
        excluded_dates=[
            {"date": d.date.isoformat(), "reason": d.reason}
            for d in body.excluded_dates
        ],
        status="draft",
        created_by=current_user.id,
    )
    db.add(cycle)
    await db.commit()
    await db.refresh(cycle)
    return cycle


async def _find_overlapping(start_date: date, end_date: date, db: AsyncSession) -> list[RosterCycle]:
    result = await db.execute(
        select(RosterCycle).where(
            RosterCycle.start_date <= end_date,
            RosterCycle.end_date >= start_date,
        )
    )
    return result.scalars().all()


async def _validate_warden(warden_id: uuid.UUID, hostel: str, db: AsyncSession):
    user = await db.get(User, warden_id)
    if not user or user.role != "warden" or user.status != "active" or user.hostel != hostel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Warden {hostel} dalam pasangan tidak sah.",
        )


async def _validate_pair(putera_id: uuid.UUID, puteri_id: uuid.UUID, db: AsyncSession):
    await _validate_warden(putera_id, "Asrama Putera", db)
    await _validate_warden(puteri_id, "Asrama Puteri", db)


async def get_cycle(cycle_id: uuid.UUID, db: AsyncSession) -> RosterCycle:
    result = await db.execute(
        select(RosterCycle)
        .where(RosterCycle.id == cycle_id)
        .options(selectinload(RosterCycle.entries))
        .execution_options(populate_existing=True)
    )
    cycle = result.scalar_one_or_none()
    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Kitaran roster tidak dijumpai."
        )
    return cycle


async def generate_cycle_entries(cycle: RosterCycle, db: AsyncSession) -> RosterCycle:
    await db.execute(
        delete(RosterCycleEntry).where(RosterCycleEntry.cycle_id == cycle.id)
    )
    for a in build_assignments(cycle.start_date, cycle.end_date, cycle.excluded_dates, cycle.pairs):
        db.add(RosterCycleEntry(cycle_id=cycle.id, **a))
    await db.commit()
    return await get_cycle(cycle.id, db)


async def apply_overrides(cycle: RosterCycle, overrides: list, db: AsyncSession):
    """Apply manual (date-keyed) warden changes on top of generated entries."""
    if not overrides:
        return
    by_date = {e.date: e for e in cycle.entries}
    for o in overrides:
        entry = by_date.get(o.date)
        if not entry:
            continue
        putera_id = o.putera_warden_id if o.putera_warden_id is not None else entry.putera_warden_id
        puteri_id = o.puteri_warden_id if o.puteri_warden_id is not None else entry.puteri_warden_id
        await _validate_warden(putera_id, "Asrama Putera", db)
        await _validate_warden(puteri_id, "Asrama Puteri", db)
        entry.putera_warden_id = putera_id
        entry.puteri_warden_id = puteri_id
    await db.commit()


async def publish_cycle(cycle: RosterCycle, current_user: User, db: AsyncSession) -> RosterCycle:
    if not cycle.entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jana roster dahulu sebelum menerbitkan.",
        )
    await db.execute(
        delete(Roster).where(
            Roster.date >= cycle.start_date, Roster.date <= cycle.end_date
        )
    )
    for entry in cycle.entries:
        db.add(
            Roster(
                date=entry.date,
                putera_warden_id=entry.putera_warden_id,
                puteri_warden_id=entry.puteri_warden_id,
                updated_by=current_user.id,
            )
        )
    cycle.status = "published"
    cycle.published_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(cycle)
    return cycle


async def delete_cycle(cycle: RosterCycle, db: AsyncSession):
    await db.execute(
        delete(Roster).where(
            Roster.date >= cycle.start_date, Roster.date <= cycle.end_date
        )
    )
    await db.delete(cycle)
    await db.commit()


async def update_cycle_entry(
    cycle: RosterCycle,
    entry_id: uuid.UUID,
    body,
    current_user: User,
    db: AsyncSession,
) -> RosterCycle:
    entry = next((e for e in cycle.entries if e.id == entry_id), None)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tugasan untuk tarikh ini tidak dijumpai.",
        )

    putera_id = body.putera_warden_id if body.putera_warden_id is not None else entry.putera_warden_id
    puteri_id = body.puteri_warden_id if body.puteri_warden_id is not None else entry.puteri_warden_id
    await _validate_warden(putera_id, "Asrama Putera", db)
    await _validate_warden(puteri_id, "Asrama Puteri", db)

    entry.putera_warden_id = putera_id
    entry.puteri_warden_id = puteri_id

    result = await db.execute(select(Roster).where(Roster.date == entry.date))
    roster = result.scalar_one_or_none()
    if roster:
        roster.putera_warden_id = putera_id
        roster.puteri_warden_id = puteri_id
        roster.updated_by = current_user.id
        roster.updated_at = datetime.now(timezone.utc)
    else:
        db.add(
            Roster(
                date=entry.date,
                putera_warden_id=putera_id,
                puteri_warden_id=puteri_id,
                updated_by=current_user.id,
            )
        )

    await db.commit()
    return await get_cycle(cycle.id, db)


async def entry_to_read(entry: RosterCycleEntry, db: AsyncSession, warden_map: dict | None = None) -> dict:
    putera = await _resolve_warden(db, entry.putera_warden_id, warden_map)
    puteri = await _resolve_warden(db, entry.puteri_warden_id, warden_map)
    return {
        "id": entry.id,
        "date": entry.date,
        "pair_name": entry.pair_name,
        "putera": putera,
        "puteri": puteri,
    }


async def warden_map(db: AsyncSession, entries: list[RosterCycleEntry]) -> dict[uuid.UUID, dict]:
    ids = {entry.putera_warden_id for entry in entries} | {
        entry.puteri_warden_id for entry in entries
    }
    if not ids:
        return {}
    result = await db.execute(select(User).where(User.id.in_(ids)))
    return {u.id: {"id": u.id, "name": u.name} for u in result.scalars().all()}


async def _resolve_warden(
    db: AsyncSession, warden_id: uuid.UUID, warden_map: dict | None = None
) -> dict | None:
    if warden_map is not None:
        return warden_map.get(warden_id)
    user = await db.get(User, warden_id)
    if not user:
        return None
    return {"id": user.id, "name": user.name}


def _selfcheck() -> None:
    from datetime import date as Date

    pairs = [
        {"name": "A", "putera_warden_id": uuid.uuid4(), "puteri_warden_id": uuid.uuid4()},
        {"name": "B", "putera_warden_id": uuid.uuid4(), "puteri_warden_id": uuid.uuid4()},
        {"name": "C", "putera_warden_id": uuid.uuid4(), "puteri_warden_id": uuid.uuid4()},
    ]
    out = build_assignments(
        Date(2026, 7, 1), Date(2026, 7, 31), ["2026-07-23", "2026-07-24"], pairs
    )
    assert len(out) == 29, f"expected 29 duty days, got {len(out)}"
    assert len({a["date"] for a in out}) == len(out), "duplicate dates in assignments"
    by_date = {a["date"]: a["pair_name"] for a in out}
    assert by_date[Date(2026, 7, 1)] == "A", "Jul 1 (Wed) should be A"
    assert by_date[Date(2026, 7, 2)] == "B", "Jul 2 (Thu) should be B"
    assert by_date[Date(2026, 7, 3)] == "C", "Jul 3 (Fri) should be C"
    assert by_date[Date(2026, 7, 4)] == by_date[Date(2026, 7, 5)] == "A", "weekend 1 should be A"
    assert by_date[Date(2026, 7, 11)] == by_date[Date(2026, 7, 12)] == "B", "weekend 2 should be B"
    assert by_date[Date(2026, 7, 18)] == by_date[Date(2026, 7, 19)] == "C", "weekend 3 should be C"
    assert by_date[Date(2026, 7, 25)] == by_date[Date(2026, 7, 26)] == "A", "weekend 4 should be A"
    assert by_date[Date(2026, 7, 6)] == "A", "weekday rotation continues (Fri C -> Mon A)"
    assert by_date[Date(2026, 7, 13)] == "C", "Jul 13 (Mon) should be C"
    assert by_date[Date(2026, 7, 27)] == "B", "Jul 27 (Mon) should be B"
    runs = {}
    prev_date = None
    prev_pair = None
    for a in out:
        if not (a["pair_name"] == prev_pair and a["date"] == prev_date + timedelta(days=1)):
            runs[a["pair_name"]] = runs.get(a["pair_name"], 0) + 1
        prev_date, prev_pair = a["date"], a["pair_name"]
    assert max(runs.values()) - min(runs.values()) <= 1, f"imbalanced blocks: {runs}"
    print("cycle_service selfcheck OK:", runs)


if __name__ == "__main__":
    _selfcheck()
