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
from app.domains.moderation.questions import build_questions, normalize_answers


def subject(body: str = "一个关于雨夜港口的故事。", kind: str = "project") -> ModerationSubject:
    return ModerationSubject(kind=kind, object_id="o-1", title="夜航", body=body)


def clean_answers(**over):
    """按 sidecar 实测的**真实载荷形状**造假答案，不是按我们希望它长什么样。

    choice / score 都带 `probabilities`，且 `confidence` 是 Laya 实际的算法
    （1−归一化熵）算出来的自洽值：策略层读的是向量而不是这个自报值，
    fixture 若不给向量，测到的就只是降级分支。
    """
    base = {
        "age_rating": {"choice": "all", "confidence": 0.97,
                       "probabilities": {"all": 0.96, "teen": 0.02, "adult": 0.02}},
        "sexual_content": {"noul": 0.02},
        "violence_gore": {"noul": 0.03},
        "self_harm": {"noul": 0.01},
        "hate_targeted": {"noul": 0.01},
        "illegal_act_instruction": {"noul": 0.01},
        "pii_real_person": {"noul": 0.01},
        "spam_promotion": {"noul": 0.02},
        "severity": {"score": 0.0, "confidence": 1.0,
                     "probabilities": {"0": 1.0, "1": 0.0, "2": 0.0}},
        "primary_clause": {"choice": "none", "confidence": 0.4644,
                           "probabilities": {"none": 0.72, "sexual_explicit": 0.06,
                                             "gratuitous_violence": 0.05,
                                             "self_harm_unsafe": 0.04,
                                             "hate_incitement": 0.04,
                                             "illegal_instruction": 0.05,
                                             "doxxing": 0.03, "spam_promotion": 0.01}},
    }
    base.update(over)
    return base


class FakeSidecar(LayaSidecarEngine):
    """只替换传输，保留真实的 normalize + policy 路径（否则测的是假东西）。"""

    def __init__(self, answers, *, calibrated=True, error=None,
                 calibrated_questions=None, model_version="laya:test+T0000", healthy=True):
        super().__init__(base_url="http://sidecar.invalid")
        self._answers, self._calibrated, self._error = answers, calibrated, error
        self._questions = calibrated_questions
        self._healthy = healthy
        # 真实实现会去 GET /health 探温度表；单元测试里那是一次无谓的网络往返，
        # 而且它现在参与幂等键，所以必须可控（下面那条测试要翻它）。
        self._mv = model_version

    def model_version(self) -> str:
        return self._mv

    def health_check(self) -> bool:
        # 假引擎不碰网络：继承来的实现会去 GET sidecar.invalid/health，
        # 解析失败在部分机器上不是"立刻返回 False"而是等满 1.5s 超时——
        # 实测同一套测试在 1.5s 与 51s 之间跳过一次，就是这个不确定性。
        return self._healthy

    def _decide(self, state):  # noqa: ARG002
        if self._error:
            raise self._error
        res = {"ok": True, "answers": self._answers, "routing": {"model": "multilingual"}}
        if self._questions is not None:
            res["calibrated_questions"] = list(self._questions)
        elif self._calibrated:
            res["calibrated_questions"] = sorted(build_questions())
        return res


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
    # 理由文本是给运营读的，不是给 grep 读的：规则名与动作都要落成人话。
    # 结构化的机读值另有去处（`via`、`rule`、`final_action` 字段），不靠这里承载。
    joined = " ".join(out.verdict.reasons)
    assert "rule=" not in joined and ACTION_APPROVE not in joined
    assert "自动通过" in joined
    assert "前面的引擎 lexicon" in joined


def test_human_only_clause_vetoes_auto_action_even_at_high_confidence():
    """仇恨/隐私/违法教程需要的是判断与上下文，不是自动下架。

    via 必须点出是哪条条款：一队列里全是 "human_only_clause" 时，
    运营无法区分"这条是隐私"和"那条是违法教程"，而处置口径本来就不一样。
    """
    answers, problems = normalize_answers(clean_answers(hate_targeted={"noul": 0.99}))
    assert problems == []
    v = decide_from_answers(answers, engine="laya:sidecar", calibrated=True)
    assert v.confidence >= Policy().auto_reject_threshold, "前提：不否决的话它会自动驳回"
    assert v.rule == "hate_or_doxx_or_instruction"
    action, via = gate(v, Policy(), authoritative=True)
    assert action == ACTION_HUMAN
    assert via == "human_only_clause:hate_incitement"


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
    # via 是队列上唯一可见的理由字段。只断言 action 的话，这条会被显示成
    # "置信度未校准"——运营会去重拟温度表，而真正要做的是把长文分段。
    assert out.via.startswith("refusal:over_length:")


# ---------- 可复现与幂等 ----------

def test_same_content_and_policy_is_decided_once():
    eng = ModerationEngine([FakeSidecar(clean_answers())])
    first = decide(eng, subject("同一篇稿子"))
    second = decide(eng, subject("同一篇稿子"))
    assert first.dedupe_hit is False
    assert second.dedupe_hit is True
    assert second.via == first.via
    # 缓存命中是"重建一个 Outcome"，逐字段写就会漏——曾经漏掉这两个，
    # 于是服务层把"重复审同一篇"读成"结论变了"（资格从 True 掉到 False）。
    assert (second.authoritative, second.calibrated) == (first.authoritative, first.calibrated)
    assert second.authoritative is True and second.calibrated is True


def test_refitting_the_table_redecides_through_the_cache():
    """上面那条测试的另一半：温度表换了，同一篇稿子必须重新判，不能再命中缓存。

    只测 `content_fingerprint` 是测不到的——真正的风险在调用点忘了传 model_versions。
    """
    provider = FakeSidecar(clean_answers())
    eng = ModerationEngine([provider])
    s = subject("同一篇稿子")
    decide(eng, s)
    assert decide(eng, s).dedupe_hit is True
    provider._mv = "laya:test+T9999"  # 模拟重拟温度表
    assert decide(eng, s).dedupe_hit is False


def test_outcome_carries_versions_for_reproduction():
    out = decide(ModerationEngine([FakeSidecar(clean_answers())]), subject())
    assert out.questions_version.startswith("questions-")
    assert out.policy_version.startswith("policy-")
    assert out.verdict.answers, "落库必须带原始类型化答案，否则误判无法复盘"


def test_fingerprint_includes_policy_and_question_versions():
    s = subject("abc")
    a = content_fingerprint(s, Policy(version="policy-1"), ("lexicon=v1",))
    b = content_fingerprint(s, Policy(version="policy-2"), ("lexicon=v1",))
    assert a != b


def test_refitting_the_temperature_table_invalidates_the_key():
    """重拟温度表 = 置信度换了标尺 = 旧结论不能再以新模型的名义复用。

    这条键如果只含 policy 与题集版本，那么"改了 calibration.json"在幂等键上
    完全不可见：同一篇稿子会永久命中旧裁决，而队列显示的却是新配置。
    """
    s = subject("同一篇稿子")
    p = Policy()
    before = content_fingerprint(s, p, ("laya:sidecar=multilingual+Taaaa",))
    after = content_fingerprint(s, p, ("laya:sidecar=multilingual+Tbbbb",))
    assert before != after


# ---------- 置信度量纲（真机 Laya 接通后测出的缺陷） ----------

#: sidecar 实测原文（多语 checkpoint，一段干净的中文散文，state 用生产同款
#: title/body 形状——用 `text` 键会让答案变成 self_harm 0.89，那是我的调用错了，
#: 不是模型的行为）。保留原样的 probabilities 与自报 confidence，
#: 改一个数字这条测试就失去意义。
MEASURED_CLEAN_PROSE = {
    "age_rating": {"type": "choice", "confidence": 0.0655,
                   "probabilities": {"all": 0.4965, "teen": 0.3139, "adult": 0.1897},
                   "choice": "all"},
    "sexual_content": {"type": "noul", "noul": 0.0013, "confidence": 0.9987},
    "violence_gore": {"type": "noul", "noul": 0.0025, "confidence": 0.9975},
    "self_harm": {"type": "noul", "noul": 0.0039, "confidence": 0.9961},
    "hate_targeted": {"type": "noul", "noul": 0.0011, "confidence": 0.9989},
    "illegal_act_instruction": {"type": "noul", "noul": 0.0, "confidence": 1.0},
    "pii_real_person": {"type": "noul", "noul": 0.0505, "confidence": 0.9495},
    "spam_promotion": {"type": "noul", "noul": 0.0007, "confidence": 0.9993},
    "severity": {"type": "score", "confidence": 0.2103, "score": 0.7838,
                 "probabilities": {"0": 0.3001, "1": 0.616, "2": 0.0839}},
    # 单选在这段干净稿子上给出 self_harm_unsafe 0.73：**错而自信**。
    # 这就是它只能当归因建议、不能进规则表或门控的实测理由（七条轴一致报低才是对的）。
    "primary_clause": {"type": "choice", "confidence": 0.6177, "choice": "self_harm_unsafe",
                       "probabilities": {"sexual_explicit": 0.04, "gratuitous_violence": 0.0101,
                                         "self_harm_unsafe": 0.7298, "hate_incitement": 0.0028,
                                         "illegal_instruction": 0.0013, "doxxing": 0.0047,
                                         "spam_promotion": 0.0021, "none": 0.2094}},
}


def test_choice_confidence_is_not_used_as_a_probability():
    """Laya 对 choice 自报的 0.0655 是 1−归一化熵，不是"这次判对的概率"。

    旧的 approve 置信度直接取它，于是自动通过线（0.90）在数学上永远够不到——
    链里有权威引擎也一样 auto_rate=0。正确做法是从向量算 P(不是成人)=1−0.1897=0.8103。
    """
    answers, problems = normalize_answers(MEASURED_CLEAN_PROSE)
    assert problems == []
    v = decide_from_answers(answers, engine="laya:test", calibrated=True)
    assert v.action == ACTION_APPROVE
    assert v.confidence == pytest.approx(1.0 - 0.1897, abs=1e-4)
    assert gate(v, Policy(), authoritative=True)[0] == ACTION_HUMAN  # 0.81 < 0.90
    assert gate(v, Policy(0.80, 0.95), authoritative=True)[0] == ACTION_APPROVE


def test_primary_clause_is_advisory_and_never_reaches_the_gate():
    """单选条款在这里判成 self_harm_unsafe 0.73，但它不许影响动作或条款。

    这条断言是 D3 的边界：单选题整体归因更准（52.9% vs 41.2%），
    可它在干净稿子上会给出自信的错误条款——一旦进规则表，
    它比"七条轴一致报低"更容易误伤。
    """
    answers, _ = normalize_answers(MEASURED_CLEAN_PROSE)
    v = decide_from_answers(answers, engine="laya:test", calibrated=True)
    assert "self_harm_unsafe" not in v.clause_ids
    assert v.rule == "no_risk"
    assert v.action == ACTION_APPROVE


def test_severity_is_never_a_content_clause():
    """severity 是量级轴（clause_id=None）。历史上规则表把它的问题名当条款发出去了。"""
    from app.domains.moderation.policy import RULES
    from app.domains.moderation.questions import REGISTERED_CLAUSES

    answers, _ = normalize_answers(clean_answers(
        severity={"score": 2.0, "confidence": 0.9,
                  "probabilities": {"0": 0.0, "1": 0.05, "2": 0.95}},
        hate_targeted={"noul": 0.97},
    ))
    for rule in RULES:
        emitted = rule.clauses(answers)
        assert set(emitted) <= REGISTERED_CLAUSES, f"{rule.key} 发出了未注册条款 {emitted}"
    v = decide_from_answers(answers, engine="laya:test")
    assert "severity" not in v.clause_ids
    assert "hate_incitement" in v.clause_ids


def test_score_answer_without_self_reported_confidence_is_rejected():
    """缺置信度不是"小问题"：温度拟合要的就是每条答案的自报值，缺了就无法标定。"""
    payload = clean_answers()
    payload["severity"] = {"score": 1.4}
    _, problems = normalize_answers(payload)
    assert any("severity" in p for p in problems)


def test_partially_calibrated_chain_cannot_execute():
    """标定是逐题的：3/9 条轴有温度表时整条链仍然只能转人工。

    参照实现回一个链级 bool（"有任一 T≠1 生效"），这种部分标定会被报成"已标定"，
    于是没标定的那六条轴的置信度被当成可比较的量拿去执行不可逆动作。
    """
    partial = ["age_rating", "severity", "spam_promotion"]
    eng = ModerationEngine([FakeSidecar(clean_answers(), calibrated_questions=partial)])
    out = decide(eng, subject())
    assert out.action == ACTION_HUMAN
    assert out.calibrated is False
    assert any(r.startswith("未标定轴：") for r in out.verdict.reasons)


def test_sidecar_without_coverage_field_is_treated_as_uncalibrated():
    """旧 sidecar 不报覆盖列表时按未标定处理，不给"没上报=已标定"留空子。"""

    class Legacy(FakeSidecar):
        def _decide(self, state):  # noqa: ARG002
            res = super()._decide(state)
            res.pop("calibrated_questions")
            res["calibrated"] = True  # 参照实现那个不可信的链级 bool
            return res

    out = decide(ModerationEngine([Legacy(clean_answers())]), subject())
    assert out.action == ACTION_HUMAN
    assert out.calibrated is False


def test_calibration_reports_flag_questions_stuck_at_the_grid_ceiling():
    """T 坐在搜索上限上不是"标定完成"，是"想更正但网格不允许"。

    这一条决定了 10/10 覆盖是不是真绿灯：实测当前温度表里有题就是顶格的，
    而顶格那几题的置信度仍然虚高——界面必须把它和"缺题"分开说。
    """
    from app.domains.moderation.providers.laya_sidecar import LayaSidecarEngine
    from app.domains.moderation.questions import build_questions

    def engine_with(cal):
        e = LayaSidecarEngine(base_url="http://127.0.0.1:1")
        e._health = lambda: {"ok": True, "calibration": cal}  # type: ignore[method-assign]
        return e

    rep = engine_with({
        "questions": ["spam_promotion", "severity", "age_rating"],
        "T": {"spam_promotion": 2.35, "severity": 5.0, "age_rating": 1.4},
        "grid_max": 5.0,
        "path": "/tmp/calibration.json",
    }).calibration()
    assert rep["censored"] == ["severity"]
    assert len(rep["missing"]) == len(build_questions()) - 3

    # 旧 sidecar 不报 grid_max：不猜哪些被截断，宁可显示"未上报"
    legacy = engine_with({"questions": ["severity"], "T": {"severity": 5.0}}).calibration()
    assert legacy["censored"] == [] and legacy["grid_max"] == 0.0


def test_unreachable_sidecar_reports_every_declared_question_missing():
    from app.domains.moderation.providers.laya_sidecar import LayaSidecarEngine
    from app.domains.moderation.questions import build_questions

    e = LayaSidecarEngine(base_url="http://127.0.0.1:1")
    e._health = lambda: None  # type: ignore[method-assign]
    rep = e.calibration()
    assert rep["reachable"] is False
    assert rep["missing"] == rep["declared"] == sorted(build_questions())
