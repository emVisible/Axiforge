"""Nexus API schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = ""
    body: str = ""
    tags: List[str] = Field(default_factory=list)
    links: List[str] = Field(default_factory=list)
    status: str = "inbox"
    related_characters: List[str] = Field(default_factory=list)
    related_projects: List[str] = Field(default_factory=list)
    author_id: str = Field(..., min_length=8)


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[List[str]] = None
    links: Optional[List[str]] = None
    status: Optional[str] = None
    related_characters: Optional[List[str]] = None
    related_projects: Optional[List[str]] = None


class NoteResponse(BaseModel):
    id: UUID
    author_id: str
    title: str
    body: str
    tags: List[str]
    links: List[str]
    status: str
    related_characters: List[str]
    related_projects: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DistributeRequest(BaseModel):
    author_id: str = Field(..., min_length=8)
    note_id: UUID
    target_type: str = Field(..., pattern="^(character|project)$")
    target_id: str = Field(..., min_length=1)
    field: str = "notes"


class DistributeResponse(BaseModel):
    ok: bool
    message: str
