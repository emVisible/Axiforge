# --- from schemas/user.py ---
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
    avatar_emoji: Optional[str] = Field(None, min_length=1, max_length=16)


class UserProfileResponse(BaseModel):
    id: str
    creator_id: str
    player_token: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_emoji: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuthorPublicResponse(BaseModel):
    creator_id: str
    display_name: Optional[str] = None
    avatar_emoji: Optional[str] = None


class UserResolveResponse(BaseModel):
    email: str
    profiles: List[UserProfileResponse]


class UserDataExportRequest(BaseModel):
    creator_id: str = Field(..., min_length=8, max_length=128)
    player_token: str = Field(..., min_length=8, max_length=128)


class UserDataExportResponse(BaseModel):
    profile: UserProfileResponse
    projects: List[dict]
    characters: List[dict]
    identity_links: List[dict]


class UserAccountDeleteRequest(BaseModel):
    creator_id: str = Field(..., min_length=8, max_length=128)
    player_token: str = Field(..., min_length=8, max_length=128)

# --- from schemas/identity.py ---
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LinkEmailRequest(BaseModel):
    local_id: str = Field(..., min_length=8, max_length=128)
    email: str = Field(..., min_length=3, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    kind: Literal["creator", "player"]


class IdentityLinkResponse(BaseModel):
    id: UUID
    local_id: str
    email: str
    kind: str
    created_at: datetime

    class Config:
        from_attributes = True


class ResolveEmailResponse(BaseModel):
    email: str
    links: List[IdentityLinkResponse]

# --- from schemas/report.py ---
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    target_type: str = Field(
        ..., pattern="^(project|character|asset|item|scene|comment)$"
    )
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
