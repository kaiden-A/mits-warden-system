import uuid
from datetime import date, datetime

from pydantic import BaseModel, field_validator, model_validator


class WardenAssignment(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class TodayRoster(BaseModel):
    date: date
    day: str
    putera: WardenAssignment | None = None
    puteri: WardenAssignment | None = None

    model_config = {"from_attributes": True}


class RosterDayAssignment(BaseModel):
    date: date
    putera_warden_id: uuid.UUID
    puteri_warden_id: uuid.UUID


class RosterUpdate(BaseModel):
    week_start: date
    assignments: list[RosterDayAssignment]

    @field_validator("assignments")
    @classmethod
    def validate_assignments(cls, v: list[RosterDayAssignment]) -> list[RosterDayAssignment]:
        if len(v) != 7:
            raise ValueError("exactly 7 assignments required (one per day)")
        return v


class RosterDayRead(BaseModel):
    date: date
    day: str
    putera: WardenAssignment | None = None
    puteri: WardenAssignment | None = None

    model_config = {"from_attributes": True}


class RosterRead(BaseModel):
    week_start: date
    days: list[RosterDayRead]

    model_config = {"from_attributes": True}


class WardenPairIn(BaseModel):
    name: str
    putera_warden_id: uuid.UUID
    puteri_warden_id: uuid.UUID


class ExcludedDateIn(BaseModel):
    date: date
    reason: str = "Cuti"


class RosterCycleCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    pairs: list[WardenPairIn]
    excluded_dates: list[ExcludedDateIn] = []


class RosterCycleExcludedUpdate(BaseModel):
    excluded_dates: list[ExcludedDateIn] = []


class RosterCycleEntryUpdate(BaseModel):
    putera_warden_id: uuid.UUID | None = None
    puteri_warden_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def at_least_one_warden(self):
        if self.putera_warden_id is None and self.puteri_warden_id is None:
            raise ValueError("sekurang-kurangnya satu warden diperlukan")
        return self


class RosterCycleOverride(RosterCycleEntryUpdate):
    date: date


class RosterCycleGenerate(BaseModel):
    overrides: list[RosterCycleOverride] = []


class RosterCycleSummary(BaseModel):
    id: uuid.UUID
    name: str
    start_date: date
    end_date: date
    pairs: list[dict]
    excluded_dates: list[dict]
    status: str
    created_at: datetime
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class RosterCycleEntryRead(BaseModel):
    id: uuid.UUID
    date: date
    pair_name: str | None = None
    putera: WardenAssignment | None = None
    puteri: WardenAssignment | None = None

    model_config = {"from_attributes": True}


class RosterCycleDetail(RosterCycleSummary):
    entries: list[RosterCycleEntryRead] = []
