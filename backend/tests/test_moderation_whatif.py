"""阈值假设（what-if）的重放口径测试（ADR-028 · D13）。

这里不测模型、不测策略表本身——那些在 `test_moderation_engine.py`。
测的是"拿已落库的答案重放"这件事的三条口径：哪些案件有资格被重放、
一致/冲突按什么判、以及换一条线确实会改变结论（否则这面板只是装饰）。
"""

from __future__ import annotations

from uuid import uuid4

from app.domains.moderation.contracts import ACTION_APPROVE
from app.domains.moderation.models import ModerationCase
from app.domains.moderation.questions import QUESTIONS_VERSION
from app.domains.moderation.whatif import evaluate

#: 干净内容的答案：唯一压低"无风险置信度"的是 pii 那条轴，
#: 所以置信度正好落在 0.75 与 0.90 之间——换线必须改变结论，这才有可测性。
CLEAN = {
    "sexual_content": {"type": "noul", "noul": 0.01, "confidence": 0.99},
    "violence_gore": {"type": "noul", "noul": 0.01, "confidence": 0.99},
    "self_harm": {"type": "noul", "noul": 0.02, "confidence": 0.98},
    "hate_targeted": {"type": "noul", "noul": 0.01, "confidence": 0.99},
    "illegal_act_instruction": {"type": "noul", "noul": 0.01, "confidence": 0.99},
    "pii_real_person": {"type": "noul", "noul": 0.16, "confidence": 0.84},
    "spam_promotion": {"type": "noul", "noul": 0.03, "confidence": 0.97},
    "age_rating": {"type": "choice", "choice": "all", "confidence": 0.5,
                   "probabilities": {"all": 0.92, "teen": 0.06, "adult": 0.02}},
    "severity": {"type": "score", "score": 0.1, "confidence": 0.9,
                 "probabilities": {"0": 0.9, "1": 0.06, "2": 0.04}},
    "primary_clause": {"type": "choice", "choice": "none", "confidence": 0.9,
                       "probabilities": {"none": 0.9, "spam_promotion": 0.1}},
}


def case(state: str = "pending", *, answers=None, engine="laya:sidecar",
         calibrated=True, authoritative=True, questions_version=QUESTIONS_VERSION,
         subject_type="comment"):
    return ModerationCase(
        id=uuid4(), subject_type=subject_type, subject_id=f"w-{uuid4().hex[:8]}",
        author_id="a", fingerprint=f"fp-{uuid4().hex[:8]}", state=state,
        final_action="human_review", engine=engine, calibrated=calibrated,
        authoritative=authoritative, answers=dict(answers if answers is not None else CLEAN),
        questions_version=questions_version, policy_version="policy-1",
        clause_ids=[], reasons=[],
    )


def test_a_line_below_the_evidence_executes_and_above_it_does_not():
    """这条面板的存在理由：换线确实改变结论，而不是永远得到同一张全 0 表。"""
    low = evaluate([case(subject_type="project")], approve=0.75, reject=0.95)
    high = evaluate([case(subject_type="project")], approve=0.90, reject=0.95)

    assert low.evaluated == 1
    assert low.auto_approve == 1
    assert low.rows[0].hypothetical_action == ACTION_APPROVE
    assert 0.75 <= low.rows[0].confidence < 0.90, "前提：置信度要落在两条线之间"
    assert high.auto_approve == 0
    assert high.rows == [], "转人工的行不该回传给界面——它只会在列表里制造噪声"


def test_agreement_is_judged_only_against_human_disposition():
    """一致/冲突的裁判是人工处置：机器要放行、人当时下架 = 误放（conflict）。"""
    took_down = case(state="resolved", subject_type="project")
    false_alarm = case(state="dismissed", subject_type="project")
    untouched = case(state="pending", subject_type="project")

    report = evaluate([took_down, false_alarm, untouched], approve=0.75, reject=0.95)
    by_id = {r.case_id: r for r in report.rows}
    assert by_id[str(took_down.id)].agreement == "conflict"
    assert by_id[str(took_down.id)].human_outcome == "resolved"
    assert by_id[str(false_alarm.id)].agreement == "agree"
    assert by_id[str(untouched.id)].agreement == "undecided"
    assert (report.conflicts, report.agrees, report.undecided) == (1, 1, 1)


def test_undecided_is_reported_instead_of_padded():
    """没有人判过的行不许算进一致率——那个数字就是自动化的天花板。"""
    report = evaluate([case(subject_type="project")] * 3, approve=0.75, reject=0.95)
    assert (report.agrees, report.conflicts) == (0, 0)
    assert report.undecided == 3


def test_cases_without_replayable_answers_are_skipped_by_reason():
    """词表/旧题集/没有答案的案件必须被排除，并说明为什么。

    把它们算进来会得到一张看着合理其实错位的表：那正是参照实现那份
    "链级 bool 已标定" 的同类错误——分母里混着根本没参与的东西。
    """
    rows = [
        case(engine="lexicon"),                      # 词表没有类型化答案
        case(questions_version="questions-1"),        # 上一季题集的答案不属于这套题
        case(answers={}),                             # 有引擎名但什么都没存
        case(subject_type="project"),
    ]
    report = evaluate(rows, approve=0.75, reject=0.95)
    assert report.evaluated == 1
    assert sum(report.skipped.values()) == 3
    assert set(report.skipped) == {"引擎没给类型化答案", f"题集不是 {QUESTIONS_VERSION}",
                                   "案件没存答案"}


def test_unauthoritative_engine_never_executes_even_when_over_the_line():
    """过线只是必要条件：没有执行资格的引擎在这个面板里也必须停在转人工。"""
    weak = case(authoritative=False, subject_type="project")
    report = evaluate([weak], approve=0.75, reject=0.95)
    assert report.auto_approve == 0
    assert report.rows == []
    assert report.evaluated == 1, "它被评估过，只是结论是转人工"
    assert report.skipped == {}


def test_what_if_never_bypasses_the_per_kind_tightening():
    """面板上填 0.75，不等于评论也按 0.75 判——评论收紧到 0.95。

    同一条干净内容（置信 0.84）：作品侧会被假定的 0.75 放行，评论侧不会。
    如果哪天有人让 what-if 绕过 `_KIND_OVERRIDES`，这条就会红——
    那时它不再只是"一个数字的预览"，而是一个能教出错误直觉的工具。
    """
    same_evidence = 0.84
    as_project = evaluate([case(subject_type="project")], approve=0.75, reject=0.95)
    as_comment = evaluate([case(subject_type="comment")], approve=0.75, reject=0.95)

    assert as_project.auto_approve == 1
    assert as_project.rows[0].effective_approve == 0.75
    assert round(as_project.rows[0].confidence, 2) == same_evidence
    assert as_comment.auto_approve == 0, "评论仍按 0.95 判"
    assert as_comment.rows == []


def test_the_sample_size_is_distinct_content_not_case_count():
    """dev 库实测：292 条可回放只对应 32 篇不同稿子。案件数会被重复文本膨胀。

    这条断言钉的是"分母"——没有它，面板上一句"可回放 292 条"会被读成 n=292，
    而拟合与决策真正能依赖的只有 32。
    """
    a, b, c = case(), case(), case()
    a.fingerprint = b.fingerprint = "fp-duplicated"
    c.fingerprint = "fp-other"
    rep = evaluate([a, b, c], approve=0.75, reject=0.95)
    assert rep.evaluated == 3
    assert rep.distinct_contents == 2
    assert rep.distinct_contents <= rep.evaluated
