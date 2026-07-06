from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class WorldSceneCreate(BaseModel):
    name: str
    description: str = ""
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    era: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    is_public: bool = False


class WorldSceneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    era: Optional[str] = None
    tags: Optional[List[str]] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    is_public: Optional[bool] = None


class WorldSceneNodeResponse(BaseModel):
    id: UUID
    title: str
    description: str = ""
    is_anchor: bool = False
    sort_order: int = 0
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    trigger_condition: Optional[dict] = None
    effects: Optional[dict] = None

    class Config:
        from_attributes = True


class WorldSceneResponse(BaseModel):
    id: UUID
    name: str
    description: str
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    era: Optional[str] = None
    tags: List[str] = []
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    image_path: Optional[str] = None
    author_id: str
    is_public: bool
    view_count: int
    created_at: datetime
    updated_at: datetime
    nodes: List[WorldSceneNodeResponse] = []

    class Config:
        from_attributes = True
