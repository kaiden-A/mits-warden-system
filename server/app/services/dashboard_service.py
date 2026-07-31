from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.models.roster import Roster
from app.models.user import User
from app.utils.timezone import today_malaysia


async def get_warden_dashboard(
    current_user: User, db: AsyncSession
) -> dict:
    today = today_malaysia()
    week_start = today - timedelta(days=today.weekday())

    stats = {
        "total_reports": 0,
        "submitted_this_week": 0,
        "reviewed_total": 0,
    }

    total_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.hostel == current_user.hostel,
            Report.status != "draft",
        )
    )
    stats["total_reports"] = total_result.scalar() or 0

    week_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.hostel == current_user.hostel,
            Report.date >= week_start,
            Report.date <= today,
            Report.status != "draft",
        )
    )
    stats["submitted_this_week"] = week_result.scalar() or 0

    reviewed_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.hostel == current_user.hostel,
            Report.status == "reviewed",
        )
    )
    stats["reviewed_total"] = reviewed_result.scalar() or 0

    roster_result = await db.execute(
        select(Roster).where(Roster.date == today)
    )
    today_roster = roster_result.scalar_one_or_none()

    today_info = None
    if today_roster:
        is_on_duty = (
            current_user.id == today_roster.putera_warden_id
            or current_user.id == today_roster.puteri_warden_id
        )

        report_result = await db.execute(
            select(Report).where(
                Report.date == today,
                Report.hostel == current_user.hostel,
            )
        )
        today_report = report_result.scalar_one_or_none()

        today_info = {
            "date": today,
            "day": today.strftime("%A"),
            "duty_warden": {
                "id": today_roster.putera_warden_id
                if current_user.hostel == "Asrama Putera"
                else today_roster.puteri_warden_id,
                "name": "",
            },
            "is_user_on_duty": is_on_duty,
            "report": today_report.status if today_report else None,
        }

    week_recap = []
    week_progress = []

    for i in range(7):
        day_date = week_start + timedelta(days=i)
        if day_date > today:
            continue

        if not current_user.hostel:
            continue

        report_result = await db.execute(
            select(Report).where(
                Report.date == day_date,
                Report.hostel == current_user.hostel,
            )
        )
        day_report = report_result.scalar_one_or_none()

        week_progress.append(
            {
                "date": day_date,
                "status": day_report.status if day_report else "none",
            }
        )

    week_progress = list(
        {v["date"]: v for v in week_progress}.values()
    )
    week_progress.sort(key=lambda x: x["date"])

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "hostel": current_user.hostel,
        },
        "stats": stats,
        "today": today_info,
        "week_recap": week_recap,
        "week_progress": week_progress,
    }


async def get_admin_dashboard(
    current_user: User, db: AsyncSession
) -> dict:
    today = today_malaysia()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    active_result = await db.execute(
        select(func.count(User.id)).where(
            User.role == "warden", User.status == "active"
        )
    )
    active_wardens = active_result.scalar() or 0

    pending_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.status == "submitted",
            Report.date >= week_start,
            Report.date <= week_end,
        )
    )
    pending_review = pending_result.scalar() or 0

    reviewed_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.status == "reviewed",
            Report.date >= week_start,
            Report.date <= week_end,
        )
    )
    reviewed_this_week = reviewed_result.scalar() or 0

    flagged_result = await db.execute(
        select(func.count(Report.id)).where(Report.status == "flagged")
    )
    flagged_total = flagged_result.scalar() or 0

    recent_result = await db.execute(
        select(Report)
        .order_by(Report.updated_at.desc())
        .limit(10)
    )
    recent_reports = recent_result.scalars().all()

    recent_entries = []
    for r in recent_reports:
        submitter = await db.get(User, r.submitted_by)
        recent_entries.append(
            {
                "id": r.id,
                "date": r.date,
                "hostel": r.hostel,
                "warden_name": submitter.name if submitter else "",
                "status": r.status,
                "inspection_time": str(r.inspection_time)
                if r.inspection_time
                else None,
            }
        )

    return {
        "stats": {
            "active_wardens": active_wardens,
            "pending_review_this_week": pending_review,
            "reviewed_this_week": reviewed_this_week,
            "flagged_total": flagged_total,
        },
        "recent_entries": recent_entries,
    }
