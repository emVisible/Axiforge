"""审核案件服务：裁决落库、队列、人工处置与回退。

与调用方的关系是刻意的弱耦合：**审核失败绝不能让发布失败**。
ADR-018:23 说发布只跑规则校验、不做前置人工审核，所以本模块是旁路留痕——
它不抛异常给调用方，也不在发布的事务边界里做阻塞判断。

一处诚实的说明：`review()` 返回 `None` 表示"审核未启用"，
**不等于"内容通过"**。调用方不能拿 None 当放行依据（参照实现里
"引擎没说话"和"引擎说没问题"是同一个返回值，那是缺陷 1 的根）。
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.moderation.contracts import ACTION_HUMAN, ModerationSubject, Verdict
from app.domains.moderation.engine import ModerationEngine
from app.domains.moderation.models import (
    ModerationCase,
    ModerationDecisionLog,
    STATE_AUTO_CLOSED,
    STATE_DISMISSED,
    STATE_PENDING,
    STATE_RESOLVED,
)
from app.domains.moderation.providers.lexicon import LEXICON_VERSION
from app.domains.moderation.registry import get_engine

logger = logging.getLogger(__name__)


def content_sha(title: str, body: str) -> str:
    return hashlib.sha256(f"{title or ''}\n{body or ''}".encode("utf-8")).hexdigest()


def _conf(v: object) -> Optional[float]:
    """落库前的最后一道裁剪。引擎层已经作废过越界值，这里再挡一次：
    参照实现把 conf=9.00 原样写进了存储。"""
    try:
        f = float(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if f != f:
        return None
    return max(0.0, min(1.0, f))


def _answer_snapshot(verdict: Verdict) -> dict:
    return {
        name: {"type": a.qtype, "value": a.value, "confidence": round(a.confidence, 4)}
        for name, a in verdict.answers.items()
    }


class ModerationService:
    def __init__(self, db: AsyncSession, engine: Optional[ModerationEngine] = None) -> None:
        self.db = db
        self._engine = engine

    @property
    def engine(self) -> ModerationEngine:
        if self._engine is None:
            self._engine = get_engine()
        return self._engine

    async def review(
        self,
        *,
        subject_type: str,
        subject_id: str,
        title: str,
        body: str,
        author_id: str = "",
    ) -> Optional[ModerationCase]:
        """审一条内容并留痕。返回 None 只表示审核未启用或引擎全部故障。"""
        if not self.engine.providers:
            return None

        sha = content_sha(title, body)
        subject = ModerationSubject(
            kind=subject_type,
            object_id=str(subject_id),
            title=title or "",
            body=body or "",
            author_id=author_id or "",
            content_sha256=sha,
        )

        try:
            outcome = await self.engine.decide(subject)
        except Exception as exc:  # 审核不可用 ≠ 内容有问题；留一条 pending 给人工
            outcome = None
            error_note = f"审核引擎异常：{type(exc).__name__}"
        else:
            error_note = ""

        # 全链没说话（既没命中条款也没给出结论）时**不开案件**。
        # 默认配置下链里只有词表，若"无信号"也建案，人工队列会被干净内容灌满，
        # 而队列的价值恰恰是"这里需要人看一眼"。引擎整体故障仍会建案（outcome is None）。
        if outcome is not None and outcome.verdict.engine == "chain":
            return None

        existing = (
            await self.db.execute(
                select(ModerationCase).where(
                    ModerationCase.subject_type == subject_type,
                    ModerationCase.subject_id == str(subject_id),
                    ModerationCase.fingerprint == sha,
                )
            )
        ).scalar_one_or_none()

        if existing is not None:
            self.db.add(
                ModerationDecisionLog(
                    case_id=existing.id, dedupe_hit=True,
                    action=existing.final_action, via=existing.via,
                    confidence=existing.confidence, engine=existing.engine,
                    engines_tried=list(existing.reasons),
                    policy_version=existing.policy_version,
                    questions_version=existing.questions_version,
                )
            )
            await self.db.flush()
            return existing

        verdict = outcome.verdict if outcome else Verdict.abstain("chain", error_note)
        auto_executed = bool(outcome) and outcome.action != ACTION_HUMAN
        case = ModerationCase(
            subject_type=subject_type,
            subject_id=str(subject_id),
            author_id=author_id or "",
            fingerprint=sha,
            state=STATE_AUTO_CLOSED if auto_executed else STATE_PENDING,
            suggested_action=verdict.action,
            final_action=outcome.action if outcome else "",
            via=outcome.via if outcome else "engine_unavailable",
            confidence=_conf(verdict.confidence),
            engine=verdict.engine,
            authoritative=bool(outcome.authoritative) if outcome else False,
            calibrated=bool(verdict.calibrated),
            clause_ids=list(verdict.clause_ids),
            answers=_answer_snapshot(verdict),
            reasons=list(verdict.reasons),
            policy_version=outcome.policy_version if outcome else "",
            questions_version=outcome.questions_version if outcome else "",
            lexicon_version=LEXICON_VERSION,
            latency_ms=verdict.latency_ms,
            decided_at=datetime.now(timezone.utc) if outcome else None,
        )
        self.db.add(case)
        await self.db.flush()

        if outcome:
            self.db.add(
                ModerationDecisionLog(
                    case_id=case.id, dedupe_hit=False,
                    action=outcome.action, via=outcome.via,
                    confidence=_conf(outcome.confidence), engine=verdict.engine,
                    engines_tried=list(outcome.engines_tried),
                    policy_version=outcome.policy_version,
                    questions_version=outcome.questions_version,
                )
            )
            await self.db.flush()
        return case

    async def queue(self, state: Optional[str] = None, limit: int = 50) -> List[ModerationCase]:
        q = select(ModerationCase).order_by(ModerationCase.created_at.desc()).limit(limit)
        if state:
            q = q.where(ModerationCase.state == state)
        return list((await self.db.execute(q)).scalars().all())

    async def get(self, case_id: UUID) -> Optional[ModerationCase]:
        return await self.db.get(ModerationCase, case_id)

    async def resolve(
        self, case_id: UUID, *, outcome: str, actor: str, note: str = ""
    ) -> Optional[ModerationCase]:
        """人工处置，outcome ∈ resolved | dismissed。

        `actor` 必须由鉴权层提供，不接受客户端自报：参照实现让客户端传 actor
        且默认 `"admin"`（`server.py:201`），任何调用方都能冒充管理员结案。
        """
        if outcome not in ("resolved", "dismissed"):
            return None
        case = await self.db.get(ModerationCase, case_id)
        if not case:
            return None
        case.state = STATE_RESOLVED if outcome == "resolved" else STATE_DISMISSED
        case.resolved_at = datetime.now(timezone.utc)
        case.resolved_by = actor
        case.resolution_note = note or None
        await self.db.flush()
        return case

    async def reopen(self, case_id: UUID, *, actor: str, note: str = "") -> Optional[ModerationCase]:
        """终态回退：误判必须有一条回去的路（参照实现的终态是单向的）。"""
        case = await self.db.get(ModerationCase, case_id)
        if not case:
            return None
        case.state = STATE_PENDING
        case.resolved_at = None
        case.resolved_by = actor
        case.resolution_note = note or None
        await self.db.flush()
        return case

    async def stats(self) -> dict:
        by_state = (
            await self.db.execute(
                select(ModerationCase.state, func.count()).group_by(ModerationCase.state)
            )
        ).all()
        by_engine = (
            await self.db.execute(
                select(ModerationCase.engine, func.count()).group_by(ModerationCase.engine)
            )
        ).all()
        return {
            "by_state": {str(s): int(c) for s, c in by_state},
            "by_engine": {(e or "-"): int(c) for e, c in by_engine},
            "engines": [
                {"name": n, "healthy": h, "authoritative": a}
                for n, h, a in self.engine.availability()
            ],
        }


async def advisory_review(
    db: AsyncSession,
    *,
    subject_type: str,
    subject_id: object,
    title: str,
    body: str,
    author_id: str = "",
) -> Optional[ModerationCase]:
    """发布/评论路径上的旁路留痕：**任何情况下都不向调用方抛异常**。

    ADR-018:23 定的是发布只跑规则校验、不做前置人工审核。所以审核挂在这里
    只能是"顺便记一笔"，不能变成新的发布闸门——sidecar 停了、模型答歪了、
    甚至本模块自己写库失败，都不能让一个作者发不出作品。

    写包在 SAVEPOINT 里：失败只回滚审核行，不污染调用方尚未提交的事务。
    """
    try:
        async with db.begin_nested():
            return await ModerationService(db).review(
                subject_type=subject_type,
                subject_id=str(subject_id),
                title=title,
                body=body,
                author_id=author_id,
            )
    except Exception as exc:
        logger.warning("moderation advisory skipped (%s/%s): %s", subject_type, subject_id, exc)
        return None
