"""判断层词汇表：内部 id ↔ 运营看到的中文，只在这一处对外发。

为什么要在后端：中台前端此前自己抄了一份条款短名表和一份规则短名表。
两份表漂移时**两端都不会报错**——最坏情况是运营在队列里看到 `spam_promotion`
这样的内部 id，最好的情况是同一个条款在两个界面长两个名字。而判断层的条款集
是会长的（每加一条轴就要进题集、进规则、进中台），抄一份的代价随规模涨。

这里不做任何判断，只把 `questions` / `policy` / `contracts` 已定义的取值域投影出去；
`via` 字符串的**解析**仍然留在前端——那是"怎么把一句机器话排成人话"的展示逻辑，
不是词汇。
"""

from __future__ import annotations

from typing import Dict, List

from app.domains.moderation.contracts import ACTIONS, ACTION_LABELS
from app.domains.moderation.policy import RULES
from app.domains.moderation.questions import (
    BOOL_QUESTIONS,
    CLAUSE_LABELS,
    HUMAN_ONLY_CLAUSES,
    QUESTION_LABELS,
    SUGGESTION_LABELS,
    clause_for,
)

assert set(ACTION_LABELS) == set(ACTIONS), "结论取值域改了，短名没跟上"

_NO_LABEL = [r.key for r in RULES if not r.label]
assert not _NO_LABEL, f"这些规则没有运营侧短名：{_NO_LABEL}"


def vocabulary() -> Dict[str, object]:
    """给 `/admin/moderation/vocabulary` 的那份投影。"""
    clauses: Dict[str, str] = dict(CLAUSE_LABELS)
    rules: Dict[str, str] = {r.key: r.label for r in RULES}
    human_only: List[str] = sorted(HUMAN_ONLY_CLAUSES)
    # 处置面板的"逐轴真值"该列哪几条：只有背后有二元轴的那些条款才是人真能核对的命题
    # （`rating_mismatch` 是量级/评分的产物，没有对应的二元问题）。这份映射只有服务端有，
    # 前端自己抄一份就是 D5 那笔债的复发——加一条轴时漏改的表现是"那一条永远勾不到"。
    axis_clauses: List[str] = sorted({c for c in (clause_for(q) for q in BOOL_QUESTIONS) if c})
    return {
        "clauses": clauses,
        "axis_clauses": axis_clauses,
        "suggestions": dict(SUGGESTION_LABELS),
        "rules": rules,
        "questions": dict(QUESTION_LABELS),
        "actions": dict(ACTION_LABELS),
        # 命中即不允许自动通过。前端要把它标成"必须人工"，但不能自己决定哪些条款算——
        # 那是策略，不是展示。
        "human_only_clauses": human_only,
    }
