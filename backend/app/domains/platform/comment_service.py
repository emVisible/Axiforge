"""Comment business logic."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Deque, DefaultDict, Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.content_validate import validate_comment_body
from app.domains.platform.comment_schemas import (
    CommentCreate,
    CommentListResponse,
    CommentResponse,
)
from app.domains.platform.models import Comment, ContentReport

_HOURLY_LIMIT = 30
_usage: DefaultDict[str, Deque[float]] = defaultdict(deque)


def _check_rate_limit(author_id: str) -> None:
    now = time.monotonic()
    window = 3600.0
    bucket = _usage[author_id]
    while bucket and bucket[0] <= now - window:
        bucket.popleft()
    if len(bucket) >= _HOURLY_LIMIT:
        raise ValueError("评论过于频繁，请稍后再试")
    bucket.append(now)


class CommentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_response(self, row: Comment, replies: Optional[List[Comment]] = None) -> CommentResponse:
        return CommentResponse(
            id=row.id,
            content_type=row.content_type,
            content_id=row.content_id,
            author_id=row.author_id,
            body=row.body,
            parent_id=row.parent_id,
            root_id=row.root_id,
            status=row.status,
            like_count=row.like_count,
            reply_count=row.reply_count,
            created_at=row.created_at,
            updated_at=row.updated_at,
            replies=[
                self._to_response(r) for r in (replies or []) if r.parent_id == row.id
            ],
        )

    async def list_comments(
        self,
        *,
        content_type: str,
        content_id: str,
        sort: str = "recent",
        skip: int = 0,
        limit: int = 20,
    ) -> CommentListResponse:
        total = (
            await self.db.execute(
                select(func.count())
                .select_from(Comment)
                .where(
                    Comment.content_type == content_type,
                    Comment.content_id == content_id,
                    Comment.parent_id.is_(None),
                    Comment.status == "visible",
                )
            )
        ).scalar_one()
        base = select(Comment).where(
            Comment.content_type == content_type,
            Comment.content_id == content_id,
            Comment.parent_id.is_(None),
            Comment.status == "visible",
        )
        if sort == "hot":
            base = base.order_by(
                (Comment.like_count + Comment.reply_count).desc(),
                Comment.created_at.desc(),
            )
        else:
            base = base.order_by(Comment.created_at.desc())

        roots = (
            await self.db.execute(base.offset(skip).limit(limit))
        ).scalars().all()
        root_ids = [r.id for r in roots]
        replies: List[Comment] = []
        if root_ids:
            replies = (
                await self.db.execute(
                    select(Comment)
                    .where(
                        Comment.root_id.in_(root_ids),
                        Comment.parent_id.is_not(None),
                        Comment.status == "visible",
                    )
                    .order_by(Comment.created_at.asc())
                )
            ).scalars().all()

        items = [self._to_response(root, replies) for root in roots]
        return CommentListResponse(items=items, total=total)

    async def create(self, data: CommentCreate) -> CommentResponse:
        _check_rate_limit(data.author_id)
        errors = validate_comment_body(data.body)
        if errors:
            raise ValueError(errors[0])

        root_id: Optional[UUID] = None
        parent: Optional[Comment] = None
        if data.parent_id:
            parent = (
                await self.db.execute(
                    select(Comment).where(Comment.id == data.parent_id)
                )
            ).scalar_one_or_none()
            if not parent or parent.status != "visible":
                raise ValueError("父评论不存在")
            if (
                parent.content_type != data.content_type
                or parent.content_id != data.content_id
            ):
                raise ValueError("父评论与目标内容不匹配")
            root_id = parent.root_id or parent.id

        row = Comment(
            content_type=data.content_type,
            content_id=data.content_id,
            author_id=data.author_id,
            body=data.body.strip(),
            parent_id=data.parent_id,
            root_id=root_id,
            status="visible",
        )
        self.db.add(row)
        await self.db.flush()
        if not row.parent_id:
            row.root_id = row.id

        if parent:
            parent.reply_count = (parent.reply_count or 0) + 1
            root = (
                await self.db.execute(
                    select(Comment).where(Comment.id == root_id)
                )
            ).scalar_one_or_none()
            if root and root.id != parent.id:
                root.reply_count = (root.reply_count or 0) + 1

        await self.db.commit()
        await self.db.refresh(row)
        return self._to_response(row)

    async def delete(self, comment_id: UUID, author_id: str) -> bool:
        row = (
            await self.db.execute(select(Comment).where(Comment.id == comment_id))
        ).scalar_one_or_none()
        if not row or row.author_id != author_id:
            return False
        if row.status == "deleted":
            return True

        row.status = "deleted"
        row.body = "[已删除]"
        row.updated_at = datetime.now(timezone.utc)

        if row.parent_id:
            parent = (
                await self.db.execute(
                    select(Comment).where(Comment.id == row.parent_id)
                )
            ).scalar_one_or_none()
            if parent and parent.reply_count > 0:
                parent.reply_count -= 1
            if row.root_id and row.root_id != row.parent_id:
                root = (
                    await self.db.execute(
                        select(Comment).where(Comment.id == row.root_id)
                    )
                ).scalar_one_or_none()
                if root and root.reply_count > 0:
                    root.reply_count -= 1

        await self.db.commit()
        return True

    async def hide(self, comment_id: UUID) -> bool:
        result = await self.db.execute(
            update(Comment)
            .where(Comment.id == comment_id)
            .values(status="hidden")
        )
        await self.db.commit()
        return result.rowcount > 0

    async def report(
        self,
        comment_id: UUID,
        *,
        reason: str,
        reporter_token: Optional[str] = None,
    ) -> ContentReport:
        row = (
            await self.db.execute(select(Comment).where(Comment.id == comment_id))
        ).scalar_one_or_none()
        if not row or row.status != "visible":
            raise ValueError("评论不存在")
        report = ContentReport(
            target_type="comment",
            target_id=str(comment_id),
            reason=reason.strip(),
            reporter_token=reporter_token,
            status="pending",
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report
