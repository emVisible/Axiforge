"""Strike 发布限制策略。"""

import pytest
from sqlalchemy import delete

from app.core.strike_policy import STRIKE_PUBLISH_BLOCK, publish_block_reasons
from app.database import async_session
from app.domains.platform.models import UserAccount


@pytest.mark.asyncio
async def test_publish_blocked_when_strikes_reach_threshold():
    creator_id = "creator-strike-threshold-test"
    async with async_session() as db:
        await db.execute(delete(UserAccount).where(UserAccount.creator_id == creator_id))
        await db.commit()
        db.add(
            UserAccount(
                creator_id=creator_id,
                player_token="player-strike-threshold-test",
                strike_count=STRIKE_PUBLISH_BLOCK,
            )
        )
        await db.commit()

        reasons = await publish_block_reasons(db, creator_id)
        assert reasons
        assert "暂停公开发布" in reasons[0]

        await db.execute(delete(UserAccount).where(UserAccount.creator_id == creator_id))
        await db.commit()


@pytest.mark.asyncio
async def test_publish_allowed_below_threshold():
    creator_id = "creator-strike-ok-test"
    async with async_session() as db:
        await db.execute(delete(UserAccount).where(UserAccount.creator_id == creator_id))
        await db.commit()
        db.add(
            UserAccount(
                creator_id=creator_id,
                player_token="player-strike-ok-test",
                strike_count=STRIKE_PUBLISH_BLOCK - 1,
            )
        )
        await db.commit()

        assert await publish_block_reasons(db, creator_id) == []

        await db.execute(delete(UserAccount).where(UserAccount.creator_id == creator_id))
        await db.commit()


@pytest.mark.asyncio
async def test_publish_blocked_when_banned():
    creator_id = "creator-banned-publish-test"
    async with async_session() as db:
        await db.execute(delete(UserAccount).where(UserAccount.creator_id == creator_id))
        await db.commit()
        db.add(
            UserAccount(
                creator_id=creator_id,
                player_token="player-banned-publish-test",
                is_banned=True,
            )
        )
        await db.commit()

        reasons = await publish_block_reasons(db, creator_id)
        assert any("封禁" in r for r in reasons)

        await db.execute(delete(UserAccount).where(UserAccount.creator_id == creator_id))
        await db.commit()
