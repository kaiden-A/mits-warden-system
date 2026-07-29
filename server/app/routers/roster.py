from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.roster import RosterRead, RosterUpdate, TodayRoster
from app.services import roster_service

router = APIRouter(prefix="/roster", tags=["roster"])


@router.get("", response_model=RosterRead)
async def get_roster(
    week_start: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.utils.timezone import today_malaysia

    today = today_malaysia()
    if not week_start:
        week_start = today - timedelta(days=today.weekday())

    days = await roster_service.get_weekly_roster(week_start, db)
    return RosterRead(week_start=week_start, days=days)


@router.get("/today", response_model=TodayRoster)
async def get_today_roster(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await roster_service.get_today_roster(db)
    if not result:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No roster entry for today",
        )
    return TodayRoster(**result)


@router.put("", response_model=RosterRead)
async def update_roster(
    body: RosterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    assignments = [a.model_dump() for a in body.assignments]
    days = await roster_service.update_weekly_roster(
        body.week_start, assignments, current_user, db
    )
    return RosterRead(week_start=body.week_start, days=days)
