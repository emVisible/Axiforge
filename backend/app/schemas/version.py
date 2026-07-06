from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class VersionResponse(BaseModel):
    id: UUID
    character_id: UUID
    version_number: int
    name: str
    tags: List[str] = []
    change_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VersionDetailResponse(VersionResponse):
    character_data: dict


class RollbackRequest(BaseModel):
    change_summary: Optional[str] = None