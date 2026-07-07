from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern="^(project|character|asset)$")
    target_id: str = Field(..., min_length=1, max_length=64)
    reason: str = Field(..., min_length=3, max_length=2000)
    reporter_token: Optional[str] = Field(None, max_length=128)


class ReportResponse(BaseModel):
    id: UUID
    target_type: str
    target_id: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True
