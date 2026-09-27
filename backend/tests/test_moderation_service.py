"""案件生命周期：同一篇内容重复送审时会发生什么（ADR-028 §12）。

引擎层的判定正确性在 `test_moderation_engine.py`，HTTP 跨层在 `test_moderation_api.py`。
这里管的是两者都够不到的一段：内容指纹命中已有案件之后，
**这一次模型调用得出的新结论去哪儿了**。旧代码把它丢了——队列里会永远挂着旧裁决，
而重拟温度表恰恰是要它变的时机。
"""

from __future__ import annotations

import uuid
from dataclasses import replace
from typing import Optional

import pytest
from sqlalchemy import delete, select

from app.domains.moderation.contracts import (
    ACTION_APPROVE,
    ACTION_HUMAN,
    ModerationSubject,
    Policy,
    Verdict,
)
from app.domains.moderation.engine import ModerationEngine
from app.domains.moderation.models import (
    ModerationCase,
    ModerationDecisionLog,
    STATE_AUTO_CLOSED,
    STATE_PENDING,
    STATE_RESOLVED,
)
from app.domains.moderation.service import ModerationService


class Switchable:
    """假引擎：结论可以中途换，用来模拟"标定/策略变了，同一篇稿子不再同一个结论"。

    `model_version` 跟着结论走是有意的——生产上"结论变了"正是通过模型状态变化
    进入幂等键的（ADR-028 §12）。若这里返回常量，engine 的缓存会让第二次判定
    直接吐回旧结论，测到的就不是服务层而是缓存。
    """

    name = "fake:model"
    authoritative = True

    def __init__(self, verdict: Verdict) -> None:
        self.verdict = verdict

    def model_version(self) -> str:
        v = self.verdict
        return f"fake:{v.action}:{v.confidence:.2f}:{int(v.calibrated)}"

    def health_check(self) -> bool:
        return True

    def moderate(self, subject: ModerationSubject) -> Verdict:  # noqa: ARG002
        return self.verdict


def _verdict(action: str, *, confidence: float, calibrated: bool) -> Verdict:
    return Verdict(action=action, confidence=confidence, engine="fake:model",
                   calibrated=calibrated, rule="manual_test")


async def _logs(db, case_id) -> list:
    """按 created_at 取，不能按 id：`id` 是 uuid4，按它排序等于随机。
    （表上建的也是 (case_id, created_at) 索引——判定历史本来就按时间读。）"""
    rows = await db.execute(
        select(ModerationDecisionLog)
        .where(ModerationDecisionLog.case_id == case_id)
        .order_by(ModerationDecisionLog.created_at)
    )
    return list(rows.scalars())


async def _purge(db, subject_id: str) -> None:
    """测试自带清理：这些行落在真库上，不清就会被下一次运行当成重复指纹冲突。"""
    await db.execute(delete(ModerationDecisionLog).where(
        ModerationDecisionLog.case_id.in_(
            select(ModerationCase.id).where(ModerationCase.subject_id == subject_id))))
    await db.execute(delete(ModerationCase).where(ModerationCase.subject_id == subject_id))
    await db.commit()


@pytest.mark.asyncio
async def test_repeated_review_of_unchanged_conclusion_stays_one_case(db_session):
    switch = Switchable(_verdict(ACTION_HUMAN, confidence=0.4, calibrated=False))
    svc = ModerationService(db_session, ModerationEngine([switch], Policy()))
    subject_id = f"life-{uuid.uuid4().hex[:8]}"
    try:
        first: Optional[ModerationCase] = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="雨落下来")
        second = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="雨落下来")
        await db_session.commit()

        assert first is not None and second is not None
        assert second.id == first.id, "同一内容同一结论不该再开一条案件"
        logs = await _logs(db_session, first.id)
        assert [bool(x.dedupe_hit) for x in logs] == [False, True]
    finally:
        await _purge(db_session, subject_id)


@pytest.mark.asyncio
async def test_changed_conclusion_updates_the_case_instead_of_being_dropped(db_session):
    """命中旧案件 ≠ 结论相同。温度表重拟后必须看见新结论。"""
    switch = Switchable(_verdict(ACTION_HUMAN, confidence=0.4, calibrated=False))
    svc = ModerationService(db_session, ModerationEngine([switch], Policy()))
    subject_id = f"life-{uuid.uuid4().hex[:8]}"
    try:
        case = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="很干净的一篇")
        assert case is not None and case.state == STATE_PENDING
        await db_session.commit()

        # 标定到位、置信度过通过线：这一次它真的有资格自动放行
        switch.verdict = _verdict(ACTION_APPROVE, confidence=0.99, calibrated=True)
        again = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="很干净的一篇")
        await db_session.commit()

        assert again is not None
        assert again.id == case.id, "更新既有案件，不再开第二条"
        assert again.final_action == ACTION_APPROVE
        assert again.calibrated is True
        assert again.state == STATE_AUTO_CLOSED, "旧行为会把它留在待人工，显示的还是旧结论"
        logs = await _logs(db_session, case.id)
        assert [bool(x.dedupe_hit) for x in logs] == [False, False]
        assert logs[-1].action == ACTION_APPROVE
    finally:
        await _purge(db_session, subject_id)


@pytest.mark.asyncio
async def test_engine_refusal_does_not_open_a_queue_case(db_session):
    """引擎主动拒绝（正文超窗）不该变成一条人工案件。

    作品正文动辄上万字，若每条拒绝都占一个队列名额，接上保存路径的那一刻
    就是把队列灌满的那一刻——而那些行的真实状态是"机器没看"，人无从处置。
    """
    switch = Switchable(Verdict(action=ACTION_HUMAN, confidence=0.0, engine="fake:model",
                                refusal="over_length:7003>6000"))
    svc = ModerationService(db_session, ModerationEngine([switch], Policy()))
    subject_id = f"life-{uuid.uuid4().hex[:8]}"
    try:
        case = await svc.review(
            subject_type="project", subject_id=subject_id, title="长稿", body="雨" * 7000)
        await db_session.commit()
        assert case is None
        rows = await db_session.execute(
            select(ModerationCase).where(ModerationCase.subject_id == subject_id))
        assert rows.scalars().all() == []
    finally:
        await _purge(db_session, subject_id)


@pytest.mark.asyncio
async def test_queue_default_order_puts_suspicious_first(db_session):
    """队列默认"先看可疑"：三级排序键都要各就各位（现阶段唯一安全的自动化）。

    第一级必须是"有没有明确条款"而不是置信度——实测词表案件的 confidence 全是 0.0，
    只按置信度排的话，在默认（未开模型）配置下这个控件等同于按时间排。
    这里 limit 取大于全表行数：无条款的行本来就会被挤到分页之外，
    那正是新排序的行为，测试不能假装看不见，所以把它显式包含进来再断言相对顺序。
    """
    switch = Switchable(Verdict(action=ACTION_HUMAN, confidence=0.85, engine="fake:model",
                                calibrated=True, rule="manual_test"))
    svc = ModerationService(db_session, ModerationEngine([switch], Policy()))
    ids = [f"life-{uuid.uuid4().hex[:8]}" for _ in range(3)]
    try:
        await svc.review(subject_type="project", subject_id=ids[0],
                         title="高置信无条款", body="雨落下来")
        # 三次独立的保存 = 三个独立事务：PG 的 now() 取事务开始时间，
        # 同一个事务里插入的行 created_at 完全相同，"按时间"在批内没有定义。
        await db_session.commit()
        switch.verdict = Verdict(action=ACTION_HUMAN, confidence=0.30, engine="fake:model",
                                 calibrated=True, rule="manual_test")
        await svc.review(subject_type="project", subject_id=ids[1],
                         title="低置信无条款", body="风也停了")
        await db_session.commit()
        switch.verdict = Verdict(action=ACTION_HUMAN, confidence=0.0, engine="fake:model",
                                 calibrated=True, clause_ids=["doxxing"],
                                 rule="hate_or_doxx_or_instruction")
        await svc.review(subject_type="project", subject_id=ids[2],
                         title="零置信但有明确条款", body="她就是住 XX 路 12 号楼")
        await db_session.commit()

        all_rows = await svc.queue(limit=5000, order="risk")
        by_risk = [c.subject_id for c in all_rows if c.subject_id in ids]
        by_new = [c.subject_id for c in await svc.queue(limit=5000, order="new")
                  if c.subject_id in ids]
        assert by_risk == [ids[2], ids[0], ids[1]], "条款 > 置信度 > 时间"
        assert by_new == [ids[2], ids[1], ids[0]], "按时间则后落库的在前"
    finally:
        for sid in ids:
            await _purge(db_session, sid)


@pytest.mark.asyncio
async def test_primary_clause_suggestion_reaches_the_admin_contract(db_session):
    """单选建议要从模型答案 → 落库快照 → 中台契约一路可见（跨层不能只通一半）。

    它同时是一条边界断言：这条建议**不进** clause_ids，因此不参与门控。
    """
    from app.domains.moderation.contracts import Answer
    from app.domains.platform.admin_service import _auto_judgement

    prim = Answer("primary_clause", "choice", "self_harm_unsafe", 0.73,
                  {"self_harm_unsafe": 0.73, "none": 0.2})
    switch = Switchable(replace(
        _verdict(ACTION_HUMAN, confidence=0.4, calibrated=False),
        answers={"primary_clause": prim}))
    svc = ModerationService(db_session, ModerationEngine([switch], Policy()))
    subject_id = f"life-{uuid.uuid4().hex[:8]}"
    try:
        case = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="雨落下来")
        await db_session.commit()
        assert case is not None
        judgement = _auto_judgement(case)
        assert judgement.primary_suggestion == "self_harm_unsafe"
        assert judgement.primary_confidence == pytest.approx(0.73)
        assert "self_harm_unsafe" not in judgement.clause_ids
    finally:
        await _purge(db_session, subject_id)


@pytest.mark.asyncio
async def test_machine_reopinion_does_not_override_a_human_resolution(db_session):
    """人结过案的，机器的新意见只记日志，不改案件状态。"""
    switch = Switchable(_verdict(ACTION_HUMAN, confidence=0.4, calibrated=False))
    svc = ModerationService(db_session, ModerationEngine([switch], Policy()))
    subject_id = f"life-{uuid.uuid4().hex[:8]}"
    try:
        case = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="有争议的一段")
        assert case is not None
        resolved = await svc.resolve(case.id, outcome="resolved", actor="admin-role")
        await db_session.commit()
        assert resolved is not None and resolved.state == STATE_RESOLVED

        switch.verdict = _verdict(ACTION_APPROVE, confidence=0.99, calibrated=True)
        again = await svc.review(
            subject_type="project", subject_id=subject_id, title="夜航", body="有争议的一段")
        await db_session.commit()

        assert again is not None and again.id == case.id
        assert again.state == STATE_RESOLVED, "自动结论不重开人工决定"
        assert again.resolved_by == "admin-role"
        logs = await _logs(db_session, case.id)
        assert logs[-1].action == ACTION_APPROVE, "新意见要留痕，只是不落执行"
    finally:
        await _purge(db_session, subject_id)
