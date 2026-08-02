from datetime import date, timedelta

from sqlalchemy import Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report, ReportRating

RATING_VALUES = ("1", "2", "3", "4", "NA")

_SECTION_ORDER = [
    "rutinAktivitiMurid",
    "tarbiyyahRohaniyyah",
    "kebersihanArasBawah",
    "kebersihanAras1",
    "kebersihanAras2",
    "kebersihanAras3",
    "dewanMakan",
]

STATUS_KEYS = ("draft", "submitted", "reviewed", "flagged")


async def get_week_summary(week_start: date, db: AsyncSession) -> list[dict]:
    week_end = week_start + timedelta(days=6)

    status_rows = (
        await db.execute(
            select(
                Report.date,
                Report.status,
                func.count(Report.id).label("n"),
            )
            .where(Report.date >= week_start, Report.date <= week_end)
            .group_by(Report.date, Report.status)
        )
    ).all()

    late_rows = (
        await db.execute(
            select(Report.date, func.count(Report.id).label("n"))
            .where(
                Report.date >= week_start,
                Report.date <= week_end,
                Report.is_late,
            )
            .group_by(Report.date)
        )
    ).all()
    late_by_date = {row.date: row.n for row in late_rows}

    days = []
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        counts = {key: 0 for key in STATUS_KEYS}
        total = 0
        for row in status_rows:
            if row.date == day_date:
                counts[row.status] = counts.get(row.status, 0) + row.n
                total += row.n
        days.append(
            {
                "date": day_date,
                "status_counts": counts,
                "late": late_by_date.get(day_date, 0),
                "total": total,
            }
        )

    return days


async def get_section_ratings(week_start: date, db: AsyncSession) -> list[dict]:
    week_end = week_start + timedelta(days=6)

    numeric_rows = (
        await db.execute(
            select(
                ReportRating.section_id,
                Report.hostel,
                func.avg(cast(ReportRating.rating, Integer)).label("avg"),
            )
            .join(Report, Report.id == ReportRating.report_id)
            .where(
                Report.date >= week_start,
                Report.date <= week_end,
                ReportRating.rating.in_(("1", "2", "3", "4")),
            )
            .group_by(ReportRating.section_id, Report.hostel)
        )
    ).all()

    numeric_overall = (
        await db.execute(
            select(
                ReportRating.section_id,
                func.avg(cast(ReportRating.rating, Integer)).label("avg"),
            )
            .join(Report, Report.id == ReportRating.report_id)
            .where(
                Report.date >= week_start,
                Report.date <= week_end,
                ReportRating.rating.in_(("1", "2", "3", "4")),
            )
            .group_by(ReportRating.section_id)
        )
    ).all()

    dist_rows = (
        await db.execute(
            select(
                ReportRating.section_id,
                ReportRating.rating,
                func.count(ReportRating.id).label("n"),
            )
            .join(Report, Report.id == ReportRating.report_id)
            .where(
                Report.date >= week_start,
                Report.date <= week_end,
                ReportRating.rating.in_(RATING_VALUES),
            )
            .group_by(ReportRating.section_id, ReportRating.rating)
        )
    ).all()

    cell_rows = (
        await db.execute(
            select(
                ReportRating.section_id,
                ReportRating.rating,
                func.count(ReportRating.id).label("n"),
            )
            .join(Report, Report.id == ReportRating.report_id)
            .where(Report.date >= week_start, Report.date <= week_end)
            .group_by(ReportRating.section_id, ReportRating.rating)
        )
    ).all()

    avg_by_section = {row.section_id: row.avg for row in numeric_overall}
    avg_by_section_hostel: dict = {}
    for row in numeric_rows:
        avg_by_section_hostel.setdefault(row.section_id, {})[row.hostel] = row.avg

    dist_by_section: dict = {}
    for row in dist_rows:
        dist_by_section.setdefault(row.section_id, {})[row.rating] = row.n

    cells_by_section: dict = {}
    for row in cell_rows:
        cells_by_section.setdefault(row.section_id, {})[row.rating] = row.n

    sections = []
    for section_id in _SECTION_ORDER:
        hostel_avgs = avg_by_section_hostel.get(section_id, {})
        dist = dist_by_section.get(section_id, {})
        cells = cells_by_section.get(section_id, {})

        rated = sum(dist.values())
        unrated = sum(
            n for rating, n in cells.items() if rating not in RATING_VALUES
        )

        sections.append(
            {
                "section_id": section_id,
                "avg": {
                    "overall": (
                        round(avg_by_section[section_id], 2)
                        if section_id in avg_by_section
                        else None
                    ),
                    "putera": (
                        round(hostel_avgs["Asrama Putera"], 2)
                        if "Asrama Putera" in hostel_avgs
                        else None
                    ),
                    "puteri": (
                        round(hostel_avgs["Asrama Puteri"], 2)
                        if "Asrama Puteri" in hostel_avgs
                        else None
                    ),
                },
                "distribution": {value: dist.get(value, 0) for value in RATING_VALUES},
                "unrated": unrated,
                "total": rated + unrated,
            }
        )

    return sections
