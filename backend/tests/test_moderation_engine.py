"""审核判断层的核心行为测试。

每条都对着参照实现的一个已核实缺陷写，因此它们在 Clearance 的原逻辑下会失败——
这是"青出于蓝"唯一可检验的形式：不是多加功能，是把原来会做错的地方做成做不对就不绿。
"""

from __future__ import annotations

import asyncio

import pytest

from app.domains.moderation.contracts import (
    ACTION_APPROVE,
    ACTION_HUMAN,
    ACTION_REJECT,
    ModerationSubject,
    Policy,
    Verdict,
)
from app.domains.moderation.engine import ModerationEngine, content_fingerprint
from app.domains.moderation.policy import decide_from_answers, gate
from app.domains.moderation.providers.laya_sidecar import LayaSidecarEngine
from app.domains.moderation.providers.lexicon import LexiconEngine
from app.domains.moderation.questions import normalize_answers


def subject(body: str = "一个关于雨夜港口的故事。", kind: str = "project") -> ModerationSubject:
    return ModerationSubject(kind=kind, object_id="o-1", title="夜航", body=body)


def clean_answers(**over):
    base = {
        "age_rating": {"choice": "all", "confidence": 0.97},
        "sexual_content": {"noul": 0.02},
        "violence_gore": {"noul": 0.03},
        "self_harm": {"noul": 0.01},
        "hate_targeted": {"noul": 0.01},
        "illegal_act_instruction": {"noul": 0.01},
        "pii_real_person": {"noul": 0.01},
        "spam_promotion": {"noul": 0.02},
        "severity": {"score": 0.0},
    }
    base.update(over)
    return base


class FakeSidecar(LayaSidecarEngine):
    """只替换传输，保留真实的 normalize + policy 路径（否则测的是假东西）。"""

    def __init__(self, answers, *, calibrated=True, error=None):
        super().__init__(base_url="http://sidecar.invalid")
        self._answers, self._calibrated, self._error = answers, calibrated, error

    def _decide(self, state):  # noqa: ARG002
        if self._error:
            raise self._error
        return {"ok": True, "answers": self._answers, "routing": {"model": "multilingual"},
                "calibrated": self._calibrated}


def decide(engine, s):
    return asyncio.run(engine.decide(s))


# ---------- 缺陷 1：幻觉/注入答案不得变成动作 ----------

def test_out_of_whitelist_choice_abstains_instead_of_becoming_approve():
    answers, problems = normalize_answers(clean_answers(age_rating={"choice": "approve_all", "confidence": 0.99}))
    assert problems, "白名单必须拒绝未声明的类别"
    assert "age_rating" not in answers


def test_hallucinated_category_cannot_auto_approve():
    """参照实现把不认识的 choice 兜成 'other'，而 'other' 在它的梯子里通向 AUTO_APPROVE。"""
    eng = ModerationEngine([FakeSidecar({"age_rating": {"choice": "no_risk_promise", "confidence": 0.99}})])
    out = decide(eng, subject())
    assert out.action == ACTION_HUMAN
    assert "abstain" in out.via or "engine_abstained" in out.via or "non_authoritative" in out.via


def test_out_of_range_probability_cannot_auto_reject():
    """fraud=9.0 在参照实现里 9.0 >= 0.85 直接 AUTO_REJECT；这里整条答案作废。"""
    eng = ModerationEngine([FakeSidecar(clean_answers(illegal_act_instruction={"noul": 9.0}))])
    out = decide(eng, subject())
    assert out.action == ACTION_HUMAN


def test_missing_answer_is_not_treated_as_benign():
    partial = clean_answers()
    del partial["hate_targeted"]
    answers, problems = normalize_answers(partial)
    assert any("hate_targeted" in p for p in problems)


# ---------- 缺陷 2：非权威引擎不得执行不可逆动作 ----------

def test_lexicon_hit_only_escalates_and_never_auto_rejects():
    eng = ModerationEngine([LexiconEngine()])
    out = decide(eng, subject("加微信领 返利群"))
    assert out.action == ACTION_HUMAN
    # 精确断言：词表命中后走的是"引擎不权威"这条线，不是阈值、不是校准
    assert out.via == "non_authoritative_engine"


def test_gate_blocks_irreversible_action_from_non_authoritative_engine():
    v = Verdict(action=ACTION_REJECT, confidence=0.99, engine="lexicon",
                clause_ids=["spam_promotion"], calibrated=True)
    action, via = gate(v, Policy(), authoritative=False)
    assert (action, via) == (ACTION_HUMAN, "non_authoritative_engine")


def test_uncalibrated_confidence_cannot_execute_anything():
    """没标定的 0.99 不是一个可比较的量——参照实现自己在 reasons 里承认 uncalibrated，
    却仍然让它去比阈值。"""
    v = Verdict(action=ACTION_APPROVE, confidence=0.99, engine="laya:sidecar", calibrated=False)
    assert gate(v, Policy(), authoritative=True) == (ACTION_HUMAN, "uncalibrated")


# ---------- 缺陷 3：阈值不得在 import 期冻结；驳回线必须高于通过线 ----------

def test_reject_line_is_stricter_than_approve_line():
    p = Policy(auto_approve_threshold=0.90, auto_reject_threshold=0.95)
    ok_v = Verdict(action=ACTION_APPROVE, confidence=0.93, engine="e", calibrated=True)
    bad_v = Verdict(action=ACTION_REJECT, confidence=0.93, engine="e", calibrated=True)
    assert gate(ok_v, p, authoritative=True)[0] == ACTION_APPROVE
    assert gate(bad_v, p, authoritative=True)[0] == ACTION_HUMAN


def test_kind_specific_policy_tightens_comments():
    base = Policy(auto_approve_threshold=0.90)
    assert base.resolved("comment").auto_approve_threshold == 0.95
    assert base.resolved("unknown_kind").auto_approve_threshold == 0.90
    assert "comment" in base.resolved("comment").version


# ---------- 缺陷 4：便宜引擎不许挡掉好引擎 ----------

def test_lexicon_hit_does_not_mask_the_model():
    eng = ModerationEngine([LexiconEngine(), FakeSidecar(clean_answers())])
    out = decide(eng, subject("加微信领 全新体验"))
    assert out.verdict.engine == "laya:sidecar"
    assert out.action == ACTION_APPROVE
    assert any(p.startswith("lexicon") for p in out.prior_reasons)


def test_human_only_clause_vetoes_auto_action_even_at_high_confidence():
    """仇恨/隐私/违法教程需要的是判断与上下文，不是自动下架。"""
    answers, problems = normalize_answers(clean_answers(hate_targeted={"noul": 0.99}))
    assert problems == []
    v = decide_from_answers(answers, engine="laya:sidecar", calibrated=True)
    action, via = gate(v, Policy(), authoritative=True)
    assert action == ACTION_HUMAN
    assert via == "human_only_clause"


def test_all_engines_silent_means_human_never_approve():
    class Shy:
        name, authoritative = "shy", False

        def health_check(self):
            return True

        def moderate(self, s):
            return Verdict.abstain(self.name, "no signal")

    out = decide(ModerationEngine([Shy()]), subject())
    assert out.action == ACTION_HUMAN


def test_sidecar_down_degrades_to_human_without_raising():
    import urllib.error

    eng = ModerationEngine([FakeSidecar({}, error=urllib.error.URLError("refused"))])
    out = decide(eng, subject())
    assert out.action == ACTION_HUMAN


def test_overlong_content_is_not_truncated_then_auto_decided():
    eng = ModerationEngine([FakeSidecar(clean_answers())])
    out = decide(eng, subject("雨" * 7000))
    assert out.action == ACTION_HUMAN
    assert "窗口" in " ".join(out.verdict.reasons)


# ---------- 可复现与幂等 ----------

def test_same_content_and_policy_is_decided_once():
    eng = ModerationEngine([FakeSidecar(clean_answers())])
    first = decide(eng, subject("同一篇稿子"))
    second = decide(eng, subject("同一篇稿子"))
    assert first.dedupe_hit is False
    assert second.dedupe_hit is True
    assert second.via == first.via


def test_outcome_carries_versions_for_reproduction():
    out = decide(ModerationEngine([FakeSidecar(clean_answers())]), subject())
    assert out.questions_version.startswith("questions-")
    assert out.policy_version.startswith("policy-")
    assert out.verdict.answers, "落库必须带原始类型化答案，否则误判无法复盘"


def test_fingerprint_includes_policy_and_question_versions():
    s = subject("abc")
    a = content_fingerprint(s, Policy(version="policy-1"))
    b = content_fingerprint(s, Policy(version="policy-2"))
    assert a != b
