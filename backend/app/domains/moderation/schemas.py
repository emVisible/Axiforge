"""审核案件的中台 API（挂在既有 `require_admin` 之下，不新建鉴权路径）。"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domains.moderation.models import ModerationCase


class CaseResponse(BaseModel):
    """判断依据全部外露：中台一屏要能回答"为什么是这条结论"。

    参照实现的队列只回 action/confidence/engine，误判复盘时拿不到答案与阈值。
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject_type: str
    subject_id: str
    author_id: str
    state: str
    suggested_action: str
    final_action: str
    via: str
    confidence: Optional[float]
    engine: str
    authoritative: bool
    calibrated: bool
    clause_ids: List[str]
    answers: dict
    reasons: List[str]
    policy_version: str
    questions_version: str
    lexicon_version: str
    latency_ms: int
    created_at: datetime
    decided_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None


class ResolveRequest(BaseModel):
    outcome: str = Field(pattern="^(resolved|dismissed)$")
    note: str = ""


class EngineHealth(BaseModel):
    name: str
    healthy: bool
    authoritative: bool


class StatsResponse(BaseModel):
    by_state: dict
    by_engine: dict
    engines: List[EngineHealth]
