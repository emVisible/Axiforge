from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProseToScriptRequest(BaseModel):
    prose: str = Field(..., min_length=1, max_length=20000)
    role_names: List[str] = Field(default_factory=list)


class ProseToScriptResponse(BaseModel):
    script: List[Dict[str, Any]]
    source: str = "rules"


class CharacterSuggestRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    essence: str = Field(default="", max_length=500)
    tags: List[str] = Field(default_factory=list)


class CharacterSuggestResponse(BaseModel):
    layers: Dict[str, Any]
    source: str = "rules"
