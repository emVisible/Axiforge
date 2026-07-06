from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ItemCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "日常"
    rarity: str = "普通"
    effects: List[str] = Field(default_factory=list)
    is_public: bool = False


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rarity: Optional[str] = None
    effects: Optional[List[str]] = None
    is_public: Optional[bool] = None


class ItemResponse(BaseModel):
    id: UUID
    name: str
    description: str
    category: str
    rarity: str
    effects: List[str]
    image_path: Optional[str] = None
    author_id: str
    is_public: bool
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
