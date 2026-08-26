from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.user import UserRead


class FoundationStatus(BaseModel):
    api: Literal["online"] = "online"
    database: Literal["connected"] = "connected"
    authentication: Literal["active"] = "active"


class ModuleStatus(BaseModel):
    name: str
    phase: int
    status: Literal["planned"] = "planned"


class DashboardSummary(BaseModel):
    user: UserRead
    foundation: FoundationStatus
    generated_at: datetime
    upcoming_modules: list[ModuleStatus]
