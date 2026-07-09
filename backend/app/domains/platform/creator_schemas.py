"""Creator dashboard response schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class ContentCounts(BaseModel):
    projects: int = 0
    characters: int = 0
    items: int = 0
    scenes: int = 0


class PublicPrivateRatio(BaseModel):
    public: int = 0
    private: int = 0


class TrendPoint(BaseModel):
    date: str
    views: int = 0
    plays: int = 0
    forks: int = 0


class CreatorDashboardResponse(BaseModel):
    author_id: str
    counts: ContentCounts
    public_ratio: PublicPrivateRatio
    views_7d: int = 0
    plays_7d: int = 0
    forks_7d: int = 0
    comments_7d: int = 0
    total_comments: int = 0
    pending_reports: int = 0
    trend: List[TrendPoint] = Field(default_factory=list)


class CreatorHubProject(BaseModel):
    id: str
    title: str
    description: str = ""
    cover_image: Optional[str] = None
    view_count: int = 0
    play_count: int = 0
    comment_count: int = 0
    fork_count: int = 0
    is_public: bool = True


class CreatorHubResponse(BaseModel):
    author_id: str
    display_name: Optional[str] = None
    avatar_emoji: Optional[str] = None
    featured_projects: List[CreatorHubProject] = Field(default_factory=list)
    projects: List[CreatorHubProject] = Field(default_factory=list)
    total_views: int = 0
    total_plays: int = 0
    total_comments: int = 0
    forks_7d: int = 0


class FeaturedProjectsUpdate(BaseModel):
    creator_id: str = Field(..., min_length=8)
    project_ids: List[str] = Field(..., max_length=3)
