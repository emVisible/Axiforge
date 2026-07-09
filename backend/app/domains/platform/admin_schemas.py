"""Admin API schemas."""

from datetime import datetime
from typing import Any, Generic, List, Literal, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

ItemT = TypeVar("ItemT")


class PaginatedResponse(BaseModel, Generic[ItemT]):
    items: List[ItemT]
    total: int


class ModerationTargetPreview(BaseModel):
    title: str
    excerpt: str = ""
    author_id: Optional[str] = None
    author_display: Optional[str] = None
    author_strike_count: int = 0
    author_is_banned: bool = False
    content_status: Optional[str] = None
    is_public: Optional[bool] = None
    cover_image: Optional[str] = None
    discover_path: Optional[str] = None
    parent_title: Optional[str] = None
    parent_path: Optional[str] = None
    exists: bool = False
    violation_count: int = 0


class AdminCommentSnippet(BaseModel):
    id: str
    author_id: str
    body: str
    status: str
    created_at: datetime


class AuthorModerationProfile(BaseModel):
    user_id: Optional[str] = None
    creator_id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    strike_count: int = 0
    is_banned: bool = False
    project_count: int = 0
    character_count: int = 0
    violation_count: int = 0


class ModerationContextResponse(BaseModel):
    target_preview: ModerationTargetPreview
    related_comments: List[AdminCommentSnippet] = Field(default_factory=list)
    author_profile: Optional[AuthorModerationProfile] = None


class AdminReportResponse(BaseModel):
    id: UUID
    target_type: str
    target_id: str
    reason: str
    status: str
    reporter_token: Optional[str] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    target_preview: ModerationTargetPreview

    class Config:
        from_attributes = True


class ReportResolveRequest(BaseModel):
    action: Literal["dismiss", "take_down"]
    note: Optional[str] = Field(None, max_length=2000)
    resolve_siblings: bool = True


class AdminUserResponse(BaseModel):
    id: str
    creator_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    role: str
    is_banned: bool
    strike_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdminProjectResponse(BaseModel):
    id: str
    title: str
    author_id: str
    is_public: bool
    content_status: str
    view_count: int
    play_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdminCharacterResponse(BaseModel):
    id: str
    name: str
    author_id: str
    is_public: bool
    content_status: str
    view_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ContentStatusUpdate(BaseModel):
    content_status: Literal["draft", "published", "taken_down"]


class UserBanUpdate(BaseModel):
    is_banned: bool
    note: Optional[str] = None


class UserStrikeUpdate(BaseModel):
    strike_count: int = Field(0, ge=0, le=99)
    note: Optional[str] = None


class AdminViolationResponse(BaseModel):
    id: UUID
    subject_type: str
    subject_id: str
    clause: str
    note: Optional[str] = None
    actor: str
    author_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: UUID
    action: str
    actor: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    detail: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    pending_reports: int
    total_users: int
    public_projects: int
    public_characters: int
    taken_down_projects: int
    banned_users: int
    story_plays_7d: int = 0
    project_forks_7d: int = 0
    violations_7d: int = 0
    total_projects: int = 0
    authors_with_projects: int = 0
    played_projects_7d: int = 0
    upload_bytes: int = 0
    upload_files: int = 0
    top_projects: list["DashboardTopProject"] = []


class DashboardTopProject(BaseModel):
    id: str
    title: str
    play_count: int
    view_count: int = 0
