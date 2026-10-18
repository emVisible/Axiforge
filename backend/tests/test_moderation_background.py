"""判断层后台派发（ADR-028 · D7）。

要钉住的事实只有一句：**保存不等判定**。请求路径上那次 450–980ms 的模型往返挪走之后，
"请求返回了但案件还没落地"就是这条链对外的正常工作状态——所以读队列的测试要先
`drain_pending()`，那不是在作弊，是在声明它读到的是最终一致的结果。
"""

from __future__ import annotations

import asyncio
import time
from uuid import uuid4

import pytest
from sqlalchemy import delete, select

import app.domains.moderation.background as bg
from app.database import async_session
from app.domains.moderation.background import drain_pending, schedule_review
from app.domains.moderation.models import ModerationCase

pytestmark = pytest.mark.asyncio


async def _rows(subject_id: str) -> list:
    """另起一个 session 读：同一会话里的 ORM 缓存会掩盖"其实没提交"。"""
    async with async_session() as probe:
        return list(
            (
                await probe.execute(
                    select(ModerationCase).where(ModerationCase.subject_id == subject_id)
                )
            ).scalars().all()
        )


async def test_scheduling_returns_before_the_judgement_finishes():
    """派发的契约：把活儿交出去就返回，不等结果。"""
    started = time.perf_counter()
    task = schedule_review("comment", uuid4())
    elapsed = time.perf_counter() - started
    assert task is not None, "派发要返回一个可等的任务，测试才看得见它在途"
    assert elapsed < 0.05, f"派发用了 {elapsed * 1000:.0f}ms——它还在等判定"
    await task


async def test_inflight_dedupe_schedules_one_judgement_per_subject(monkeypatch):
    """同一个对象在途时重复保存，不该付两次模型调用；完成后又得能再排。"""
    release = asyncio.Event()

    async def slow_content(_db, **_kw):
        await release.wait()
        return None

    monkeypatch.setattr(bg, "load_subject_content", slow_content)
    subject_id = str(uuid4())
    first = schedule_review("comment", subject_id)
    assert first is not None
    assert schedule_review("comment", subject_id) is None, "在途去重失效：同一主体排了两次"

    release.set()
    await first
    again = schedule_review("comment", subject_id)
    assert again is not None, "任务结束后去重窗口必须关闭，否则改动永不再判"
    await again


async def test_unknown_subject_lands_nothing_and_raises_nothing():
    """内容不存在或这类主体不在覆盖内：静默返回，不建案也不抛。"""
    subject_id = str(uuid4())
    await schedule_review("comment", subject_id)
    assert await _rows(subject_id) == []


async def test_a_failing_judgement_never_surfaces_to_the_caller(monkeypatch):
    """旁路的定义是它坏了自己咽下去——否则"审核挂了"会变成"保存挂了"。"""

    async def boom(_db, **_kw):
        raise RuntimeError("sidecar 没了")

    monkeypatch.setattr(bg, "load_subject_content", boom)
    task = schedule_review("comment", str(uuid4()))
    done, _pending = await asyncio.wait({task}, timeout=5)
    assert done, "后台任务卡住了"
    assert task.exception() is None, "异常被留成了任务结果，调用方迟早会撞上"


async def test_background_judgement_is_committed(monkeypatch):
    """后台用自己的 session，而 `get_db` 只关不提交——它必须自己 commit。

    少那次 commit 的症状不是报错，是"任务跑完了、库里什么都没有"。
    """
    subject_id = f"c-bg-{uuid4().hex[:8]}"

    async def fake_content(_db, **_kw):
        return ("标题", "加微信领 全新体验，返利群拉你", "creator-bg")

    monkeypatch.setattr(bg, "load_subject_content", fake_content)
    try:
        await schedule_review("comment", subject_id)
        assert await drain_pending() == 0
        rows = await _rows(subject_id)
        assert len(rows) == 1, "后台判定没落库：派发了一次，结果谁也没看见"
        assert rows[0].engine, "案件要带上是哪个引擎给的"
    finally:
        async with async_session() as cleanup:
            await cleanup.execute(
                delete(ModerationCase).where(ModerationCase.subject_id == subject_id))
            await cleanup.commit()

def test_authoring_paths_never_judge_in_the_request_thread():
    """一条结构检查：三个作者侧路径里不许再出现同步判定。

    行为测试测的是"派发不等结果"，这条测的是"没人把同步调用再加回来"。
    它只是文本扫描，所以配着上面那几条一起看——单独信它会犯"用一种失真替换另一种失真"的错。
    """
    from pathlib import Path

    root = Path(__file__).resolve().parents[1] / "app" / "domains"
    files = [
        root / "narrative" / "service.py",
        root / "platform" / "comment_service.py",
        root / "character" / "service.py",
    ]
    for f in files:
        src = f.read_text(encoding="utf-8")
        assert "await advisory_review(" not in src, f"{f.name} 把判定放回了请求线程"

