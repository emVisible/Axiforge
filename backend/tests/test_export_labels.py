"""导出侧与拟合侧的键契约。

对不上时 `calibrate.py` 的行为是**整行跳过**而不是报错（它明写"没有条款标注的行
不能凭空当成七条轴都不存在"），所以这条链断了以后不会有任何红——
只会让"攒够标注 → 重拟温度表"这条路在攒够之后发现拟出一张空表。
"""

from __future__ import annotations

from types import SimpleNamespace

from eval.calibrate import binary_pairs
from eval.export_labels import case_payload, fit_readiness

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


def test_readiness_reports_samples_and_positives_per_axis():
    rows = [case_payload(_case("resolved", ["sexual_explicit"])),
            case_payload(_case("dismissed", ["sexual_explicit"]))]
    ready = fit_readiness(rows)
    assert ready["sexual_content"] == {"type_noul": 1, "samples": 2, "positives": 1}


def test_readiness_exposes_the_zero_sample_axis_before_the_fit_does():
    """这条就是 D18 那个坑的 tripwire：键没导出时拟合侧整行跳过，
    而 readiness 必须**在跑 calibrate 之前**把"这轴一条都拟不动"说出来。"""
    rows = [case_payload(_case("resolved", ["sexual_explicit"]))]
    for r in rows:
        r.pop("clauses")
    ready = fit_readiness(rows)
    noul = [n for n, q in ready.items() if q["type_noul"]]
    assert noul, "前提：题集里得有 noul 轴"
    assert all(ready[n]["samples"] == 0 for n in noul), ready


def test_readiness_counts_distribution_backed_rows_for_choice_axes():
    """choice/score 轴要的是整条分布，只有标量的行拟不动——报出来才算说清。"""
    answers = {"age_rating": {"type": "choice", "choice": "all", "confidence": 0.9,
                             "probabilities": {"all": 0.9, "teen": 0.05, "adult": 0.05}}}
    with_probs = case_payload(_case("resolved", []))
    with_probs["answers"] = answers
    bare = case_payload(_case("resolved", []))
    bare["answers"] = {"age_rating": {"type": "choice", "choice": "all", "confidence": 0.9}}
    assert fit_readiness([with_probs, bare])["age_rating"]["samples"] == 1


def test_the_raw_distribution_survives_the_snapshot_without_breaking_replay():
    """落库要同时留两份：门控读缩放后那份（与人当时看到的一致），拟合读 raw。

    多带一个 `raw` 键不许让快照失去可回放性——what-if 走的是 `normalize_answers`，
    它一旦把这个键当成越界答案，整条案件就会从重放里消失。
    （这条测试顺带量到一个事实：`normalize_answers` 要求**题集齐全**，只放一题的快照
    会被判成「缺少 X 的答案」——所以这里必须造满 10 题。）
    """
    from app.domains.moderation.contracts import Answer, Verdict
    from app.domains.moderation.questions import (
        ALLOWED_CHOICE,
        BOOL_QUESTIONS,
        normalize_answers,
        question_types,
    )
    from app.domains.moderation.service import _answer_snapshot

    answers, raw = {}, {}
    for name, qtype in question_types().items():
        if qtype == "noul":
            answers[name] = Answer(name, "noul", 0.75, 0.75, 0.75)
            raw[name] = {"type": "noul", "noul": 0.42}
        elif qtype == "score":
            answers[name] = Answer(name, "score", 1.0, 0.8, {"0": 0.2, "1": 0.6, "2": 0.2})
            raw[name] = {"type": "score", "score": 0.9,
                         "probabilities": {"0": 0.3, "1": 0.5, "2": 0.2}}
        else:
            pick = sorted(ALLOWED_CHOICE[name])[0]
            answers[name] = Answer(name, "choice", pick, 0.9, {pick: 0.9})
            raw[name] = {"type": "choice", "choice": pick, "probabilities": {pick: 0.7}}

    snap = _answer_snapshot(Verdict(answers=answers, raw_answers=raw))
    assert snap["sexual_content"]["noul"] == 0.75, "回放用的仍是缩放后那份"
    assert snap["sexual_content"]["raw"]["noul"] == 0.42

    back, problems = normalize_answers(snap)
    assert problems == [], f"多一个 raw 键不该让快照不可回放：{problems}"
    assert float(back["sexual_content"].value) == 0.75
    assert BOOL_QUESTIONS, "前提：题集里得有二元轴"


def test_from_answers_mode_fits_on_the_pre_scaling_distribution():
    """`--from-answers` 的判据：拿到的概率必须是缩放前的，缺 raw 的行整行丢。"""
    from eval.calibrate import binary_pairs, samples_from_rows

    rows = [
        {"answers": {"sexual_content": {"type": "noul", "noul": 0.75, "confidence": 0.75,
                                       "raw": {"type": "noul", "noul": 0.42}}},
         "clauses": ["sexual_explicit"]},
        {"answers": {"sexual_content": {"type": "noul", "noul": 0.75, "confidence": 0.75}},
         "clauses": []},
    ]
    samples, dropped = samples_from_rows(rows)
    assert dropped == 1, "没有 raw 的行不能拿缩放后的值顶替——那是两次缩放的复合"
    assert len(samples) == 1
    pairs = binary_pairs(samples, "sexual_content")
    assert pairs == [(0.42, 1)], pairs
