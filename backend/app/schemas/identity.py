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
