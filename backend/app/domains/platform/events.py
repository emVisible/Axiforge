"""平台事件记录（供中台 dashboard 消费）。"""

from __future__ import annotations

import uuid
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.models import PlatformEvent


async def record_event(
    db: AsyncSession,
    event_type: str,
    *,
    subject_type: Optional[str] = None,
    subject_id: Optional[str] = None,
    actor_token: Optional[str] = None,
    meta: Optional[dict[str, Any]] = None,
) -> None:
    db.add(
        PlatformEvent(
            id=uuid.uuid4(),
            event_type=event_type,
            subject_type=subject_type,
            subject_id=subject_id,
            actor_token=actor_token,
            meta=meta or {},
        )
    )
    await db.flush()
