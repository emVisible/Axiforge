"""审核案件的中台 API（挂在既有 `require_admin` 之下，不新建鉴权路径）。"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
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


class QueuePage(BaseModel):
    """队列分页。`total` 是该状态下的全量条数，不是本页条数。

    没有它，运营看到"100 条"时不知道后面还有没有——而这里曾经连翻页都做不到，
    上限就是硬上限（举报列表更糟：默认 50 条，第 51 条起永久看不见）。
    """

    items: List[CaseResponse]
    total: int
    offset: int = 0
    limit: int = 50


class WhatIfRowResponse(BaseModel):
    case_id: str
    subject_type: str
    subject_id: str
    state: str
    actual_action: str
    hypothetical_action: str
    via: str
    confidence: float
    human_outcome: str
    agreement: str
    effective_approve: float
    effective_reject: float


class WhatIfResponse(BaseModel):
    """假定阈值下的重放结果。`conflicts` 是要盯的那个数：机器会动、人当时动了相反的方向。"""

    approve_line: float
    reject_line: float
    evaluated: int
    scanned: int
    #: 库里案件总数；`scanned < population` 就是这份证据只看了最近一窗，读数要连着样本量说。
    population: int
    skipped: Dict[str, int]
    auto_approve: int
    auto_reject: int
    agrees: int
    conflicts: int
    undecided: int
    rows: List[WhatIfRowResponse]


class ResolveRequest(BaseModel):
    outcome: str = Field(pattern="^(resolved|dismissed)$")
    note: str = ""


class EngineHealth(BaseModel):
    name: str
    healthy: bool
    authoritative: bool


class EngineCalibration(BaseModel):
    """一个引擎的标定覆盖面。`missing` 才是运营要看的那一栏：
    任一题未覆盖，整条链就不会自动执行。"""

    engine: str
    reachable: bool = True
    declared: List[str] = []
    covered: List[str] = []
    missing: List[str] = []
    temperatures: Dict[str, float] = {}
    #: 温度搜索网格上限；0 表示引擎没上报（旧 sidecar）
    grid_max: float = 0.0
    #: 拟合值坐在上限上的题：不是"标定好了"，是"想更正但网格不允许"，置信度仍虚高
    censored: List[str] = []
    path: str = ""
    error: str = ""


class PolicyThresholds(BaseModel):
    version: str
    auto_approve: float
    auto_reject: float
    human_band: float


class StatsResponse(BaseModel):
    by_state: dict
    by_engine: dict
    engines: List[EngineHealth]
    policy: PolicyThresholds
    calibration: List[EngineCalibration] = []


class VocabularyResponse(BaseModel):
    """判断层词汇表（条款/规则/结论的运营侧短名）+ 版本键。

    版本键让前端可以"这套词已经过期了"为理由重取：换了题集或策略后
    条款集本身会变，用一份缓存到死的词表去渲染新条款，就又回到抄两份的老路。
    """

    clauses: Dict[str, str]
    suggestions: Dict[str, str]
    rules: Dict[str, str]
    #: 类型化问题的短名（"未标定轴"、温度表覆盖面这些位置要用）
    questions: Dict[str, str]
    actions: Dict[str, str]
    human_only_clauses: List[str]
    policy_version: str
    questions_version: str
