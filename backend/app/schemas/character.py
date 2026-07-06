from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.schemas.tag import TagResponse


# 六层结构保持不变
class Contour(BaseModel):
    appearance: Optional[str] = Field(None)
    age_era: Optional[str] = Field(None)
    identity: Optional[str] = Field(None)
    first_impression: Optional[str] = Field(None)


class Demeanor(BaseModel):
    speech_style: Optional[str] = Field(None)
    habits: Optional[str] = Field(None)
    typical_reaction: Optional[str] = Field(None)
    expressiveness: Optional[str] = Field(None)


class Psyche(BaseModel):
    desire: Optional[str] = Field(None)
    fear: Optional[str] = Field(None)
    conflict: Optional[str] = Field(None)
    self_perception: Optional[str] = Field(None)


class Anchor(BaseModel):
    essence: str = Field("", description="一句话本质概括")
    name: str = Field("", description="姓名/称谓")
    tags: List[str] = Field(default_factory=list, description="标签")
    summary: Optional[str] = Field(None, description="卡片副标题，比essence更短")
    theme: Optional[str] = Field(None)
    core_belief: Optional[str] = Field(None)


class Trace(BaseModel):
    background: Optional[str] = Field(None)
    key_events: List[str] = Field(default_factory=list)
    turning_point: Optional[str] = Field(None)


class Bond(BaseModel):
    attitude_to_others: Optional[str] = Field(None)
    intimate_pattern: Optional[str] = Field(None)
    hostile_pattern: Optional[str] = Field(None)
    group_role: Optional[str] = Field(None)


class CharacterData(BaseModel):
    contour: Contour = Field(default_factory=Contour)
    demeanor: Demeanor = Field(default_factory=Demeanor)
    psyche: Psyche = Field(default_factory=Psyche)
    anchor: Anchor = Field(default_factory=Anchor)
    trace: Trace = Field(default_factory=Trace)
    bond: Bond = Field(default_factory=Bond)


class CharacterCreate(BaseModel):
    character_data: CharacterData
    is_public: bool = False
    image_path: Optional[str] = None


class CharacterUpdate(BaseModel):
    character_data: Optional[CharacterData] = None
    is_public: Optional[bool] = None
    image_path: Optional[str] = None


class CharacterResponse(BaseModel):
    id: UUID
    name: str
    author_id: str
    character_data: Dict[str, Any]
    is_public: bool
    tags: List[TagResponse] = []
    fork_from: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    image_path: Optional[str] = None
    view_count: int = 0

    class Config:
        from_attributes = True


class CharacterForkRequest(BaseModel):
    new_name: Optional[str] = Field(None)
    author_id: str = Field("anonymous")


class CharacterSearchResponse(BaseModel):
    items: List[CharacterResponse]
    total: int
    skip: int
    limit: int


class CharacterExportRequest(BaseModel):
    format: str = Field("markdown", pattern="^(system|plain|markdown|json)$")
    include_stories: bool = False
    include_relations: bool = False
