import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    hostel: Mapped[str] = mapped_column(String(20), nullable=False)

    submitted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    duty_warden_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    is_substitution: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    is_late: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    inspection_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft"
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    flagged_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    flagged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    admin_note: Mapped[str] = mapped_column(Text, default="", server_default="")

    aduan_kerosakan: Mapped[str] = mapped_column(
        Text, default="TKD", server_default="TKD"
    )
    murid_sakit: Mapped[str] = mapped_column(
        Text, default="TLB", server_default="TLB"
    )
    kawalan_keselamatan: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )
    catatan_tambahan: Mapped[str] = mapped_column(
        Text, default="", server_default=""
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    ratings = relationship(
        "ReportRating", back_populates="report", cascade="all, delete-orphan"
    )
    approval_logs = relationship(
        "ApprovalLog", back_populates="report", cascade="all, delete-orphan"
    )
    submitter = relationship("User", foreign_keys=[submitted_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    flagger = relationship("User", foreign_keys=[flagged_by])

    __table_args__ = (
        CheckConstraint(
            "hostel IN ('Asrama Putera', 'Asrama Puteri')",
            name="ck_reports_hostel",
        ),
        CheckConstraint(
            "status IN ('draft', 'submitted', 'reviewed', 'flagged')",
            name="ck_reports_status",
        ),
        CheckConstraint(
            "kawalan_keselamatan BETWEEN 1 AND 5 OR kawalan_keselamatan IS NULL",
            name="ck_reports_security",
        ),
        UniqueConstraint("date", "hostel", name="uq_reports_date_hostel"),
        Index("idx_reports_date", "date"),
        Index("idx_reports_hostel", "hostel"),
        Index("idx_reports_status", "status"),
        Index("idx_reports_submitted_by", "submitted_by"),
        Index("idx_reports_duty_warden", "duty_warden_id"),
    )


class ReportRating(Base):
    __tablename__ = "report_ratings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_id: Mapped[str] = mapped_column(String(50), nullable=False)
    item_key: Mapped[str] = mapped_column(String(50), nullable=False)
    rating: Mapped[str | None] = mapped_column(String(2), nullable=True)

    report = relationship("Report", back_populates="ratings")

    __table_args__ = (
        CheckConstraint(
            "rating IN ('1','2','3','4','NA','') OR rating IS NULL",
            name="ck_ratings_value",
        ),
        UniqueConstraint(
            "report_id", "section_id", "item_key", name="uq_ratings_item"
        ),
        Index("idx_ratings_report", "report_id"),
        Index("idx_ratings_section", "report_id", "section_id"),
    )


class ApprovalLog(Base):
    __tablename__ = "approval_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    report = relationship("Report", back_populates="approval_logs")
    user = relationship("User")

    __table_args__ = (
        CheckConstraint(
            "action IN ('created', 'submitted', 'reviewed', 'flagged')",
            name="ck_approval_action",
        ),
        Index("idx_approval_report", "report_id"),
    )
