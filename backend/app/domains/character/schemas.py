# --- from schemas/character.py ---
from __future__ import annotations

from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


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
    # 表情差分组（桥5）：{ 表情key: 图片路径 }，供演出 show(char, expr) 直连立绘
    sprites: Optional[Dict[str, str]] = None


class CharacterCreate(BaseModel):
    character_data: CharacterData
    is_public: bool = False
    image_path: Optional[str] = None
    author_id: str = Field("anonymous", max_length=255)


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

# --- from schemas/story.py ---
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class StoryCreate(BaseModel):
    title: str = Field(..., max_length=255)
    content: str = Field(default="")


class StoryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    sort_order: Optional[int] = None


class StoryResponse(BaseModel):
    id: UUID
    character_id: UUID
    title: str
    content: str
    word_count: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StoryListResponse(BaseModel):
    id: UUID
    title: str
    word_count: int
    sort_order: int
    updated_at: datetime

    class Config:
        from_attributes = True

# --- from schemas/relation.py ---
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class RelationCreate(BaseModel):
    target_id: UUID
    relation_name: str = Field(..., max_length=50)
    relation_type: str = Field("custom", pattern="^(preset|custom)$")
    description: Optional[str] = Field(None)
    is_mutual: bool = False


class RelationUpdate(BaseModel):
    relation_name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    is_mutual: Optional[bool] = None


class RelationTarget(BaseModel):
    id: UUID
    name: str
    essence: Optional[str] = None


class RelationResponse(BaseModel):
    id: str
    source_id: str
    target_id: str
    target_name: str
    target_essence: Optional[str] = None
    relation_name: str
    relation_type: str
    description: Optional[str] = None
    is_mutual: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RelationGraphNode(BaseModel):
    id: str
    name: str
    essence: Optional[str] = None
    is_center: bool = False


class RelationGraphLink(BaseModel):
    source: str
    target: str
    relation_name: str
    is_mutual: bool


class RelationGraphResponse(BaseModel):
    nodes: List[RelationGraphNode]
    links: List[RelationGraphLink]


class PresetRelation(BaseModel):
    name: str
    category: str
    mutual: bool

# --- from schemas/version.py ---
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class VersionResponse(BaseModel):
    id: UUID
    character_id: UUID
    version_number: int
    name: str
    tags: List[str] = []
    change_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VersionDetailResponse(VersionResponse):
    character_data: dict


class RollbackRequest(BaseModel):
    change_summary: Optional[str] = None

# --- from schemas/tag.py ---
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class TagResponse(BaseModel):
    id: UUID
    name: str
    color: str
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True
