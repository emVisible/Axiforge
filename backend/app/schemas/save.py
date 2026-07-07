
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class SaveSlotUpsert(BaseModel):
    """写入/更新存档槽（桥4 持久记忆，ADR-011）"""

    player_token: str = Field(..., min_length=1, max_length=64)
    # 完整可序列化的 @axiforge/core RuntimeState
    state: dict
    summary: Optional[str] = Field(default=None, max_length=500)
    beat_id: Optional[str] = Field(default=None, max_length=64)
    thumb_path: Optional[str] = Field(default=None, max_length=500)
    slot: int = 0


class SaveSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    player_token: str
    slot: int
    state: dict
    summary: Optional[str] = None
    beat_id: Optional[str] = None
    thumb_path: Optional[str] = None
    updated_at: Optional[datetime] = None
