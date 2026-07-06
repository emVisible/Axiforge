from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class StoryCreate(BaseModel):
    title: str = Field(..., max_length=255)
    content: str = Field(default="")


class StoryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    sort_order: Optional[int] = None


class StoryResponse(BaseModel):
    id: UUID
    character_id: UUID
    title: str
    content: str
    word_count: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StoryListResponse(BaseModel):
    id: UUID
    title: str
    word_count: int
    sort_order: int
    updated_at: datetime

    class Config:
        from_attributes = True