"""Comment API schemas."""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


ContentType = Literal["project", "character", "item", "scene"]
CommentSort = Literal["recent", "hot"]


class CommentCreate(BaseModel):
    content_type: ContentType
    content_id: str = Field(..., min_length=1, max_length=64)
    author_id: str = Field(..., min_length=8, max_length=128)
    body: str = Field(..., min_length=1, max_length=4000)
    parent_id: Optional[UUID] = None


class CommentResponse(BaseModel):
    id: UUID
    content_type: str
    content_id: str
    author_id: str
    body: str
    parent_id: Optional[UUID] = None
    root_id: Optional[UUID] = None
    status: str
    like_count: int
    reply_count: int
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    items: List[CommentResponse]
    total: int


class CommentReportRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=2000)
    reporter_token: Optional[str] = Field(None, max_length=128)
