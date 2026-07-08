# --- from schemas/asset.py ---

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

# ============================================================
# AssetScene
# ============================================================


class AssetSceneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    era: Optional[str] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    tags: List[str] = []
    node_templates: List[dict] = []
    image_path: Optional[str] = None
    author_id: str = "anonymous"
    is_public: bool = False


class AssetSceneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    era: Optional[str] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    tags: Optional[List[str]] = None
    node_templates: Optional[List[dict]] = None
    image_path: Optional[str] = None
    is_public: Optional[bool] = None


class AssetSceneResponse(BaseModel):
    id: UUID
    name: str
    description: str
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    era: Optional[str] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    tags: List[str]
    node_templates: List[dict]
    image_path: Optional[str] = None
    author_id: str
    is_public: bool
    view_count: int
    ref_count: int = 0
    fork_from_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# AssetItem
# ============================================================


class AssetItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: str = "日常"
    rarity: str = "普通"
    mechanism_tags: List[str] = []
    effects: List[str] = []
    image_path: Optional[str] = None
    author_id: str = "anonymous"
    is_public: bool = False


class AssetItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rarity: Optional[str] = None
    mechanism_tags: Optional[List[str]] = None
    effects: Optional[List[str]] = None
    image_path: Optional[str] = None
    is_public: Optional[bool] = None


class AssetItemResponse(BaseModel):
    id: UUID
    name: str
    description: str
    category: str
    rarity: str
    mechanism_tags: List[str]
    effects: List[str]
    image_path: Optional[str] = None
    author_id: str
    is_public: bool
    view_count: int
    ref_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
