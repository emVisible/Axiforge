"""Achievement API schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AchievementCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=128)
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    icon: str = "star"
    condition: dict = Field(default_factory=dict)
    is_public: bool = False


class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    condition: Optional[dict] = None
    is_public: Optional[bool] = None


class AchievementResponse(BaseModel):
    id: UUID
    project_id: UUID
    key: str
    title: str
    description: str
    icon: str
    condition: dict
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlayerAchievementResponse(BaseModel):
    id: UUID
    achievement_id: UUID
    project_id: UUID
    unlocked_at: datetime
    achievement: Optional[AchievementResponse] = None

    class Config:
        from_attributes = True


class UnlockAchievementRequest(BaseModel):
    player_token: str = Field(..., min_length=8)
    achievement_key: str = Field(..., min_length=1)


class AchievementListResponse(BaseModel):
    items: List[AchievementResponse]
