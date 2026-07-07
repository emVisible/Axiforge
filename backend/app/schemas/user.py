from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class UserSessionRequest(BaseModel):
    creator_id: str = Field(..., min_length=8, max_length=128)
    player_token: str = Field(..., min_length=8, max_length=128)


class UserProfileUpdate(BaseModel):
    creator_id: str = Field(..., min_length=8, max_length=128)
    player_token: str = Field(..., min_length=8, max_length=128)
    email: Optional[str] = Field(
        None, min_length=3, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )
    display_name: Optional[str] = Field(None, min_length=1, max_length=64)


class UserProfileResponse(BaseModel):
    id: str
    creator_id: str
    player_token: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResolveResponse(BaseModel):
    email: str
    profiles: List[UserProfileResponse]
