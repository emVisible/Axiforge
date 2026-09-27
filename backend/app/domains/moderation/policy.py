"""从类型化答案到裁决：声明式策略表 + 门控。

参照实现把决策写成一串硬编码 if 梯（`engines.py:40-82`），阈值散落在
`0.5 / 1.5 / 0.88 / 0.86 / 0.70 / 0.60` 六个字面量里，读的人无法回答
"哪一条规则让它驳回的、当时线画在哪"。这里改成两张表：

- `RULES`：命中条件 → 建议动作 + 条款 + 依据文本。顺序即优先级，可单测。
- `gate()`：把"建议动作 + 置信度 + 引擎是否权威 + 策略阈值"折成最终动作。
  不可逆动作（自动通过/自动驳回）必须同时满足权威引擎与阈值，
  且被 `HUMAN_ONLY_CLAUSES` 一票否决转人工。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List, Sequence, Tuple

from app.domains.moderation.contracts import (
    ACTION_APPROVE,
    ACTION_HUMAN,
    ACTION_REJECT,
    Answer,
    Policy,
    Verdict,
)
from app.domains.moderation.questions import (
    HUMAN_ONLY_CLAUSES,
    QUESTIONS_VERSION,
    clause_for,
)

#: noul 概率超过这个线才算"该风险存在"（与"是否足以执行动作"无关，后者由 gate 判）
RISK_PRESENT = 0.5


@dataclass(frozen=True)
class Rule:
    key: str
    action: str
    when: Callable[[Dict[str, Answer]], bool]
    clauses: Callable[[Dict[str, Answer]], List[str]]
    evidence: Callable[[Dict[str, Answer]], str]


def _p(answers: Dict[str, Answer], name: str) -> float:
    a = answers.get(name)
    return float(a.value) if a and isinstance(a.value, float) else 0.0


def _worst_risk(answers: Dict[str, Answer]) -> Tuple[float, str]:
    """最严重的那条风险（概率, 问题名）。"""
    risky = [
        (_p(answers, n), n)
        for n in ("sexual_content", "violence_gore", "self_harm", "hate_targeted",
                  "illegal_act_instruction", "pii_real_person", "spam_promotion")
        if _p(answers, n) >= RISK_PRESENT
    ]
    return max(risky, default=(0.0, ""))


RULES: Sequence[Rule] = (
    Rule(
        key="hate_or_doxx_or_instruction",
        action=ACTION_REJECT,
        when=lambda a: max(_p(a, "hate_targeted"), _p(a, "pii_real_person"),
                           _p(a, "illegal_act_instruction")) >= RISK_PRESENT,
        clauses=lambda a: [c for n, c in (("hate_targeted", "hate_incitement"),
                                          ("pii_real_person", "doxxing"),
                                          ("illegal_act_instruction", "illegal_instruction"))
                           if _p(a, n) >= RISK_PRESENT],
        evidence=lambda a: (f"hate={_p(a, 'hate_targeted'):.2f} "
                            f"pii={_p(a, 'pii_real_person'):.2f} "
                            f"instruction={_p(a, 'illegal_act_instruction'):.2f}"),
    ),
    Rule(
        key="adult_or_violence_needs_label",
        action=ACTION_HUMAN,
        when=lambda a: (a.get("age_rating") and a["age_rating"].value == "adult")
        or max(_p(a, "sexual_content"), _p(a, "violence_gore"), _p(a, "self_harm")) >= RISK_PRESENT,
        clauses=lambda a: [c for n, c in (("sexual_content", "sexual_explicit"),
                                          ("violence_gore", "gratuitous_violence"),
                                          ("self_harm", "self_harm_unsafe"))
                           if _p(a, n) >= RISK_PRESENT]
        + (["rating_mismatch"] if a.get("age_rating") and a["age_rating"].value == "adult" else []),
        evidence=lambda a: (f"rating={getattr(a['age_rating'], 'value', '-')} "
                            f"sexual={_p(a, 'sexual_content'):.2f} "
                            f"gore={_p(a, 'violence_gore'):.2f} "
                            f"self_harm={_p(a, 'self_harm'):.2f}"),
    ),
    Rule(
        key="spam_only",
        action=ACTION_REJECT,
        when=lambda a: _p(a, "spam_promotion") >= RISK_PRESENT,
        clauses=lambda a: ["spam_promotion"],
        evidence=lambda a: f"spam={_p(a, 'spam_promotion'):.2f}",
    ),
    Rule(
        key="high_severity",
        action=ACTION_HUMAN,
        when=lambda a: float(getattr(a.get("severity"), "value", 0) or 0) >= 1.0,
        clauses=lambda a: [clause_for("severity") or "severity"],
        evidence=lambda a: f"severity={float(getattr(a.get('severity'), 'value', 0) or 0):.1f}",
    ),
)


def decide_from_answers(
    answers: Dict[str, Answer],
    *,
    engine: str,
    calibrated: bool = False,
    extra_reasons: List[str] | None = None,
) -> Verdict:
    """策略表求值。置信度取"支撑这条规则的那条证据的置信度"，不做无依据的乐观。"""
    reasons: List[str] = list(extra_reasons or [])
    reasons.append(
        "temperature fitted" if calibrated else "uncalibrated: 置信度不可用于不可逆动作"
    )

    for rule in RULES:
        try:
            hit = rule.when(answers)
        except (KeyError, TypeError, ValueError) as exc:  # 答案残缺不猜，转人工
            return Verdict(
                action=ACTION_HUMAN, confidence=0.0, engine=engine,
                reasons=reasons + [f"策略求值失败：{exc}"], abstained=False,
            )
        if not hit:
            continue
        conf = _rule_confidence(answers, rule.key)
        reasons.append(f"rule={rule.key} → {rule.action} conf={conf:.2f}")
        reasons.append(rule.evidence(answers))
        return Verdict(
            action=rule.action, confidence=conf, engine=engine, reasons=reasons,
            clause_ids=rule.clauses(answers), answers=answers, calibrated=calibrated,
        )

    # 所有风险轴都低 且 分级不是成人 → 建议通过；置信度取"分级这条证据"的置信度，
    # 而不是参照实现那个 max(cat_conf, 0.5) 的人造地板（0.5 会让低证据也够到门边）。
    rating = answers.get("age_rating")
    conf = float(rating.confidence) if rating else 0.0
    reasons.append(f"rule=no_risk → {ACTION_APPROVE} conf={conf:.2f}")
    return Verdict(
        action=ACTION_APPROVE, confidence=conf, engine=engine, reasons=reasons,
        answers=answers, calibrated=calibrated,
    )


def _rule_confidence(answers: Dict[str, Answer], rule_key: str) -> float:
    """该规则实际依赖的证据里最弱的一条置信度（短板决定能不能自动执行）。"""
    deps: Dict[str, List[str]] = {
        "hate_or_doxx_or_instruction": ["hate_targeted", "pii_real_person", "illegal_act_instruction"],
        "adult_or_violence_needs_label": ["age_rating", "sexual_content", "violence_gore", "self_harm"],
        "spam_only": ["spam_promotion"],
        "high_severity": ["severity"],
    }
    names = [n for n in deps.get(rule_key, []) if n in answers]
    if not names:
        return 0.0
    relevant = [
        answers[n].confidence
        for n in names
        if _p(answers, n) >= RISK_PRESENT or n == "age_rating"
    ]
    return min(relevant) if relevant else min(answers[n].confidence for n in names)


def gate(verdict: Verdict, policy: Policy, *, authoritative: bool) -> Tuple[str, str]:
    """最终动作。返回 (action, via)。

    `authoritative` 由引擎传入（它声明"我有没有资格执行不可逆动作"），
    Verdict 本身不带这个属性——一个裁决不能自己宣布自己可信。

    五条不可省的检查，顺序即优先级：
    1. 引擎弃权或出错 → 人工
    2. 命中 HUMAN_ONLY_CLAUSES → 人工（这类内容需要的是判断与上下文，不是自动下架）
    3. 引擎非权威 → 人工。确定性词表可以升级，不可以执行不可逆动作
    4. 未校准 → 人工。置信度没标定时它不是一个可比较的量
    最后才比阈值，且驳回的线高于通过的线（误伤用户比漏放更贵）。
    """
    if verdict.abstained:
        return ACTION_HUMAN, "engine_abstained"
    if verdict.error:
        return ACTION_HUMAN, f"engine_error:{verdict.error}"
    if any(c in HUMAN_ONLY_CLAUSES for c in verdict.clause_ids):
        return ACTION_HUMAN, "human_only_clause"
    if not authoritative:
        return ACTION_HUMAN, "non_authoritative_engine"
    if not verdict.calibrated:
        return ACTION_HUMAN, "uncalibrated"

    if verdict.action == ACTION_APPROVE:
        if verdict.confidence >= policy.auto_approve_threshold:
            return ACTION_APPROVE, f"auto@{policy.version}"
        return ACTION_HUMAN, f"below_approve_line {verdict.confidence:.2f}<{policy.auto_approve_threshold:.2f}"

    if verdict.action == ACTION_REJECT:
        if verdict.confidence >= policy.auto_reject_threshold:
            return ACTION_REJECT, f"auto@{policy.version}"
        return ACTION_HUMAN, f"below_reject_line {verdict.confidence:.2f}<{policy.auto_reject_threshold:.2f}"

    return ACTION_HUMAN, "policy_default"
