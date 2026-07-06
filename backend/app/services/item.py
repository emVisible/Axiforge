from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


class ItemService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ItemCreate) -> Item:
        item = Item(**data.model_dump())
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def get(self, item_id: UUID) -> Optional[Item]:
        return await self.db.get(Item, item_id)

    async def list_public(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Item]:
        q = select(Item).where(Item.is_public == True)
        if category:
            q = q.where(Item.category == category)
        if search:
            q = q.where(Item.name.ilike(f"%{search}%"))
        q = q.order_by(Item.updated_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(q)
        return result.scalars().all()

    async def list_user(self, author_id: str) -> List[Item]:
        result = await self.db.execute(
            select(Item)
            .where(Item.author_id == author_id)
            .order_by(Item.updated_at.desc())
        )
        return result.scalars().all()

    async def update(self, item_id: UUID, data: ItemUpdate) -> Optional[Item]:
        item = await self.get(item_id)
        if not item:
            return None
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(item, k, v)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete(self, item_id: UUID) -> bool:
        item = await self.get(item_id)
        if not item:
            return False
        await self.db.delete(item)
        await self.db.commit()
        return True
