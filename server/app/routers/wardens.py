from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.report import Report
from app.models.user import User
from app.schemas.user import UserCreate, UserStatusUpdate, WardenListItem, WardenListResponse
from app.services.email_service import notify_warden_created
from app.utils.security import hash_password

router = APIRouter(prefix="/wardens", tags=["wardens"])


@router.get("", response_model=WardenListResponse)
async def list_wardens(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).where(User.role == "warden").order_by(User.name)
    )
    wardens = result.scalars().all()

    items = []
    for warden in wardens:
        report_count_result = await db.execute(
            select(func.count(Report.id)).where(
                Report.submitted_by == warden.id
            )
        )
        report_count = report_count_result.scalar() or 0

        last_submission_result = await db.execute(
            select(Report.submitted_at)
            .where(Report.submitted_by == warden.id)
            .order_by(Report.submitted_at.desc())
            .limit(1)
        )
        last_submission = last_submission_result.scalar_one_or_none()

        items.append(
            WardenListItem(
                id=warden.id,
                email=warden.email,
                name=warden.name,
                hostel=warden.hostel,
                status=warden.status,
                report_count=report_count,
                last_submission=last_submission,
            )
        )

    return WardenListResponse(wardens=items)


@router.post("", response_model=WardenListItem)
async def create_warden(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Emel ini sudah didaftarkan dalam sistem.",
        )

    password = body.password or "changeme123"
    user = User(
        email=body.email,
        password_hash=hash_password(password),
        name=body.name,
        role="warden",
        hostel=body.hostel,
        must_change_password=body.password is None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await notify_warden_created(
        to_email=user.email,
        name=user.name,
        hostel=user.hostel or "",
        password=password,
    )

    return WardenListItem(
        id=user.id,
        email=user.email,
        name=user.name,
        hostel=user.hostel,
        status=user.status,
    )


@router.patch("/{user_id}/status", response_model=WardenListItem)
async def update_warden_status(
    user_id: str,
    body: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if body.status not in ("active", "revoked"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status tidak sah. Gunakan 'active' atau 'revoked'.",
        )

    user.status = body.status
    await db.commit()
    await db.refresh(user)

    return WardenListItem(
        id=user.id,
        email=user.email,
        name=user.name,
        hostel=user.hostel,
        status=user.status,
    )
