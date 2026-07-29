import uuid
from datetime import date

from pydantic import BaseModel


class UserBrief(BaseModel):
    id: uuid.UUID
    name: str
    hostel: str | None = None

    model_config = {"from_attributes": True}


class WardenStats(BaseModel):
    total_reports: int = 0
    submitted_this_week: int = 0
    reviewed_total: int = 0


class TodayBrief(BaseModel):
    date: date
    day: str
    duty_warden: UserBrief | None = None
    is_user_on_duty: bool = False
    report: str | None = None


class WeekDayReport(BaseModel):
    status: str | None = None


class WeekRecapDayHostel(BaseModel):
    duty_warden: UserBrief | None = None
    report: dict | None = None


class WeekRecapDay(BaseModel):
    date: date
    day: str
    putera: WeekRecapDayHostel | None = None
    puteri: WeekRecapDayHostel | None = None


class WeekProgress(BaseModel):
    date: date
    status: str


class WardenDashboard(BaseModel):
    user: UserBrief
    stats: WardenStats
    today: TodayBrief | None = None
    week_recap: list[WeekRecapDay] = []
    week_progress: list[WeekProgress] = []


class AdminStats(BaseModel):
    active_wardens: int = 0
    pending_review_this_week: int = 0
    reviewed_this_week: int = 0
    flagged_total: int = 0


class RecentEntry(BaseModel):
    id: uuid.UUID
    date: date
    hostel: str
    warden_name: str
    status: str
    inspection_time: str | None = None

    model_config = {"from_attributes": True}


class AdminDashboard(BaseModel):
    stats: AdminStats
    recent_entries: list[RecentEntry] = []
