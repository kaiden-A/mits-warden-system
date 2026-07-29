import uuid
from datetime import date

from pydantic import BaseModel, field_validator


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
