"""违规 strike 与公开发布策略（ADR-018）。"""

from __future__ import annotations

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.models import UserAccount

STRIKE_PUBLISH_BLOCK = 3


async def publish_block_reasons(db: AsyncSession, author_id: str) -> List[str]:
    """返回阻止公开发布的说明；空列表表示允许。"""
    if not author_id or author_id == "anonymous":
        return []
    row = (
        await db.execute(
            select(UserAccount).where(UserAccount.creator_id == author_id)
        )
    ).scalar_one_or_none()
    if not row:
        return []
    if row.is_banned:
        return ["账号已被封禁，无法公开发布"]
    strikes = row.strike_count or 0
    if strikes >= STRIKE_PUBLISH_BLOCK:
        return [f"累计违规 {strikes} 次，已暂停公开发布（阈值 {STRIKE_PUBLISH_BLOCK}）"]
    return []
