from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.tag import Tag
from .tag_color import generate_tag_color


class TagService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_tags(self, tag_names: List[str]) -> List[Tag]:
        """根据名称获取或创建标签，返回完整标签列表"""
        if not tag_names:
            return []

        names = [n.strip().lower() for n in tag_names if n.strip()]
        if not names:
            return []

        result = await self.db.execute(select(Tag).where(Tag.name.in_(names)))
        existing_map = {t.name: t for t in result.scalars().all()}

        tags = []
        new_tags = []
        for name in names:
            if name in existing_map:
                tags.append(existing_map[name])
            else:
                tag = Tag(name=name, color=generate_tag_color(name))
                new_tags.append(tag)
                tags.append(tag)

        if new_tags:
            self.db.add_all(new_tags)
            await self.db.flush()

        return tags

    async def get_all_tags(self, sort_by: str = "usage") -> List[Tag]:
        order = Tag.usage_count.desc() if sort_by == "usage" else Tag.name.asc()
        result = await self.db.execute(select(Tag).order_by(order))
        return result.scalars().all()

    async def update_tag_counts(self, tag_ids: List[UUID]):
        """刷新标签使用计数"""
        for tid in tag_ids:
            tag = await self.db.get(Tag, tid)
            if tag:
                await self.db.refresh(tag, ["characters"])
                tag.usage_count = len(tag.characters)
        await self.db.flush()
