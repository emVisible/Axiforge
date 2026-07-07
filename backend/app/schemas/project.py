
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

# ============================================================
# 枚举字面量（用 str 类型 + 注释约束，不用 enum 因为 JSON 序列化）
# ============================================================

# Scene source: "reference" | "locked" | "inline"
# Asset type: "item" | "plugin"


# ============================================================
# Project
# ============================================================


class ProjectForkRequest(BaseModel):
    new_title: Optional[str] = Field(None, max_length=255)
    author_id: str = Field("anonymous", max_length=255)


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    cover_image: Optional[str] = None
    mechanism: Optional[str] = None
    style_reference: Optional[str] = None
    theme_tags: List[str] = []
    genre: Optional[str] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    is_public: bool = False
    is_meta: bool = False
    author_id: str = "anonymous"


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    mechanism: Optional[str] = None
    style_reference: Optional[str] = None
    theme_tags: Optional[List[str]] = None
    genre: Optional[str] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    play_meta: Optional[dict] = None
    is_public: Optional[bool] = None
    is_meta: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: UUID
    title: str
    description: str
    cover_image: Optional[str] = None
    mechanism: Optional[str] = None
    style_reference: Optional[str] = None
    theme_tags: List[str]
    genre: Optional[str] = None
    world_setting: Optional[str] = None
    rules: Optional[str] = None
    play_meta: dict = {}
    is_public: bool
    is_meta: bool
    view_count: int
    play_count: int = 0
    author_id: str
    fork_from: Optional[UUID] = None
    scenes: List["ProjectSceneResponse"] = []
    roles: List["ProjectRoleResponse"] = []
    asset_refs: List["ProjectAssetRefResponse"] = []
    edges: List["ProjectEdgeResponse"] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ProjectScene
# ============================================================


class ProjectSceneCreate(BaseModel):
    source: str = "inline"  # reference | locked | inline
    scene_ref_id: Optional[UUID] = None
    parent_scene_id: Optional[UUID] = None
    title: str
    description: str = ""
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    sort_order: int = 0


class ProjectSceneUpdate(BaseModel):
    source: Optional[str] = None
    scene_ref_id: Optional[UUID] = None
    scene_data: Optional[dict] = None
    title: Optional[str] = None
    description: Optional[str] = None
    parent_scene_id: Optional[UUID] = None
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    sort_order: Optional[int] = None


class ProjectSceneResponse(BaseModel):
    id: UUID
    project_id: UUID
    source: str
    scene_ref_id: Optional[UUID] = None
    title: str
    description: str
    parent_scene_id: Optional[UUID] = None
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    sort_order: int
    nodes: List["ProjectNodeResponse"] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ProjectNode
# ============================================================


class ProjectNodeCreate(BaseModel):
    editor_data: dict = {}
    narrative_data: dict = {}
    sort_order: int = 0


class ProjectNodeUpdate(BaseModel):
    editor_data: Optional[dict] = None
    narrative_data: Optional[dict] = None
    sort_order: Optional[int] = None


class ProjectNodeResponse(BaseModel):
    id: UUID
    scene_id: UUID
    editor_data: dict
    narrative_data: dict
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ProjectRole
# ============================================================


class ProjectRoleCreate(BaseModel):
    character_ref_id: UUID
    importance: int = Field(default=0, ge=0, le=5)
    role_description: Optional[str] = None


class ProjectRoleUpdate(BaseModel):
    locked_version: Optional[dict] = None
    importance: Optional[int] = None
    role_description: Optional[str] = None


class ProjectRoleResponse(BaseModel):
    id: UUID
    project_id: UUID
    character_ref_id: UUID
    locked_version: Optional[dict] = None
    importance: int
    role_description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ProjectAssetRef
# ============================================================


class ProjectAssetRefCreate(BaseModel):
    asset_type: str
    asset_id: UUID


class ProjectAssetRefResponse(BaseModel):
    id: UUID
    project_id: UUID
    asset_type: str
    asset_id: UUID
    locked_version: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ProjectEdge
# ============================================================


class ProjectEdgeCreate(BaseModel):
    source_node_id: UUID
    target_node_id: UUID
    source_port: str = "output_true"
    label: Optional[str] = None
    condition: Optional[dict] = None


class ProjectEdgeResponse(BaseModel):
    id: UUID
    project_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    source_port: str
    label: Optional[str] = None
    condition: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# 前向引用解析
# ============================================================

ProjectResponse.model_rebuild()
ProjectSceneResponse.model_rebuild()
