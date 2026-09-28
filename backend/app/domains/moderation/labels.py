""""人工处置 → 拟合样本"的那一份换算（单一权威）。

为什么这个模块在 domain 里而不是 `eval/export_labels.py` 里：
这份换算有两个消费者——离线的导出脚本，和中台面板上的"这条轴现在有几个可拟样本"。
两边各写一遍迟早会一天只改一份，而它两不一致的表现是**面板报有样本、拟合拿到 0 条**
（或者反过来），那恰好是最难发现的一类错：两端都在报数，只是报的不是同一件事。
所以这里放唯一定义，脚本与 API 都从这里取。

`clauses` 的语义是"人背书过的条款集合"，不是"机器报过的条款"，两种来源分开标记
（`label_kind`）：
- `explicit`：处置时逐轴勾过（`human_clauses` 非 NULL，**含空列表**）。
  空列表是这批数据里最值钱的负样本——人明确说"机器报的条款一个都不成立"。
- `endorsed`：没勾过。`resolved` → 机器当时标的条款原样带出；`dismissed` → 空集，
  于是七条轴各记一个 0（过报应当付出的代价）。
  这一类的正样本永远只覆盖"机器自己想到的那些轴"：漏报变不出正样本，所以它拟出来的
  温度偏乐观。`endorsed` 占比高就说明该去补勾选，而不是急着放宽门控。
"""

from __future__ import annotations

from typing import Dict, List, Sequence, Tuple

from app.domains.moderation.models import (
    ModerationCase,
    STATE_DISMISSED,
    STATE_RESOLVED,
)
from app.domains.moderation.questions import clause_for, question_types

#: 人工结论 → 期望动作。`dismissed` 表示"机器报错了"，即该内容其实可放行。
OUTCOME_TO_EXPECTED = {STATE_RESOLVED: "reject", STATE_DISMISSED: "approve"}


def case_payload(r: ModerationCase) -> dict:
    """一条导出行。**键名必须与 `eval/moderation_samples.jsonl` 一致**——
    拟合与评测读的是同一套键（`clauses` / `answers` / `expected`），
    少一个键 `calibrate.py` 不会报错而是**整行跳过**（它明写"没有条款标注的行
    不能凭空当成七条轴都不存在"）。

    一个必须说清的偏差：`endorsed` 那条来源拿到的正样本永远只覆盖"机器自己想到的那些轴"，
    所以它低估假阳性、拟出来的温度偏乐观。要拿掉这个偏差得靠逐轴勾选（D23 已上线）。
    """
    # getattr 不是兜底而是契约：测试与脚本会拿 SimpleNamespace 假冒案件进来，
    # 而"这一列缺省＝没勾过"正是有定义的第三种状态（见模块 docstring 的 label_kind）。
    explicit = getattr(r, "human_clauses", None) is not None
    if explicit:
        clauses = list(r.human_clauses)
    elif r.state == STATE_RESOLVED:
        clauses = list(r.clause_ids)
    else:
        clauses = []
    return {
        "case_id": str(r.id),
        "subject_type": r.subject_type,
        "subject_id": r.subject_id,
        "engine": r.engine,
        "answers": r.answers,
        "clauses": clauses,
        "label_kind": "explicit" if explicit else "endorsed",
        "expected": OUTCOME_TO_EXPECTED.get(r.state, "human_review"),
        "human_state": r.state,
        "policy_version": r.policy_version,
        "questions_version": r.questions_version,
        "calibrated_at_decide": r.calibrated,
    }


def labelled(cases: Sequence[ModerationCase]) -> List[ModerationCase]:
    """只有被人处置过的案件才是标注。`pending` 不是"负样本"，是"没人看过"。"""
    return [c for c in cases if c.state in (STATE_RESOLVED, STATE_DISMISSED)]


def _usable_pair(r: ModerationCase, question: str) -> Tuple[bool, bool, bool]:
    """这一行对这条轴算不算样本、算不算正样本、是不是逐轴勾过的。

    样本的判据抄的是拟合侧那一条：`calibrate.py --from-answers` 只读**缩放前**那份分布，
    缺 `raw` 的行整行丢掉。所以面板这里也不能把旧形状的行算进"可拟样本"——
    它处置完并不会给温度表添一格，那正是 D26 要在界面上说破的事。
    （`eval/export_labels.fit_readiness` 那个计数更宽松：它读缩放后那份，会把旧行也算进去。
    两个数不一样是有意的，面板取的是生产路径真会用到的那个。）
    """
    payload = case_payload(r)
    ans = (payload["answers"] or {}).get(question) or {}
    raw = ans.get("raw")
    if not isinstance(raw, dict):
        return (False, False, False)
    axis_clause = clause_for(question)
    return (True, bool(axis_clause) and axis_clause in payload["clauses"],
            payload["label_kind"] == "explicit")


def axis_label_counts(cases: Sequence[ModerationCase]) -> Dict[str, Dict[str, int]]:
    """逐轴报「可拟样本 / 其中正样本 / 表态来源」。kind 计数决定下一步是补勾选还是补处置。"""
    rows = labelled(cases)
    out: Dict[str, Dict[str, int]] = {}
    for question, qtype in question_types().items():
        if qtype != "noul":
            continue
        samples = positives = explicit = 0
        for c in rows:
            usable, positive, is_explicit = _usable_pair(c, question)
            if not usable:
                continue
            samples += 1
            positives += int(positive)
            explicit += int(is_explicit)
        out[question] = {"samples": samples, "positives": positives, "explicit": explicit}
    return out
