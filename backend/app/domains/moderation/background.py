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
from typing import Dict, Optional, Set, Tuple

from app.database import async_session
from app.domains.moderation.content import load_subject_content
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
    subject_type, subject_id = key
    try:
        # 自己的 session：请求线程那个已经随 commit 一起关掉了。
        async with async_session() as db:
            content = await load_subject_content(
                db, subject_type=subject_type, subject_id=subject_id)
            if content is None:
                # 内容已删除/不在这类主体覆盖内。不是错误，也不留案件。
                return
            title, body, author_id = content
            case = await ModerationService(db).review(
                subject_type=subject_type, subject_id=subject_id,
                title=title, body=body, author_id=author_id)
            # get_db 只关会话不提交；后台这条链没有"调用方的事务"可搭，必须自己提交，
            # 否则忙活一次模型调用，库里什么都留不下（处置落库踩过同一坑）。
            await db.commit()
            if case is not None:
                logger.debug("moderation 后台判定完成 %s -> %s", key, case.state)
    except asyncio.CancelledError:
        raise
    except Exception:  # noqa: BLE001 - 旁路：失败只记日志，绝不让保存侧承担
        logger.exception("moderation 后台判定失败 %s（内容仍未被机器看过）", key)


async def drain_pending(timeout: float = 30.0) -> int:
    """等当前所有后台判定结束，返回等待了几个。测试与"需要看结果"的调用方用。"""
    pending = list(_tasks.values())
    if pending:
        await asyncio.wait_for(asyncio.gather(*pending, return_exceptions=True), timeout)
    return len(pending)
