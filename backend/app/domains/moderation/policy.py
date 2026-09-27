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
    ACTION_LABELS,
    ACTION_REJECT,
    Answer,
    Policy,
    Verdict,
    clamp01,
)
from app.domains.moderation.questions import (
    BOOL_QUESTIONS,
    HUMAN_ONLY_CLAUSES,
    QUESTIONS_VERSION,
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
    #: 运营侧短名。`via=suggested_human:<key>` 会把这个 key 发到中台，
    #: 没有它就只能在前端另抄一份规则表——两份表漂移时没有任何一端会报错。
    label: str = ""


def _p(answers: Dict[str, Answer], name: str) -> float:
    a = answers.get(name)
    return float(a.value) if a and isinstance(a.value, float) else 0.0


#: 内容风险二元轴（新增轴自动进证据集，不需要在这里补一遍）
_RISK_AXES: Tuple[str, ...] = BOOL_QUESTIONS

#: 每道非二元题"什么算命中风险"——从概率向量里取哪些档的概率。
#: choice 取该档；score 取"量级不低于第 1 档（需标注或限龄）"。
_EVENT_LABEL: Dict[str, object] = {"age_rating": "adult", "severity": 1}


def _event_p(answers: Dict[str, Answer], name: str) -> float:
    """问题 `name` 所断言的那个风险事件发生的概率，一条公式覆盖三种题型。

    必须从概率向量算，不能用 `Answer.confidence`：Laya 对 choice 和 score 自报的
    "confidence" 实测是 **1 − 归一化熵**（分布 0.547/0.296/0.156 报 0.1076，
    算到小数点后四位完全吻合；score 同理），它和 noul 的 `max(p, 1−p)` 不是同一个量纲。
    把两者混进同一个 `min` 得到的不是"最弱证据"而是一个无意义的数——
    而 approve 这条路径恰好只由 age_rating 支撑，于是自动通过在线性上永远不可能发生。
    """
    a = answers.get(name)
    if a is None:
        return 0.0
    if a.qtype == "noul":
        return _p(answers, name)
    probs = a.raw if isinstance(a.raw, dict) else None
    want = _EVENT_LABEL.get(name)
    if probs and a.qtype == "choice" and isinstance(want, str):
        return clamp01(float(probs.get(want, 0.0))) or 0.0
    if probs and a.qtype == "score" and isinstance(want, int):
        return clamp01(sum(
            float(v) for k, v in probs.items() if _is_anchor_at_least(k, want))) or 0.0
    #: 向量缺席（确定性引擎只给结论）时，用结论本身，不凭空造概率
    if a.qtype == "choice":
        return 1.0 if a.value == want else 0.0
    return 1.0 if float(a.value or 0.0) >= float(want or 0) else 0.0


def _is_anchor_at_least(key: object, want: int) -> bool:
    try:
        return int(key) >= want  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return False


def _no_risk_confidence(answers: Dict[str, Answer]) -> float:
    """「这里没有需要处置的东西」= 八条负面证据里最弱的一条。

    七条风险轴 + age_rating（成人档概率）。**不含 severity**：量级轴不是条款，
    而且实测它与自己的其它答案互相矛盾（同一段干净文本：七条轴 ≤0.07，
    severity 却给到 1.8/「69% 至少需要标注」）。让一个含糊的抽象问题
    去否决七个具体问题的一致意见，是把自动化通道焊死在别人身上。

    缺任何一条轴就把置信度归零，而不是对剩下的取 min：
    "没测"在不可逆动作上不等于"没风险"。
    """
    names = list(_RISK_AXES) + ["age_rating"]
    if any(n not in answers for n in names):
        return 0.0
    return min(1.0 - _event_p(answers, n) for n in names)


RULES: Sequence[Rule] = (
    Rule(
        key="hate_or_doxx_or_instruction",
        label="仇恨 / 隐私 / 违法教程",
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
        label="含成人或血腥内容，需人工定级",
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
        label="导流垃圾",
        action=ACTION_REJECT,
        when=lambda a: _p(a, "spam_promotion") >= RISK_PRESENT,
        clauses=lambda a: ["spam_promotion"],
        evidence=lambda a: f"spam={_p(a, 'spam_promotion'):.2f}",
    ),
    Rule(
        key="high_severity",
        label="危害量级偏高",
        action=ACTION_HUMAN,
        when=lambda a: float(getattr(a.get("severity"), "value", 0) or 0) >= 1.0,
        # severity 是量级轴，不是内容条款：它没有 clause_id，历史上这里写成
        # `clause_for("severity") or "severity"`，于是把问题名当条款发到了中台。
        clauses=lambda a: [],
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
        reasons.append(
            f"规则「{rule.label or rule.key}」→ {ACTION_LABELS.get(rule.action, rule.action)}"
            f" 置信 {conf:.2f}"
        )
        reasons.append(rule.evidence(answers))
        return Verdict(
            action=rule.action, confidence=conf, engine=engine, reasons=reasons,
            clause_ids=rule.clauses(answers), rule=rule.key,
            answers=answers, calibrated=calibrated,
        )

    # 所有风险轴都低 且 分级不是成人 → 建议通过。置信度取"七条轴 + 成人档"这八条
    # 负面证据里最弱的一条，而不是参照实现那个 max(cat_conf, 0.5) 的人造地板
    # （0.5 会让低证据也够到门边），也不再单独依赖 age_rating 那条不同量纲的自报值。
    conf = _no_risk_confidence(answers)
    reasons.append(
        f"规则「没有任何一条轴报警」→ {ACTION_LABELS[ACTION_APPROVE]} 置信 {conf:.2f}"
    )
    return Verdict(
        action=ACTION_APPROVE, confidence=conf, engine=engine, reasons=reasons,
        rule="no_risk", answers=answers, calibrated=calibrated,
    )


def _rule_confidence(answers: Dict[str, Answer], rule_key: str) -> float:
    """该规则实际依赖的证据里最弱的一条概率（短板决定能不能自动执行）。

    只计"确实把这条规则推命中"的证据：低于风险线的轴是这个结论的反证，
    取进来会让"别的轴很干净"冒充"下架这一条很可信"。没有证据支撑就返回 0
    让门控转人工，而不是拿别的题目的自报值凑一个数。
    """
    deps: Dict[str, List[str]] = {
        "hate_or_doxx_or_instruction": ["hate_targeted", "pii_real_person", "illegal_act_instruction"],
        "adult_or_violence_needs_label": ["age_rating", "sexual_content", "violence_gore", "self_harm"],
        "spam_only": ["spam_promotion"],
        "high_severity": ["severity"],
    }
    support = [
        _event_p(answers, n)
        for n in deps.get(rule_key, [])
        if n in answers and _event_p(answers, n) >= RISK_PRESENT
    ]
    return min(support) if support else 0.0


def gate(verdict: Verdict, policy: Policy, *, authoritative: bool) -> Tuple[str, str]:
    """最终动作。返回 (action, via)。

    `authoritative` 由引擎传入（它声明"我有没有资格执行不可逆动作"），
    Verdict 本身不带这个属性——一个裁决不能自己宣布自己可信。

    六条不可省的检查，顺序即优先级：
    1. 引擎弃权或出错 → 人工
    2. 引擎主动拒绝（超窗、语种不支持）→ 人工
    3. 命中 HUMAN_ONLY_CLAUSES → 人工（这类内容需要的是判断与上下文，不是自动下架）
    4. 引擎非权威 → 人工。确定性词表可以升级，不可以执行不可逆动作
    5. 未校准 → 人工。置信度没标定时它不是一个可比较的量
    最后才比阈值，且驳回的线高于通过的线（误伤用户比漏放更贵）。
    """
    if verdict.abstained:
        return ACTION_HUMAN, "engine_abstained"
    if verdict.error:
        return ACTION_HUMAN, f"engine_error:{verdict.error}"
    if verdict.refusal:
        # 「我没看全所以不能执行」与「置信度没标定」是两件事，报成同一件会让人
        # 去拟合温度表，而真正要做的是把长文分段。
        return ACTION_HUMAN, f"refusal:{verdict.refusal}"
    blocking = [c for c in verdict.clause_ids if c in HUMAN_ONLY_CLAUSES]
    if blocking:
        # 带上是哪条：运营在一队列里看到的 `human_only_clause` 若全都长一样，
        # 就无法回答"这条为什么不能自动"——而这条信息本来就在裁决里。
        return ACTION_HUMAN, f"human_only_clause:{blocking[0]}"
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

    # 规则自己就建议人工（例如成人/血腥需要定级、severity 偏高）。
    # 报成 "policy_default" 会把"哪条规则要求的"丢掉，而那正是队列要分流的信息。
    return ACTION_HUMAN, f"suggested_human:{verdict.rule or 'unknown'}"
