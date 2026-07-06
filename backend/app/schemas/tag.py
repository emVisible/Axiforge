from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class TagResponse(BaseModel):
    id: UUID
    name: str
    color: str
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True
