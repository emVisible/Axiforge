# --- from services/tag.py ---
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.domains.character.models import Tag


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

# --- from services/tag_color.py ---
import hashlib

PRESET_COLORS = [
    "#C44D4D",
    "#B8602A",
    "#7A8C4A",
    "#4A6B8C",
    "#8C5A7A",
    "#5A7A6A",
    "#9C6A4A",
    "#6A5A8C",
    "#4A7A8C",
    "#8C6A5A",
    "#6A8C5A",
    "#8C4A6A",
    "#5A6A8C",
    "#9C8A5A",
    "#6A4A5A",
    "#4A8C7A",
]


def generate_tag_color(name: str) -> str:
    hash_val = int(hashlib.md5(name.encode()).hexdigest(), 16)
    return PRESET_COLORS[hash_val % len(PRESET_COLORS)]
