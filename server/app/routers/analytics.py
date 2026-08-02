from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    week_start: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    from app.utils.timezone import today_malaysia

    today = today_malaysia()
    if not week_start:
        week_start = today - timedelta(days=today.weekday())

    week = await analytics_service.get_week_summary(week_start, db)
    sections = await analytics_service.get_section_ratings(week_start, db)
    return AnalyticsResponse(week_start=week_start, week=week, sections=sections)
