"""阈值假设（what-if）：拿**已落库的答案**重放策略，看换一条线会执行到什么。

为什么值得有：`auto_rate=0` 是个诚实但无信息量的读数——它不告诉你"线画到 0.75 会怎样"。
以前只有 `eval/moderation_eval.py` 那条 CLI 能回答，而它跑的是 34 行自标注集，
跟运营真正处置过的案件是两份数据。这里反过来：**只用库里那些已经有人看过、
甚至已经人工处置过的案件**，于是"误放"不再是标注集上的假设，而是
"机器会放行的这一条，人当时把它下架了"。

三条口径上的自律：

1. **只读，不改策略。** 这里算出来的任何数字都不写库、不动 `Policy()`，
   决定线画在哪仍然是配置与人的事。
2. **只回放当季题集给出的、已标定且有执行资格的案件。** 换过题集的答案不属于这套题，
   拿它们重放会得到一个看着合理其实错位的表。
3. **一致 / 冲突只按人工处置判**，没有人工结论的行标成"没有人判过"并单独计数——
   那个数字就是自动化真正的天花板。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Sequence, Tuple

from app.domains.moderation.contracts import (
    ACTION_APPROVE,
    ACTION_HUMAN,
    ACTION_REJECT,
    Policy,
)
from app.domains.moderation.models import (
    STATE_DISMISSED,
    STATE_RESOLVED,
    ModerationCase,
)
from app.domains.moderation.policy import decide_from_answers, gate
from app.domains.moderation.questions import (
    QUESTIONS_VERSION,
    normalize_answers,
)


@dataclass(frozen=True)
class WhatIfRow:
    case_id: str
    subject_type: str
    subject_id: str
    state: str
    actual_action: str
    hypothetical_action: str
    via: str
    confidence: float
    human_outcome: str
    agreement: str  # agree | conflict | undecided
    #: 这一行**实际生效**的线。评论与素材被 `_KIND_OVERRIDES` 收紧过，
    #: 所以面板上填 0.75 不等于对评论按 0.75 判——把真实数字摊出来，
    #: 否则这个工具会教出一个错误的直觉。
    effective_approve: float
    effective_reject: float


@dataclass(frozen=True)
class WhatIfReport:
    approve_line: float
    reject_line: float
    evaluated: int
    skipped: Dict[str, int]
    auto_approve: int
    auto_reject: int
    agrees: int
    conflicts: int
    undecided: int
    rows: List[WhatIfRow]
    #: 库里案件**总数**。`scanned`（= evaluated + skipped）小于它，就说明这份证据
    #: 只覆盖最近那一窗，读数得连着样本量一起看——分页修复（D12）同一课：
    #: 没被读到的案件在界面上等于不存在。放在末位是因为它带默认值，
    #: 数据类里无默认值的字段不许排在有默认值的之后。
    population: int = 0


def _agreement(hypothetical: str, case: ModerationCase) -> Tuple[str, str]:
    """一致/冲突只以**人工处置**为准；没有处置就是"没判过"，不猜。"""
    human = case.state if case.state in (STATE_RESOLVED, STATE_DISMISSED) else ""
    if hypothetical == ACTION_HUMAN or not human:
        return ("undecided", human)
    took_down = human == STATE_RESOLVED
    if hypothetical == ACTION_APPROVE:
        return ("agree" if not took_down else "conflict", human)
    if hypothetical == ACTION_REJECT:
        return ("agree" if took_down else "conflict", human)
    return ("undecided", human)


def evaluate(cases: Sequence[ModerationCase], *, approve: float,
             reject: float) -> WhatIfReport:
    """在已落库的答案上重放一遍假定的阈值。"""
    policy = Policy(auto_approve_threshold=approve, auto_reject_threshold=reject,
                    version=f"what-if/{approve:.2f}-{reject:.2f}")
    rows: List[WhatIfRow] = []
    skipped: Dict[str, int] = {}

    def skip(reason: str) -> None:
        skipped[reason] = skipped.get(reason, 0) + 1

    for case in cases:
        if case.engine in ("", "lexicon", "chain"):
            # 词表与"链全体弃权"没有可回放的类型化答案；重放它们只会得到一个假的 0。
            skip("引擎没给类型化答案")
            continue
        if case.questions_version != QUESTIONS_VERSION:
            skip(f"题集不是 {QUESTIONS_VERSION}")
            continue
        if not case.answers:
            skip("案件没存答案")
            continue
        answers, _problems = normalize_answers(case.answers)
        if not answers:
            skip("答案回放不出来")
            continue
        verdict = decide_from_answers(
            answers, engine=case.engine, calibrated=case.calibrated,
            extra_reasons=[f"重放自案件 {case.id}"])
        effective = policy.resolved(case.subject_type)
        action, via = gate(verdict, effective, authoritative=case.authoritative)
        agreement, human = _agreement(action, case)
        rows.append(WhatIfRow(
            case_id=str(case.id), subject_type=case.subject_type, subject_id=case.subject_id,
            state=case.state, actual_action=case.final_action, hypothetical_action=action,
            via=via, confidence=float(verdict.confidence or 0.0),
            human_outcome=human, agreement=agreement,
            effective_approve=effective.auto_approve_threshold,
            effective_reject=effective.auto_reject_threshold,
        ))

    return WhatIfReport(
        approve_line=approve, reject_line=reject, evaluated=len(rows), skipped=skipped,
        auto_approve=sum(1 for r in rows if r.hypothetical_action == ACTION_APPROVE),
        auto_reject=sum(1 for r in rows if r.hypothetical_action == ACTION_REJECT),
        agrees=sum(1 for r in rows if r.agreement == "agree"),
        conflicts=sum(1 for r in rows if r.agreement == "conflict"),
        undecided=sum(1 for r in rows if r.agreement == "undecided"),
        # 只把"这条线会真的动手"的行交给界面：全量回传只会淹没那两三行。
        rows=[r for r in rows if r.hypothetical_action != ACTION_HUMAN],
    )
