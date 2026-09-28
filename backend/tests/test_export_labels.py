"""导出侧与拟合侧的键契约。

对不上时 `calibrate.py` 的行为是**整行跳过**而不是报错（它明写"没有条款标注的行
不能凭空当成七条轴都不存在"），所以这条链断了以后不会有任何红——
只会让"攒够标注 → 重拟温度表"这条路在攒够之后发现拟出一张空表。
"""

from __future__ import annotations

from types import SimpleNamespace

from eval.calibrate import binary_pairs
from eval.export_labels import case_payload

ANSWERS = {
    "sexual_content": {"type": "noul", "noul": 0.91, "confidence": 0.91},
    "hate_targeted": {"type": "noul", "noul": 0.02, "confidence": 0.98},
}


def _case(state: str, clauses: list) -> SimpleNamespace:
    return SimpleNamespace(
        id="c-1", subject_type="comment", subject_id="s-1", engine="laya:sidecar",
        answers=ANSWERS, clause_ids=clauses, state=state,
        policy_version="policy-1", questions_version="questions-3", calibrated=True,
    )


def test_a_resolved_disposition_endorses_the_flagged_clauses():
    row = case_payload(_case("resolved", ["sexual_explicit"]))
    assert row["clauses"] == ["sexual_explicit"]
    assert row["expected"] == "reject"


def test_a_dismissed_disposition_denies_them():
    """误报被认下来的代价必须是各轴记 0，否则过报的轴永远拿不到负样本。"""
    row = case_payload(_case("dismissed", ["sexual_explicit"]))
    assert row["clauses"] == []
    assert row["expected"] == "approve"


def test_exported_rows_feed_the_fitter_with_both_label_directions():
    """这条是真判据：拟合侧要能同时拿到 1 和 0，而不是把整批行跳过。"""
    samples = [
        (case_payload(_case("resolved", ["sexual_explicit"])), ANSWERS),
        (case_payload(_case("dismissed", ["sexual_explicit"])), ANSWERS),
    ]
    pairs = binary_pairs(samples, "sexual_content")
    assert [lab for _, lab in pairs] == [1, 0], pairs
    assert [round(p, 2) for p, _ in pairs] == [0.91, 0.91]
