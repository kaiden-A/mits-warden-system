from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.report import ApprovalLog, Report, ReportRating
from app.models.user import User
from app.schemas.report import (
    FlagRequest,
    ReportCreate,
    ReportListItem,
    ReportRead,
    ReportUpdate,
    ReviewRequest,
)
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])

SECTION_ITEM_KEYS = {
    "rutinAktivitiMurid": [
        "halaqahQuran", "rollCall", "riadhah", "muraqabah", "prep",
        "tabassam", "melawat", "gotongRoyong", "tidur",
    ],
    "tarbiyyahRohaniyyah": [
        "qiamullail", "kuliahSubuh", "subuh", "zohor", "asar",
        "azkarMaghrib", "kuliahMaghrib", "isya", "usrahMurid", "bacaanAlMulk",
    ],
    "kebersihanArasBawah": [
        "lobi", "musolla", "storSukan", "storKebersihan", "bilikDobi",
        "bilikIsolasi", "bilikICT", "tandas", "ampaiBaju",
    ],
    "kebersihanAras1": [
        "bilikDorm", "koridor", "bilikPantri", "tandas", "bilikPrep",
        "bilikIron", "bilikRekreasi",
    ],
    "kebersihanAras2": [
        "bilikDorm", "koridor", "bilikPantri", "tandas", "bilikPrep",
        "bilikIron", "bilikRekreasi",
    ],
    "kebersihanAras3": [
        "bilikDorm", "koridor", "bilikPantri", "tandas", "bilikPrep",
        "bilikIron", "bilikRekreasi",
    ],
    "dewanMakan": [
        "sarapan", "minumPagi", "makanTengahari", "minumPetang",
        "makanMalam", "minumMalam",
    ],
}


def _build_ratings_map(ratings: list[ReportRating]) -> dict:
    result = {}
    for r in ratings:
        if r.section_id not in result:
            result[r.section_id] = {}
        result[r.section_id][r.item_key] = r.rating or ""
    return result


def _build_report_read(report: Report, ratings: list[ReportRating], logs: list[ApprovalLog]) -> ReportRead:
    submitter = {"id": report.submitted_by, "name": ""}
    duty_warden = {"id": report.duty_warden_id, "name": ""}
    reviewer = None
    flagger = None

    return ReportRead(
        id=report.id,
        date=report.date,
        hostel=report.hostel,
        status=report.status,
        submitted_by=None,
        duty_warden=None,
        is_substitution=report.is_substitution,
        inspection_time=report.inspection_time,
        submitted_at=report.submitted_at,
        reviewed_by=None,
        reviewed_at=report.reviewed_at,
        flagged_by=None,
        flagged_at=report.flagged_at,
        admin_note=report.admin_note or "",
        ratings=_build_ratings_map(ratings),
        aduan_kerosakan=report.aduan_kerosakan or "TKD",
        murid_sakit=report.murid_sakit or "TLB",
        kawalan_keselamatan=report.kawalan_keselamatan,
        catatan_tambahan=report.catatan_tambahan or "",
        approval_trail=[
            {
                "action": log.action,
                "user": str(log.user_id),
                "at": log.created_at,
            }
            for log in logs
        ],
    )


@router.get("", response_model=list[ReportListItem])
async def list_reports(
    week_start: date = Query(default=None),
    hostel: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    if not week_start:
        week_start = today - timedelta(days=today.weekday())

    query = select(Report)

    if current_user.role == "warden":
        query = query.where(Report.hostel == current_user.hostel)

    if hostel:
        query = query.where(Report.hostel == hostel)

    if status:
        query = query.where(Report.status == status)

    week_end = week_start + timedelta(days=6)
    query = query.where(
        Report.date >= week_start, Report.date <= week_end
    )

    query = query.order_by(Report.date.desc(), Report.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    reports = result.scalars().all()

    items = []
    for report in reports:
        submitter = await db.get(User, report.submitted_by)
        duty_warden = await db.get(User, report.duty_warden_id)
        items.append(
            ReportListItem(
                id=report.id,
                date=report.date,
                hostel=report.hostel,
                status=report.status,
                submitted_by_name=submitter.name if submitter else "",
                duty_warden_name=duty_warden.name if duty_warden else "",
                is_substitution=report.is_substitution,
                inspection_time=report.inspection_time,
                submitted_at=report.submitted_at,
            )
        )

    return items


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report)
        .where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    ratings_result = await db.execute(
        select(ReportRating).where(
            ReportRating.report_id == report.id
        )
    )
    ratings = ratings_result.scalars().all()

    logs_result = await db.execute(
        select(ApprovalLog)
        .where(ApprovalLog.report_id == report.id)
        .order_by(ApprovalLog.created_at)
    )
    logs = logs_result.scalars().all()

    ratings_map = _build_ratings_map(ratings)

    submitter = await db.get(User, report.submitted_by)
    duty_warden = await db.get(User, report.duty_warden_id)
    reviewer = await db.get(User, report.reviewed_by) if report.reviewed_by else None
    flagger = await db.get(User, report.flagged_by) if report.flagged_by else None

    return ReportRead(
        id=report.id,
        date=report.date,
        hostel=report.hostel,
        status=report.status,
        submitted_by={"id": submitter.id, "name": submitter.name} if submitter else None,
        duty_warden={"id": duty_warden.id, "name": duty_warden.name} if duty_warden else None,
        is_substitution=report.is_substitution,
        inspection_time=report.inspection_time,
        submitted_at=report.submitted_at,
        reviewed_by={"id": reviewer.id, "name": reviewer.name} if reviewer else None,
        reviewed_at=report.reviewed_at,
        flagged_by={"id": flagger.id, "name": flagger.name} if flagger else None,
        flagged_at=report.flagged_at,
        admin_note=report.admin_note or "",
        ratings=ratings_map,
        aduan_kerosakan=report.aduan_kerosakan or "TKD",
        murid_sakit=report.murid_sakit or "TLB",
        kawalan_keselamatan=report.kawalan_keselamatan,
        catatan_tambahan=report.catatan_tambahan or "",
        approval_trail=[
            {
                "action": log.action,
                "user": str(log.user_id),
                "at": log.created_at,
            }
            for log in logs
        ],
    )


@router.post("", response_model=ReportRead, status_code=201)
async def create_report(
    body: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "warden":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only wardens can create reports",
        )

    report = await report_service.create_report(
        body.model_dump(exclude={"ratings"}),
        body.ratings.model_dump(exclude_none=True) if body.ratings else None,
        current_user,
        db,
    )

    return await get_report(str(report.id), db, current_user)


@router.patch("/{report_id}", response_model=ReportRead)
async def update_report(
    report_id: str,
    body: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await report_service.update_report(
        report_id,
        body.model_dump(exclude={"ratings"}, exclude_none=True),
        body.ratings.model_dump(exclude_none=True) if body.ratings else None,
        current_user,
        db,
    )

    return await get_report(report_id, db, current_user)


@router.post("/{report_id}/submit", response_model=ReportRead)
async def submit_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await report_service.submit_report(report_id, current_user, db)
    return await get_report(report_id, db, current_user)


@router.post("/{report_id}/review", response_model=ReportRead)
async def review_report(
    report_id: str,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    await report_service.review_report(
        report_id, body.admin_note, current_user, db
    )
    return await get_report(report_id, db, current_user)


@router.post("/{report_id}/flag", response_model=ReportRead)
async def flag_report(
    report_id: str,
    body: FlagRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    await report_service.flag_report(
        report_id, body.admin_note, current_user, db
    )
    return await get_report(report_id, db, current_user)
