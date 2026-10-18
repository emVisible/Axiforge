"""批量重判（#47）的承重断言。

这里管的是三件在真实运行里最容易被悄悄做错的事：
① 批量不许改变 state（默认只刷结论）；② 计数必须是互斥单值且真的等于发生的事；
③ 同时只许有一个批量在跑，并且与单条派发共用在途去重。
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import delete, select

from app.domains.moderation import background
from app.domains.moderation.contracts import (
    ACTION_APPROVE,
    ACTION_HUMAN,
    ModerationSubject,
    Policy,
    Verdict,
)
from app.domains.moderation.engine import ModerationEngine
from app.domains.moderation.models import ModerationCase, STATE_PENDING
from app.domains.moderation.providers.lexicon import LEXICON_VERSION
from app.domains.moderation.questions import QUESTIONS_VERSION
from app.domains.moderation.service import ModerationService


class Approver:
    """总给"自动通过"结论的权威引擎——用来检验批量会不会把队列翻成已结案。"""

    name = "fake:model"
    authoritative = True

    def model_version(self) -> str:
        return "fake:approve-1"

    def health_check(self) -> bool:
        return True

    def moderate(self, subject: ModerationSubject) -> Verdict:  # noqa: ARG002
        return Verdict(action=ACTION_APPROVE, confidence=0.99, engine=self.name,
                       calibrated=True, rule="no_risk")


async def _purge(db, ids) -> None:
    await db.execute(delete(ModerationCase).where(ModerationCase.id.in_(ids)))
    await db.commit()


@pytest.mark.asyncio
async def test_a_batch_refresh_never_changes_state(db_session):
    """批量（allow_close=False）刷新结论但不清人工队列。

    这条断言的值不在"引擎过了门"——在于**过门了 state 仍然是 pending**。
    反过来若哪天有人把默认改成 True，这条会红，而那就是"批量替运营决定这些不用看了"。
    """
    svc = ModerationService(db_session, ModerationEngine([Approver()], Policy()))
    sid = f"requeue-{uuid.uuid4().hex[:8]}"
    try:
        kept = await svc.review(subject_type="comment", subject_id=sid,
                                title="批量", body="一条干净的评论", allow_close=False)
        await db_session.commit()
        assert kept is not None
        assert kept.final_action == ACTION_APPROVE, "结论照落：攒数据要的就是它"
        assert kept.state == STATE_PENDING, "但 state 不许被批量翻走"
        assert kept.answers == {}, "前提：fake 引擎没给类型化答案"

        allowed = await svc.review(subject_type="character", subject_id=sid,
                                   title="批量", body="一条干净的评论", allow_close=True)
        await db_session.commit()
        assert allowed is not None and allowed.state != STATE_PENDING, \
            "同一份结论在正常口径下确实会结案——差别只在 allow_close"
    finally:
        rows = (await db_session.execute(
            select(ModerationCase.id).where(ModerationCase.subject_id == sid))).scalars().all()
        await _purge(db_session, list(rows))


@pytest.mark.asyncio
async def test_requeue_candidates_pick_by_scope_and_dedupe_subjects(db_session):
    """同一条内容有多版案件时只判一次：批量派发的是主体坐标，不是案件 id。"""
    now = datetime.now(timezone.utc)
    ids = []
    tag = uuid.uuid4().hex[:6]
    spec = [
        # (subject_id, questions_version, lexicon_version, authoritative, state)
        (f"stale-{tag}", "questions-2", LEXICON_VERSION, True, STATE_PENDING),
        (f"stale-{tag}", QUESTIONS_VERSION, LEXICON_VERSION, True, STATE_PENDING),   # 同主体第二版
        (f"unjudged-{tag}", QUESTIONS_VERSION, LEXICON_VERSION, False, STATE_PENDING),
    ]
    try:
        for n, (sid, qv, lv, auth, state) in enumerate(spec):
            cid = uuid.uuid4()
            ids.append(cid)
            db_session.add(ModerationCase(
                id=cid, subject_type="comment", subject_id=sid, author_id="a",
                fingerprint=f"fp-{tag}-{n}", state=state, engine="lexicon",
                answers={}, reasons=[], clause_ids=[], created_at=now,
                policy_version="policy-1", questions_version=qv, lexicon_version=lv,
                authoritative=auth,
            ))
        await db_session.commit()
        svc = ModerationService(db_session)

        stale = await svc.requeue_candidates(scope="stale", limit=500)
        unjudged = await svc.requeue_candidates(scope="unjudged", limit=500)
        stales = {s for _, s in stale}
        assert any(s.startswith(f"stale-{tag}") for s in stales), "旧题集那条要被挑中"
        assert not any(s.startswith(f"unjudged-{tag}") for s in stales), "新题集的不算 stale"
        # 同一主体两条案件 → 只出现一次
        dupes = [s for _, s in stale if s.startswith(f"stale-{tag}")]
        assert len(set(dupes)) == len(dupes), "主体坐标必须去重"
        assert any(s.startswith(f"unjudged-{tag}") for _, s in unjudged)
    finally:
        await _purge(db_session, ids)


@pytest.mark.asyncio
async def test_batch_counts_are_the_truth_and_only_one_runs(monkeypatch):
    """派发器：计数互斥单值、与单条共用在途去重、第二次启动被拒。"""
    keys = [("comment", "a"), ("comment", "b"), ("comment", "c"), ("comment", "d")]
    tags = iter(["judged", "failed", "no_content", "judged"])
    started = asyncio.Event()
    release = asyncio.Event()

    async def fake_one(key, *, allow_close=True):
        assert allow_close is False, "批量默认必须传 False——这是它不动 state 的唯一通道"
        started.set()
        await release.wait()
        return next(tags)

    monkeypatch.setattr(background, "_review_one", fake_one)
    # 有一条正在被单条派发处理：批量该跳过它，而不是再判一次
    background._inflight.add(("comment", "d"))

    assert background.start_batch(keys) is True
    await asyncio.wait_for(started.wait(), 2)
    assert background.start_batch(keys) is False, "同时只许有一个批量在跑"
    release.set()
    for _ in range(200):
        if not background.batch_status()["running"]:
            break
        await asyncio.sleep(0.01)

    st = background.batch_status()
    assert st["queued"] == 4
    assert st["judged"] == 1 and st["failed"] == 1 and st["no_content"] == 1
    assert st["no_case"] == 1, "在途重复的那条要计入，不许静默消失"
    assert st["running"] is False
    assert ("comment", "d") in background._inflight  # 批量不许替别人清掉在途标记
    background._inflight.discard(("comment", "d"))


def test_the_batch_readout_separates_model_evidence_from_lexicon_noise():
    """150 条批量跑出 judged=147，而库里只多了 1 条模型证据——那格被糊掉过。

    这条断言钉的是读数的定义：`lexicon_only`（只有词表说话）不许并进 `judged`，
    因为攒标定数据要的是权威判定，两者的下一步完全不同（前者要查引擎为什么没答话）。
    """
    from app.domains.moderation.background import outcome_tag

    def fake(*, authoritative: bool, final: str) -> SimpleNamespace:
        return SimpleNamespace(authoritative=authoritative, final_action=final,
                               state=STATE_PENDING)

    assert outcome_tag(None) == "no_case"
    assert outcome_tag(fake(authoritative=False, final=ACTION_HUMAN)) == "lexicon_only"
    assert outcome_tag(fake(authoritative=True, final=ACTION_HUMAN)) == "judged"
    assert outcome_tag(fake(authoritative=True, final=ACTION_APPROVE)) == "would_close"


@pytest.mark.asyncio
async def test_cancel_stops_before_the_next_item(monkeypatch):
    seen = []
    release = asyncio.Event()

    async def fake_one(key, *, allow_close=True):  # noqa: ARG002
        seen.append(key)
        if len(seen) == 1:
            await release.wait()
        return "judged"

    monkeypatch.setattr(background, "_review_one", fake_one)
    background.start_batch([("comment", str(i)) for i in range(6)], concurrency=1)
    while len(seen) < 1:
        await asyncio.sleep(0.01)
    assert background.cancel_batch() is True
    release.set()
    for _ in range(200):
        if not background.batch_status()["running"]:
            break
        await asyncio.sleep(0.01)
    assert len(seen) < 6, f"取消后不该把剩下的都跑完：{len(seen)}"
    assert background.batch_status()["cancelled"] is True
    assert background.cancel_batch() is False, "没在跑时取消返回 False，别报假成功"
