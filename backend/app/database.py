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
    from app.models.asset import AssetItem, AssetScene  # noqa: F401
    from app.models.character import Character  # noqa: F401
    from app.models.project import (  # noqa: F401
        Project,
        ProjectAssetRef,
        ProjectEdge,
        ProjectNode,
        ProjectRole,
        ProjectScene,
    )
    from app.models.relation import CharacterRelation  # noqa: F401
    from app.models.runtime import (  # noqa: F401
        CharacterRuntimeState,
        RuntimeSession,
        SessionEvent,
        SessionFlag,
        SessionMemory,
    )
    from app.models.story import CharacterStory  # noqa: F401
    from app.models.tag import Tag  # noqa: F401
    from app.models.version import CharacterVersion  # noqa: F401


async def init_db():
    register_models()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
