from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import ApprovalLog, Report, ReportRating
from app.models.roster import Roster
from app.models.user import User
from app.services.email_service import notify_substitution


async def create_report(
    report_data: dict,
    ratings_data: dict | None,
    current_user: User,
    db: AsyncSession,
) -> Report:
    report_date = report_data["date"]
    hostel = current_user.hostel

    if not hostel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pentadbir tidak boleh mencipta laporan.",
        )

    existing = await db.execute(
        select(Report).where(
            Report.date == report_date, Report.hostel == hostel
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Laporan sudah wujud untuk tarikh dan asrama ini.",
        )

    roster_result = await db.execute(
        select(Roster).where(Roster.date == report_date)
    )
    roster_entry = roster_result.scalar_one_or_none()

    if not roster_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tiada jadual warden untuk tarikh ini. Sila hubungi pentadbir.",
        )

    if hostel == "Asrama Putera":
        duty_warden_id = roster_entry.putera_warden_id
    else:
        duty_warden_id = roster_entry.puteri_warden_id

    is_substitution = current_user.id != duty_warden_id

    report = Report(
        date=report_date,
        hostel=hostel,
        submitted_by=current_user.id,
        duty_warden_id=duty_warden_id,
        is_substitution=is_substitution,
        inspection_time=report_data.get("inspection_time"),
        status=report_data.get("status", "draft"),
        aduan_kerosakan=report_data.get("aduan_kerosakan", "TKD"),
        murid_sakit=report_data.get("murid_sakit", "TLB"),
        kawalan_keselamatan=report_data.get("kawalan_keselamatan"),
        catatan_tambahan=report_data.get("catatan_tambahan", ""),
    )

    if report.status == "submitted":
        now = datetime.now(timezone.utc)
        report.submitted_at = now

    db.add(report)
    await db.flush()

    db.add(
        ApprovalLog(
            report_id=report.id,
            user_id=current_user.id,
            action="created",
        )
    )

    if report.status == "submitted":
        db.add(
            ApprovalLog(
                report_id=report.id,
                user_id=current_user.id,
                action="submitted",
            )
        )

    if ratings_data:
        for section_id, items in ratings_data.items():
            if items:
                for item_key, rating in items.items():
                    db.add(
                        ReportRating(
                            report_id=report.id,
                            section_id=section_id,
                            item_key=item_key,
                            rating=rating if rating else None,
                        )
                    )

    await db.commit()
    await db.refresh(report)

    if report.is_substitution and report.status == "submitted":
        duty_warden = await db.get(User, report.duty_warden_id)
        if duty_warden:
            await notify_substitution(
                to_email=duty_warden.email,
                duty_warden_name=duty_warden.name,
                submitted_by_name=current_user.name,
                date=report.date.isoformat(),
                hostel=report.hostel,
            )

    return report


async def update_report(
    report_id: str,
    update_data: dict,
    ratings_data: dict | None,
    current_user: User,
    db: AsyncSession,
) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    if report.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hanya laporan draf boleh disunting.",
        )

    if report.submitted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda hanya boleh menyunting laporan sendiri.",
        )

    for field in (
        "inspection_time",
        "aduan_kerosakan",
        "murid_sakit",
        "kawalan_keselamatan",
        "catatan_tambahan",
    ):
        if field in update_data:
            setattr(report, field, update_data[field])

    if ratings_data:
        await db.execute(
            select(ReportRating).where(
                ReportRating.report_id == report.id
            )
        )
        existing_ratings = (
            await db.execute(
                select(ReportRating).where(
                    ReportRating.report_id == report.id
                )
            )
        ).scalars().all()

        for rating in existing_ratings:
            await db.delete(rating)

        await db.flush()

        for section_id, items in ratings_data.items():
            if items:
                for item_key, rating in items.items():
                    db.add(
                        ReportRating(
                            report_id=report.id,
                            section_id=section_id,
                            item_key=item_key,
                            rating=rating if rating else None,
                        )
                    )

    await db.commit()
    await db.refresh(report)
    return report


async def submit_report(
    report_id: str,
    current_user: User,
    db: AsyncSession,
) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    if report.submitted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda hanya boleh menghantar laporan sendiri.",
        )

    if report.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hanya laporan draf boleh dihantar.",
        )

    report.status = "submitted"
    report.submitted_at = datetime.now(timezone.utc)

    db.add(
        ApprovalLog(
            report_id=report.id,
            user_id=current_user.id,
            action="submitted",
        )
    )
    await db.commit()
    await db.refresh(report)

    if report.is_substitution:
        duty_warden = await db.get(User, report.duty_warden_id)
        if duty_warden:
            await notify_substitution(
                to_email=duty_warden.email,
                duty_warden_name=duty_warden.name,
                submitted_by_name=current_user.name,
                date=report.date.isoformat(),
                hostel=report.hostel,
            )

    return report


async def review_report(
    report_id: str,
    admin_note: str,
    current_user: User,
    db: AsyncSession,
) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    if report.status not in ("submitted", "flagged"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Laporan mesti dalam status dihantar atau ditanda untuk disemak.",
        )

    report.status = "reviewed"
    report.reviewed_by = current_user.id
    report.reviewed_at = datetime.now(timezone.utc)
    if admin_note:
        report.admin_note = admin_note

    db.add(
        ApprovalLog(
            report_id=report.id,
            user_id=current_user.id,
            action="reviewed",
            note=admin_note,
        )
    )
    await db.commit()
    await db.refresh(report)
    return report


async def flag_report(
    report_id: str,
    admin_note: str,
    current_user: User,
    db: AsyncSession,
) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    if report.status == "reviewed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Laporan yang telah disemak tidak boleh ditanda semula.",
        )

    report.status = "flagged"
    report.flagged_by = current_user.id
    report.flagged_at = datetime.now(timezone.utc)
    if admin_note:
        report.admin_note = admin_note

    db.add(
        ApprovalLog(
            report_id=report.id,
            user_id=current_user.id,
            action="flagged",
            note=admin_note,
        )
    )
    await db.commit()
    await db.refresh(report)
    return report
