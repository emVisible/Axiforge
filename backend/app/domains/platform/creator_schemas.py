"""Creator dashboard response schemas."""

from typing import List

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
    pending_reports: int = 0
    trend: List[TrendPoint] = Field(default_factory=list)
