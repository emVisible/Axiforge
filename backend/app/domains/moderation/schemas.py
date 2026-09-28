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
    #: 人逐轴确认过的条款真值。`null` 与 `[]` 不同：前者是没勾过（沿用机器条款），
    #: 后者是人明确说"一条都不成立"。界面要能区分，否则运营以为自己已经表过态。
    human_clauses: Optional[List[str]] = None
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
    #: `evaluated` 覆盖的**不同内容**数。292 条可回放可能只对应 32 篇稿子——
    #: 案件数会被重复文本膨胀，独立样本数不会，所以它才是拟合与决策的分母。
    distinct_contents: int
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
    #: 逐轴真值。不给＝没勾过（导出沿用机器标的条款）；给列表（含空列表）＝人明确确认过。
    #: 校验放在路由层：条款名单只在服务端有一份（`questions.REGISTERED_CLAUSES`）。
    human_clauses: Optional[List[str]] = None


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
    #: 持出 NLL 打不过常数预测器的题：这个数在当前标注量下**不携带信息**，
    #: 而 approve 的置信度是各轴取 min，所以它正在按 min 否决整条自动通道（ADR-028 D25）。
    flattened: List[str] = []
    #: 这张温度表有没有上报判断力字段。旧表没这个键时是 false——
    #: "没数据"与"有数据且是负的"必须在界面上长得不一样。
    flattening_reported: bool = False
    path: str = ""
    error: str = ""


class LabelTargetRow(BaseModel):
    case_id: str
    subject_type: str
    subject_id: str
    state: str
    #: 这条轴报警的概率（落库里那份缩放后的值；排序读的也是它，理由见 service.queue）
    probability: float
    #: 这条案件有没有"缩放前"那份分布。没有它，处置完之后拟合仍旧拿不到样本。
    has_raw: bool


class LabelTargetAxis(BaseModel):
    question: str
    #: 这条轴当前有没有判断力（持出 NLL 打不打得过常数预测器）。
    #: `None` ＝ 这张温度表没上报这一维——"看不见"与"报了是负的"必须分得开。
    informative: Optional[bool] = None
    pending_candidates: int
    top: List[LabelTargetRow] = []


class LabelTargetsResponse(BaseModel):
    """每条轴"该标哪几行"。只指路，不代答：真值仍由人在行内逐轴勾。"""

    engine: str
    pending_total: int
    #: 报了"没有判断力"的轴有几条——面板拿它做标题行那句"还差标注"。
    flattened: List[str] = []
    axes: List[LabelTargetAxis] = []


class PolicyThresholds(BaseModel):
    version: str
    auto_approve: float
    auto_reject: float
    human_band: float


class QueueStaleness(BaseModel):
    """队列里有多少条结论**是在旧版本上判的**。判定只在保存那一刻发生，
    题集/词表改版不会自己回头重算，所以"待处置 N 条"不等于"N 条同等新鲜"。"""

    total: int
    stale_questions: int
    stale_lexicon: int
    current_questions: str
    current_lexicon: str
    #: 结论不是权威引擎给的（词表判的或全体弃权）——"自动判断到底覆盖了多少内容"的真分母
    without_authoritative_verdict: int


class RequeueRequest(BaseModel):
    """批量重判的输入。`allow_close` 默认关——见路由那段为什么。"""

    scope: str = Field(pattern="^(stale|unjudged|pending)$", default="unjudged")
    limit: int = Field(default=200, ge=1, le=5000)
    #: 允许批量把待人工翻成"机器已结案"。默认 false：结论照刷新，state 不动。
    allow_close: bool = False


class RequeueStatus(BaseModel):
    running: bool
    queued: int
    #: 走到权威引擎并落了结论的条数——攒标注真正要的就是这个数
    judged: int
    #: 只有词表说话（模型没答话/超窗/未启用）。它与 judged 分开，
    #: 否则"跑了 150 条"会掩盖"库里只多了 1 条模型证据"。
    lexicon_only: int
    would_close: int
    no_content: int
    no_case: int
    failed: int
    cancelled: bool


class StatsResponse(BaseModel):
    by_state: dict
    by_engine: dict
    engines: List[EngineHealth]
    policy: PolicyThresholds
    calibration: List[EngineCalibration] = []
    staleness: QueueStaleness


class VocabularyResponse(BaseModel):
    """判断层词汇表（条款/规则/结论的运营侧短名）+ 版本键。

    版本键让前端可以"这套词已经过期了"为理由重取：换了题集或策略后
    条款集本身会变，用一份缓存到死的词表去渲染新条款，就又回到抄两份的老路。
    """

    clauses: Dict[str, str]
    #: 处置面板"逐轴真值"该列哪几条：由轴→条款映射投影而来，前端不自己抄一份。
    axis_clauses: List[str]
    suggestions: Dict[str, str]
    rules: Dict[str, str]
    #: 类型化问题的短名（"未标定轴"、温度表覆盖面这些位置要用）
    questions: Dict[str, str]
    actions: Dict[str, str]
    human_only_clauses: List[str]
    policy_version: str
    questions_version: str
