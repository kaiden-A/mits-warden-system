from datetime import date

from pydantic import BaseModel


class StatusCounts(BaseModel):
    draft: int = 0
    submitted: int = 0
    reviewed: int = 0
    flagged: int = 0


class WeekDay(BaseModel):
    date: date
    status_counts: StatusCounts
    late: int = 0
    total: int = 0


class SectionAvg(BaseModel):
    overall: float | None = None
    putera: float | None = None
    puteri: float | None = None


class SectionRatings(BaseModel):
    section_id: str
    avg: SectionAvg
    distribution: dict[str, int] = {}
    unrated: int = 0
    total: int = 0


class AnalyticsResponse(BaseModel):
    week_start: date
    week: list[WeekDay]
    sections: list[SectionRatings]
