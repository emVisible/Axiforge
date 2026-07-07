from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CodexUpsert(BaseModel):
    player_token: str = Field(..., min_length=1, max_length=64)
    ledger: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    source_project_id: Optional[UUID] = None


class CodexResponse(BaseModel):
    ledger: Dict[str, Dict[str, Any]]
