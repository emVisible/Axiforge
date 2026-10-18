"""逐轴真值（#48）：落库、回落语义、以及导出必须说清这份标签是谁给的。

没有这一列时，正样本只能来自"机器自己想到的那些轴"——漏报永远不会变成正样本，
拟出的温度偏乐观。所以这里测的不是"能不能存"，而是 **NULL 与 [] 必须是两件事**：
前者＝没逐轴确认过（沿用机器条款），后者＝人明确说"一条都不成立"。
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import delete, select

from app.domains.moderation.contracts import ACTION_HUMAN
from app.domains.moderation.models import ModerationCase
from app.domains.moderation.service import ModerationService
from eval.export_labels import case_payload


async def _make_case(db, *, clause_ids: list, state: str = "pending"):
    cid = uuid.uuid4()
    case = ModerationCase(
        id=cid, subject_type="comment", subject_id=f"hc-{uuid.uuid4().hex[:8]}",
        author_id="a", fingerprint=f"fp-hc-{uuid.uuid4().hex[:8]}", state=state,
        suggested_action=ACTION_HUMAN, final_action=ACTION_HUMAN, via="threshold:human_band",
        confidence=0.5, engine="laya:sidecar", authoritative=True, calibrated=True,
        clause_ids=clause_ids, answers={}, reasons=[], policy_version="policy-1",
        questions_version="questions-3", lexicon_version="lexicon-test",
        decided_at=datetime.now(timezone.utc),
    )
    db.add(case)
    await db.commit()
    return case


@pytest.mark.asyncio
async def test_an_explicitly_cleared_axis_set_is_not_the_same_as_no_input(db_session):
    case = await _make_case(db_session, clause_ids=["doxxing"])
    svc = ModerationService(db_session)
    try:
        untouched = await svc.resolve(case.id, outcome="resolved", actor="admin-role")
        assert untouched.human_clauses is None, "没勾过就该是 NULL，不能落成 []"

        cleared = await svc.resolve(case.id, outcome="resolved", actor="admin-role",
                                    human_clauses=[])
        assert cleared.human_clauses == [], "人明确说「一条都不成立」必须能表达出来"

        payload = case_payload(cleared)
        assert payload["label_kind"] == "explicit"
        assert payload["clauses"] == [], "explicit 时不许再回落到机器标的条款"
    finally:
        await db_session.execute(delete(ModerationCase).where(
            ModerationCase.id == case.id))
        await db_session.commit()


@pytest.mark.asyncio
async def test_endorsed_rows_keep_the_old_semantics_unchanged(db_session):
    """加这一列不许改变历史行为：没勾过时仍按"确认处置＝认可机器条款"导出。"""
    case = await _make_case(db_session, clause_ids=["hate_incitement", "doxxing"])
    svc = ModerationService(db_session)
    try:
        resolved = await svc.resolve(case.id, outcome="resolved", actor="admin-role")
        p_resolved = case_payload(resolved)
        assert p_resolved["label_kind"] == "endorsed"
        assert p_resolved["clauses"] == ["hate_incitement", "doxxing"]

        dismissed = await svc.resolve(case.id, outcome="dismissed", actor="admin-role")
        p_dismissed = case_payload(dismissed)
        assert p_dismissed["clauses"] == [], "误报被认下来 → 各轴记负样本"
        assert p_dismissed["label_kind"] == "endorsed"
    finally:
        await db_session.execute(delete(ModerationCase).where(
            ModerationCase.id == case.id))
        await db_session.commit()


@pytest.mark.asyncio
async def test_the_column_survives_a_reread_in_a_new_session(db_session):
    """跨 session 复读：只 flush 不 commit 的写法在这里会假装通过。"""
    case = await _make_case(db_session, clause_ids=["pii_real_person"])
    svc = ModerationService(db_session)
    try:
        await svc.resolve(case.id, outcome="resolved", actor="admin-role",
                          human_clauses=["pii_real_person", "sexual_explicit"])
        from app.database import async_session

        async with async_session() as other:
            row = (await other.execute(select(ModerationCase).where(
                ModerationCase.id == case.id))).scalar_one()
            assert row.human_clauses == ["pii_real_person", "sexual_explicit"]
    finally:
        await db_session.execute(delete(ModerationCase).where(
            ModerationCase.id == case.id))
        await db_session.commit()
