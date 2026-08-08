import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.roster import RosterCycle
from app.models.user import User
from app.schemas.roster import (
    RosterCycleCreate,
    RosterCycleDetail,
    RosterCycleEntryUpdate,
    RosterCycleExcludedUpdate,
    RosterCycleGenerate,
    RosterCycleSummary,
)
from app.services import cycle_service

router = APIRouter(prefix="/cycles", tags=["cycles"])


@router.get("", response_model=list[RosterCycleSummary])
async def list_cycles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(
        select(RosterCycle).order_by(RosterCycle.start_date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=RosterCycleDetail, status_code=status.HTTP_201_CREATED)
async def create_cycle(
    body: RosterCycleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cycle = await cycle_service.create_cycle(body, current_user, db)
    cycle = await cycle_service.generate_cycle_entries(cycle, db)
    await cycle_service.publish_cycle(cycle, current_user, db)
    return await _cycle_detail(cycle.id, db)


async def _cycle_detail(cycle_id: uuid.UUID, db: AsyncSession) -> RosterCycleDetail:
    cycle = await cycle_service.get_cycle(cycle_id, db)
    wm = await cycle_service.warden_map(db, cycle.entries)
    entries = []
    for entry in cycle.entries:
        entries.append(await cycle_service.entry_to_read(entry, db, wm))
    return RosterCycleDetail(**RosterCycleSummary.model_validate(cycle).model_dump(), entries=entries)


@router.get("/{cycle_id}", response_model=RosterCycleDetail)
async def get_cycle(
    cycle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await _cycle_detail(cycle_id, db)


@router.patch("/{cycle_id}", response_model=RosterCycleSummary)
async def update_excluded_dates(
    cycle_id: uuid.UUID,
    body: RosterCycleExcludedUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cycle = await cycle_service.get_cycle(cycle_id, db)
    cycle.excluded_dates = [
        {"date": d.date.isoformat(), "reason": d.reason}
        for d in body.excluded_dates
    ]
    await db.commit()
    await db.refresh(cycle)
    return cycle


@router.post("/{cycle_id}/generate", response_model=RosterCycleDetail)
async def generate_roster(
    cycle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    body: RosterCycleGenerate | None = None,
):
    cycle = await cycle_service.get_cycle(cycle_id, db)
    cycle = await cycle_service.generate_cycle_entries(cycle, db)
    if body:
        await cycle_service.apply_overrides(cycle, body.overrides, db)
        cycle = await cycle_service.get_cycle(cycle_id, db)
    await cycle_service.publish_cycle(cycle, current_user, db)
    return await _cycle_detail(cycle_id, db)


@router.patch("/{cycle_id}/entries/{entry_id}", response_model=RosterCycleDetail)
async def update_cycle_entry(
    cycle_id: uuid.UUID,
    entry_id: uuid.UUID,
    body: RosterCycleEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cycle = await cycle_service.get_cycle(cycle_id, db)
    await cycle_service.update_cycle_entry(cycle, entry_id, body, current_user, db)
    return await _cycle_detail(cycle_id, db)


@router.delete("/{cycle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cycle(
    cycle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cycle = await cycle_service.get_cycle(cycle_id, db)
    await cycle_service.delete_cycle(cycle, db)
