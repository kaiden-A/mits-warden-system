import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, field_validator


class RatingItem(BaseModel):
    section_id: str
    item_key: str
    rating: str | None = None


class RatingsMap(BaseModel):
    rutinAktivitiMurid: dict[str, str] | None = None
    tarbiyyahRohaniyyah: dict[str, str] | None = None
    kebersihanArasBawah: dict[str, str] | None = None
    kebersihanAras1: dict[str, str] | None = None
    kebersihanAras2: dict[str, str] | None = None
    kebersihanAras3: dict[str, str] | None = None
    dewanMakan: dict[str, str] | None = None


class UserBrief(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class ApprovalLogEntry(BaseModel):
    action: str
    user: str
    at: datetime

    model_config = {"from_attributes": True}


class ReportCreate(BaseModel):
    date: date
    inspection_time: time | None = None
    status: str = "draft"
    ratings: RatingsMap | None = None
    aduan_kerosakan: str = "TKD"
    murid_sakit: str = "TLB"
    kawalan_keselamatan: int | None = None
    catatan_tambahan: str = ""

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("draft", "submitted"):
            raise ValueError("status must be 'draft' or 'submitted'")
        return v

    @field_validator("kawalan_keselamatan")
    @classmethod
    def validate_security(cls, v: int | None) -> int | None:
        if v is not None and not 1 <= v <= 5:
            raise ValueError("kawalan_keselamatan must be between 1 and 5")
        return v


class ReportUpdate(BaseModel):
    inspection_time: time | None = None
    ratings: RatingsMap | None = None
    aduan_kerosakan: str | None = None
    murid_sakit: str | None = None
    kawalan_keselamatan: int | None = None
    catatan_tambahan: str | None = None

    @field_validator("kawalan_keselamatan")
    @classmethod
    def validate_security(cls, v: int | None) -> int | None:
        if v is not None and not 1 <= v <= 5:
            raise ValueError("kawalan_keselamatan must be between 1 and 5")
        return v


class ReportRead(BaseModel):
    id: uuid.UUID
    date: date
    hostel: str
    status: str
    submitted_by: UserBrief | None = None
    duty_warden: UserBrief | None = None
    is_substitution: bool = False
    is_late: bool = False
    inspection_time: time | None = None
    submitted_at: datetime | None = None
    reviewed_by: UserBrief | None = None
    reviewed_at: datetime | None = None
    flagged_by: UserBrief | None = None
    flagged_at: datetime | None = None
    admin_note: str = ""
    ratings: RatingsMap | None = None
    aduan_kerosakan: str = "TKD"
    murid_sakit: str = "TLB"
    kawalan_keselamatan: int | None = None
    catatan_tambahan: str = ""
    approval_trail: list[ApprovalLogEntry] = []

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    id: uuid.UUID
    date: date
    hostel: str
    status: str
    submitted_by_name: str = ""
    duty_warden_name: str = ""
    is_substitution: bool = False
    is_late: bool = False
    inspection_time: time | None = None
    submitted_at: datetime | None = None
    aduan_kerosakan: str = "TKD"
    murid_sakit: str = "TLB"
    rated_sections: int = 0

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    admin_note: str = ""


class FlagRequest(BaseModel):
    admin_note: str = ""
