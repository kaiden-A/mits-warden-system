import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    is_admin: bool = False
    hostel: str | None = None
    status: str

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    hostel: str | None = None
    password: str | None = None


class UserStatusUpdate(BaseModel):
    status: str


class UserAdminUpdate(BaseModel):
    is_admin: bool


class WardenListItem(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_admin: bool = False
    hostel: str | None = None
    status: str
    report_count: int = 0
    last_submission: datetime | None = None

    model_config = {"from_attributes": True}


class WardenListResponse(BaseModel):
    wardens: list[WardenListItem]
