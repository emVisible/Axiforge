"""浏览量去重。"""

import pytest

from app.core.view_dedup import should_count_content_view
from app.database import async_session
from app.domains.platform.models import PlatformEvent
from sqlalchemy import delete


@pytest.mark.asyncio
async def test_view_dedup_same_token_same_day():
    async with async_session() as db:
        subject_id = "proj-view-dedup-test"
        token = "viewer-dedup-token"
        await db.execute(
            delete(PlatformEvent).where(
                PlatformEvent.subject_id == subject_id,
                PlatformEvent.actor_token == token,
            )
        )
        await db.commit()

        assert await should_count_content_view(
            db,
            subject_type="project",
            subject_id=subject_id,
            viewer_token=token,
        )
        await db.commit()
        assert not await should_count_content_view(
            db,
            subject_type="project",
            subject_id=subject_id,
            viewer_token=token,
        )

        await db.execute(
            delete(PlatformEvent).where(
                PlatformEvent.subject_id == subject_id,
                PlatformEvent.actor_token == token,
            )
        )
        await db.commit()
