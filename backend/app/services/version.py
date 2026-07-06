from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.version import CharacterVersion
from app.models.character import Character
from app.models.tag import Tag


class VersionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_version(
        self, character: Character, change_summary: Optional[str] = None
    ) -> CharacterVersion:
        """为角色创建版本快照"""
        # 获取当前最大版本号
        result = await self.db.execute(
            select(func.max(CharacterVersion.version_number)).where(
                CharacterVersion.character_id == character.id
            )
        )
        max_version = result.scalar() or 0

        version = CharacterVersion(
            character_id=character.id,
            version_number=max_version + 1,
            character_data=character.character_data,
            name=character.name,
            tags_json=[t.name for t in character.tags],
            change_summary=change_summary,
        )
        self.db.add(version)
        await self.db.commit()
        await self.db.refresh(version)
        return version

    async def get_versions(self, character_id: UUID) -> List[CharacterVersion]:
        result = await self.db.execute(
            select(CharacterVersion)
            .where(CharacterVersion.character_id == character_id)
            .order_by(CharacterVersion.version_number.desc())
        )
        return result.scalars().all()

    async def get_version(self, version_id: UUID) -> Optional[CharacterVersion]:
        result = await self.db.execute(
            select(CharacterVersion).where(CharacterVersion.id == version_id)
        )
        return result.scalar_one_or_none()

    async def rollback(
        self, character_id: UUID, version_id: UUID, change_summary: Optional[str] = None
    ) -> Optional[Character]:
        from app.models.character import Character
        from sqlalchemy.orm import selectinload
        from sqlalchemy.orm.attributes import flag_modified

        version = await self.get_version(version_id)
        if not version or version.character_id != character_id:
            return None

        # 👇 预加载 tags
        result = await self.db.execute(
            select(Character)
            .where(Character.id == character_id)
            .options(selectinload(Character.tags))
        )
        character = result.scalar_one_or_none()
        if not character:
            return None

        # 保存当前状态
        await self.create_version(
            character,
            change_summary or f"回滚到 v{version.version_number} 前的自动保存",
        )

        # 恢复数据
        character.character_data = version.character_data
        character.name = version.name
        flag_modified(character, "character_data")

        await self.db.commit()

        # 重新查询返回
        result = await self.db.execute(
            select(Character)
            .where(Character.id == character_id)
            .options(selectinload(Character.tags))
        )
        return result.scalar_one()

    async def delete_versions(self, character_id: UUID):
        """删除角色的所有版本"""
        result = await self.db.execute(
            select(CharacterVersion).where(
                CharacterVersion.character_id == character_id
            )
        )
        for v in result.scalars().all():
            await self.db.delete(v)
        await self.db.commit()
