"""内容浏览计数去重（按 viewer_token 每日一次）。"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.events import record_event
from app.domains.platform.models import PlatformEvent


async def should_count_content_view(
    db: AsyncSession,
    *,
    subject_type: str,
    subject_id: str,
    viewer_token: str | None,
) -> bool:
    """无 token 时仍计数；有 token 时同日同内容只计一次。"""
    if not viewer_token:
        return True
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    prior = (
        await db.execute(
            select(func.count())
            .select_from(PlatformEvent)
            .where(
                PlatformEvent.event_type == "content_view",
                PlatformEvent.subject_type == subject_type,
                PlatformEvent.subject_id == subject_id,
                PlatformEvent.actor_token == viewer_token,
                PlatformEvent.created_at >= today_start,
            )
        )
    ).scalar_one()
    if prior > 0:
        return False
    await record_event(
        db,
        "content_view",
        subject_type=subject_type,
        subject_id=subject_id,
        actor_token=viewer_token,
    )
    return True
