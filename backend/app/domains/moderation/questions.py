"""类型化问题集与答案白名单（Laya `choice|score|noul` 三种题型）。

与参照实现的两点实质差别：

1. **取值域是内容治理的，不是通用工单的。** 参照实现的六个问题是客服工单口径
   （category ∈ billing/technical/sales…、fraud、churn），对视觉小说 UGC 平台几乎不对位。
   这里按 Axiforge 的实际内容面重设：分级、性与暴力、自伤、仇恨、违法教程、真人隐私、导流。
2. **取值域同时是白名单。** 问题声明了合法取值，`normalize_answers()` 强制执行：
   越界的 choice、不在 [0,1] 的概率、缺失的答案，全部记为"该引擎弃权"，
   绝不兜底成某个默认类别。参照实现 `engines.py:55` 的 `choice(q, "other")`
   正是把"模型没答/答错格式"变成了"归类为其他→自动通过"。

`clause_id` 是本平台内容条款的唯一定义处：中台 `violations.clause` 直接写它，
不再各处拼字符串。（此前 `violations` 里只出现过 `content_takedown` 这一个处置型条款。）
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from app.domains.moderation.contracts import Answer, clamp01

QUESTIONS_VERSION = "questions-2"

# (name, type, instructions, criteria, clause_id)
# noul 型只需 instructions；score 型 criteria 是有序刻度；choice 型 criteria 是取值→释义。
_QUESTION_SPECS: Tuple[Tuple[str, str, str, Any, str], ...] = (
    (
        "age_rating",
        "choice",
        "这部内容最适合的年龄分级是哪一档？",
        {
            "all": "全年龄：无性与露骨暴力描写",
            "teen": "青少年：轻度暧昧、非露骨冲突或暴力",
            "adult": "成人：明确的性行为、露骨血腥或自伤细节",
        },
        "rating_mismatch",
    ),
    (
        "sexual_content",
        "noul",
        "是否包含明确的性行为或性剥削描写？",
        None,
        "sexual_explicit",
    ),
    (
        "violence_gore",
        "noul",
        "是否包含以折磨、细节化伤害为卖点的血腥暴力？",
        None,
        "gratuitous_violence",
    ),
    (
        "self_harm",
        "noul",
        "是否出现自伤/自杀，且未作安全处理（美化、教程式细节或劝阻缺失）？",
        None,
        "self_harm_unsafe",
    ),
    (
        "hate_targeted",
        "noul",
        "是否针对真实受保护群体煽动仇恨或去人格化？",
        None,
        "hate_incitement",
    ),
    (
        "illegal_act_instruction",
        "noul",
        "是否提供可执行的违法犯罪操作教程？",
        None,
        "illegal_instruction",
    ),
    (
        "pii_real_person",
        "noul",
        "是否暴露真实可识别个人的隐私信息（住址、证件、单位、社交账号）？",
        None,
        "doxxing",
    ),
    (
        "spam_promotion",
        "noul",
        "是否为纯导流/垃圾推广而非创作内容？",
        None,
        "spam_promotion",
    ),
    (
        "severity",
        "score",
        "若该内容被公开，对读者与平台的危害量级？",
        ["无危害", "需标注或限龄", "必须下架"],
        None,
    ),
)

#: 引擎可返回的全部合法类别（白名单）。不在其中的值 = 答案不可信。
ALLOWED_CHOICE: Dict[str, Tuple[str, ...]] = {
    name: tuple(criteria.keys())
    for name, qtype, _, criteria, _ in _QUESTION_SPECS
    if qtype == "choice"
}
SCORE_RANGE: Dict[str, Tuple[float, float]] = {
    name: (0.0, float(len(criteria) - 1))
    for name, qtype, _, criteria, _ in _QUESTION_SPECS
    if qtype == "score"
}
BOOL_QUESTIONS: Tuple[str, ...] = tuple(
    name for name, qtype, *_ in _QUESTION_SPECS if qtype == "noul"
)

#: 触发"必须人工"的条款——命中即不允许自动通过，哪怕模型置信度很高。
#: 分级为 adult 不在此列：全年龄平台里它需要的是限龄而不是下架，那是另一条策略位。
HUMAN_ONLY_CLAUSES: frozenset = frozenset(
    {
        "sexual_explicit",
        "self_harm_unsafe",
        "hate_incitement",
        "illegal_instruction",
        "doxxing",
    }
)


def build_questions() -> Dict[str, Dict[str, Any]]:
    """Laya / sidecar 的问题字典（与上游 schema 同构，可直接 POST）。"""
    out: Dict[str, Dict[str, Any]] = {}
    for name, qtype, instructions, criteria, _ in _QUESTION_SPECS:
        item: Dict[str, Any] = {"type": qtype, "instructions": instructions}
        if criteria is not None:
            item["criteria"] = criteria
        out[name] = item
    return out


def clause_for(question: str) -> Optional[str]:
    for name, _, _, _, clause in _QUESTION_SPECS:
        if name == question:
            return clause
    return None


def question_types() -> Dict[str, str]:
    return {name: qtype for name, qtype, *_ in _QUESTION_SPECS}


class AnswerRejected(Exception):
    """答案不在声明的取值域内——调用方必须把它当作"引擎弃权"，不能当作"没问题"。"""


def normalize_answers(raw: Dict[str, Any]) -> Tuple[Dict[str, Answer], List[str]]:
    """把引擎返回的 answers 规范化；返回 (可用答案, 违规说明)。

    任何一条越界都不污染其余答案，但违规列表非空即意味着这个引擎的裁决不该被执行
    （执行与否由 engine 层决定）——因为"部分可信"在不可逆动作上没有意义。
    """
    types = question_types()
    answers: Dict[str, Answer] = {}
    problems: List[str] = []
    if not isinstance(raw, dict):
        return {}, ["answers 不是对象"]

    for name, payload in raw.items():
        qtype = types.get(name)
        if qtype is None:
            problems.append(f"未声明的问题 {name}")
            continue
        if not isinstance(payload, dict):
            problems.append(f"{name} 的答案不是对象")
            continue

        if qtype == "choice":
            value = payload.get("choice")
            if value not in ALLOWED_CHOICE[name]:
                problems.append(f"{name} 取值 {value!r} 不在白名单 {ALLOWED_CHOICE[name]}")
                continue
            conf = clamp01(payload.get("confidence"))
            if conf is None:
                problems.append(f"{name} 置信度缺失或越界")
                continue
            answers[name] = Answer(name, qtype, value, conf, payload.get("choice"))
        elif qtype == "score":
            lo, hi = SCORE_RANGE[name]
            try:
                v = float(payload.get("score"))  # type: ignore[arg-type]
            except (TypeError, ValueError):
                problems.append(f"{name} 分数不是数")
                continue
            if not (lo <= v <= hi):
                problems.append(f"{name} 分数 {v} 超出 [{lo},{hi}]")
                continue
            answers[name] = Answer(name, qtype, v, 1.0, payload.get("score"))
        else:  # noul：二元概率
            p = clamp01(payload.get("noul"))
            if p is None:
                problems.append(f"{name} 概率缺失或不在 [0,1]")
                continue
            answers[name] = Answer(name, qtype, p, max(p, 1.0 - p), payload.get("noul"))

    for name in types:
        if name not in answers and name not in {p.split()[0] for p in problems}:
            problems.append(f"缺少 {name} 的答案")

    return answers, problems
