from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=settings.environment == "development")
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


def register_models() -> None:
    """Import all ORM models so Base.metadata is populated."""
    from app.domains.assets.models import AssetItem, AssetScene  # noqa: F401
    from app.domains.character.models import (  # noqa: F401
        Character,
        CharacterRelation,
        CharacterStory,
        CharacterVersion,
        Tag,
        character_tags,
    )
    from app.domains.narrative.models import (  # noqa: F401
        Project,
        ProjectAssetRef,
        ProjectEdge,
        ProjectNode,
        ProjectRole,
        ProjectScene,
    )
    from app.domains.platform.models import (  # noqa: F401
        AuditLog,
        Comment,
        ContentReport,
        IdentityLink,
        PlatformEvent,
        UserAccount,
        Violation,
    )
    from app.domains.runtime.models import (  # noqa: F401
        CharacterRuntimeState,
        PlayerCodexEntry,
        RuntimeSession,
        SaveSlot,
        SessionEvent,
        SessionFlag,
        SessionMemory,
    )


async def init_db():
    register_models()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # v1.4 增量列：create_all 不修改已有表，开发/测试库需补列
        from sqlalchemy import text

        await conn.execute(
            text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS play_meta JSONB DEFAULT '{}'::jsonb"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE save_slots ADD COLUMN IF NOT EXISTS thumb_path VARCHAR(500)"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS fork_from UUID"
            )
        )
        # ADR-017: 节点独立于场景
        await conn.execute(
            text(
                "ALTER TABLE project_nodes ADD COLUMN IF NOT EXISTS project_id UUID"
            )
        )
        await conn.execute(
            text(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'project_nodes' AND column_name = 'scene_id'
                  ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'project_nodes' AND column_name = 'stage_id'
                  ) THEN
                    ALTER TABLE project_nodes RENAME COLUMN scene_id TO stage_id;
                  END IF;
                END $$
                """
            )
        )
        await conn.execute(
            text(
                """
                UPDATE project_nodes pn
                SET project_id = ps.project_id
                FROM project_scenes ps
                WHERE pn.project_id IS NULL AND pn.stage_id = ps.id
                """
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE project_nodes ALTER COLUMN stage_id DROP NOT NULL"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS axs_source TEXT DEFAULT ''"
            )
        )
        # ADR-018: 内容治理
        await conn.execute(
            text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_status VARCHAR(32) DEFAULT 'published'"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE characters ADD COLUMN IF NOT EXISTS content_status VARCHAR(32) DEFAULT 'published'"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending'"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolution_note TEXT"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS role VARCHAR(16) DEFAULT 'user'"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS strike_count INTEGER DEFAULT 0"
            )
        )
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS platform_events (
                    id UUID PRIMARY KEY,
                    event_type VARCHAR(64) NOT NULL,
                    subject_type VARCHAR(32),
                    subject_id VARCHAR(128),
                    actor_token VARCHAR(128),
                    meta JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_platform_events_event_type ON platform_events (event_type)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_platform_events_created_at ON platform_events (created_at)"
            )
        )
