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
