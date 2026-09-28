"""把判断从"保存"这条路径上摘下来——后台派发。

为什么需要：`MODERATION_ENABLED=true` 时一次模型往返实测 450–980ms（ADR-028 的真机数字），
挂在保存路径上等于让作者每次改动都付一次延迟税；而这条链**本来就只是建议**——
它不参与发布放行（ADR-018:23），没有任何下游需要它的结果才能返回。
所以它不该在请求线程里。

三条刻意的选择：

1. **只派发"主体坐标"，不派发文本。** 后台任务用 `moderation.content.load_subject_content`
   自己取全文——那是保存、举报、重判三个入口共用的同一份"送审正文"定义。
   在调用点把文本传进来看着省一步，实际是允许"传进去的"和"库里最终存着的"是两个版本。
2. **必须在调用方 commit 之后派发。** 后台用的是**另一个 session**，
   看不见未提交的内容；派发早于 commit 的结局是"判了一篇还不存在的稿子"。
3. **不做持久化任务表。** 进程在 commit 与任务完成之间死掉，这一次判定就丢了——
   后果只是"这条内容还没被机器看过"（队列里没有它，也不会被误放行），
   下一次保存或一次手动重判都会补上。判断层是旁路，不是账本，不值得为它引入一套作业状态。

`drain_pending()` 是给测试的钩子：异步化之后"请求返回了但案件还没落库"是正常状态，
断言之前必须先等。测试里读它，就是在读这条链的一致性级别。
"""

from __future__ import annotations

import asyncio
import logging
from typing import Dict, Optional, Sequence, Set, Tuple

from app.database import async_session
from app.domains.moderation.content import load_subject_content
from app.domains.moderation.contracts import ACTION_HUMAN
from app.domains.moderation.models import ModerationCase
from app.domains.moderation.service import ModerationService

logger = logging.getLogger(__name__)

_tasks: Dict[Tuple[str, str], asyncio.Task] = {}
#: 在途去重：同一个对象连点两次保存不该付两次模型调用。
_inflight: Set[Tuple[str, str]] = set()


def schedule_review(subject_type: str, subject_id: object) -> Optional[asyncio.Task]:
    """派一个后台判定。**任何情况下都不向调用方抛异常**——审核不可用不是保存失败。"""
    key = (subject_type, str(subject_id))
    if key in _inflight:
        return None
    try:
        task = asyncio.get_running_loop().create_task(_run(key))
    except RuntimeError:  # 没有事件循环（同步上下文里误调用）
        logger.warning("moderation 后台派发被跳过：当前没有运行中的事件循环 %s", key)
        return None
    _inflight.add(key)
    _tasks[key] = task
    task.add_done_callback(lambda _t: _finish(key))
    return task


def _finish(key: Tuple[str, str]) -> None:
    _inflight.discard(key)
    _tasks.pop(key, None)


async def _run(key: Tuple[str, str]) -> None:
    await _review_one(key)


def outcome_tag(case: Optional[ModerationCase]) -> str:
    """一次批量条目换回哪个计数。单独抽出来是因为它是"读数的定义"，
    而读数在 150 条真跑之后被证明会骗人——它必须能被直接断言。"""
    if case is None:
        # 审核未启用、全链弃权、或引擎主动拒绝（正文超窗）：这一次没被机器看过
        return "no_case"
    if not case.authoritative:
        # 只有词表说话。批量把 150 条跑成 judged=147，而库里只多了 1 条模型证据，
        # 就是被这一格以前并进 judged 糊过去的。
        return "lexicon_only"
    return "would_close" if case.final_action != ACTION_HUMAN else "judged"


async def _review_one(key: Tuple[str, str], *, allow_close: bool = True) -> str:
    """判一条并落库，返回一个状态标签给批量侧计数。

    标签是**互斥的单值**而不是几个布尔：没内容 / 失败 / 只有词表 / 判完没过门 /
    判完且过门，这几件事对运营是完全不同的下一步，压成布尔就会有人去查错地方。
    """
    subject_type, subject_id = key
    try:
        # 自己的 session：请求线程那个已经随 commit 一起关掉了。
        async with async_session() as db:
            content = await load_subject_content(
                db, subject_type=subject_type, subject_id=subject_id)
            if content is None:
                # 内容已删除/不在这类主体覆盖内。不是错误，也不留案件。
                return "no_content"
            title, body, author_id = content
            case = await ModerationService(db).review(
                subject_type=subject_type, subject_id=subject_id,
                title=title, body=body, author_id=author_id, allow_close=allow_close)
            # get_db 只关会话不提交；后台这条链没有"调用方的事务"可搭，必须自己提交，
            # 否则忙活一次模型调用，库里什么都留不下（处置落库踩过同一坑）。
            await db.commit()
            logger.debug("moderation 后台判定完成 %s -> %s", key, case.state if case else None)
            return outcome_tag(case)
    except asyncio.CancelledError:
        raise
    except Exception:  # noqa: BLE001 - 旁路：失败只记日志，绝不让保存侧承担
        logger.exception("moderation 后台判定失败 %s（内容仍未被机器看过）", key)
        return "failed"


#: 批量刷新的并发上限。一台 MPS 上的 sidecar 单条实测 0.45–1.0s，
#: 开 1000 个任务不会更快（推理在同一个显存上排队），只会让正常保存路径的
#: 后台判定一起排队——限并发换的是"批量在跑，中台还能用"。
BATCH_CONCURRENCY = 4

_batch: Dict[str, object] = {
    "running": False, "queued": 0, "judged": 0, "lexicon_only": 0, "would_close": 0,
    "no_content": 0, "no_case": 0, "failed": 0, "cancelled": False,
}


def batch_status() -> Dict[str, object]:
    return dict(_batch)


def start_batch(keys: Sequence[Tuple[str, str]], *,
                allow_close: bool = False,
                concurrency: int = BATCH_CONCURRENCY) -> bool:
    """非阻塞启动一批刷新。已有批量在跑就返回 False（路由据此回 409，而不是悄悄排队）。"""
    if _batch["running"]:
        return False
    _batch.update({
        "running": True, "queued": len(keys), "judged": 0, "lexicon_only": 0,
        "would_close": 0, "no_content": 0, "no_case": 0, "failed": 0, "cancelled": False,
    })
    task = asyncio.get_running_loop().create_task(
        _run_batch(list(keys), allow_close=allow_close, concurrency=concurrency))
    _batch_tasks.add(task)
    task.add_done_callback(_batch_tasks.discard)
    return True


_batch_tasks: Set[asyncio.Task] = set()


async def _run_batch(keys: list, *, allow_close: bool, concurrency: int) -> None:
    sem = asyncio.Semaphore(concurrency)

    async def one(key: Tuple[str, str]) -> None:
        if _batch["cancelled"]:
            return
        async with sem:
            if _batch["cancelled"]:
                return
            # 与单条派发共用 _inflight：批量跑着的时候作者保存同一条内容，
            # 不该付两次模型调用。抢不到就说明这条正在被处理，跳过并计数。
            if key in _inflight:
                _bump("no_case")
                return
            _inflight.add(key)
            try:
                tag = await _review_one(key, allow_close=allow_close)
            finally:
                _inflight.discard(key)
            _bump(tag)

    try:
        await asyncio.gather(*(one(k) for k in keys))
    finally:
        _batch["running"] = False


def _bump(tag: str) -> None:
    _batch[tag] = int(_batch.get(tag, 0)) + 1


def cancel_batch() -> bool:
    """让在跑的批量在下一条处停下。已经在途的那几条会跑完——硬断会把 session 留在中间态。"""
    if not _batch["running"]:
        return False
    _batch["cancelled"] = True
    return True


async def drain_pending(timeout: float = 30.0) -> int:
    """等当前所有后台判定结束，返回等待了几个。测试与"需要看结果"的调用方用。"""
    pending = list(_tasks.values())
    if pending:
        await asyncio.wait_for(asyncio.gather(*pending, return_exceptions=True), timeout)
    return len(pending)
