from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.world import WorldScene, WorldSceneNode
from app.schemas.world import WorldSceneCreate, WorldSceneUpdate


class WorldSceneService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: WorldSceneCreate) -> WorldScene:
        scene = WorldScene(**data.model_dump())
        self.db.add(scene)
        await self.db.commit()
        await self.db.refresh(scene)
        return scene

    async def get(self, scene_id: UUID) -> Optional[WorldScene]:
        result = await self.db.execute(
            select(WorldScene)
            .where(WorldScene.id == scene_id)
            .options(selectinload(WorldScene.nodes))
        )
        return result.scalar_one_or_none()

    async def list_public(
        self,
        skip: int = 0,
        limit: int = 20,
        tag: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[WorldScene]:
        q = (
            select(WorldScene)
            .where(WorldScene.is_public == True)
            .options(selectinload(WorldScene.nodes))
        )
        if tag:
            q = q.where(WorldScene.tags.contains([tag]))
        if search:
            q = q.where(WorldScene.name.ilike(f"%{search}%"))
        q = q.order_by(WorldScene.updated_at.desc()).offset(skip).limit(limit)
        return (await self.db.execute(q)).scalars().unique().all()

    async def list_user(self, author_id: str) -> List[WorldScene]:
        result = await self.db.execute(
            select(WorldScene)
            .where(WorldScene.author_id == author_id)
            .order_by(WorldScene.updated_at.desc())
            .options(selectinload(WorldScene.nodes))
        )
        return result.scalars().unique().all()

    async def update(
        self, scene_id: UUID, data: WorldSceneUpdate
    ) -> Optional[WorldScene]:
        scene = await self.get(scene_id)
        if not scene:
            return None
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(scene, k, v)
        await self.db.commit()
        await self.db.refresh(scene)
        return scene

    async def delete(self, scene_id: UUID) -> bool:
        scene = await self.get(scene_id)
        if not scene:
            return False
        await self.db.delete(scene)
        await self.db.commit()
        return True

    async def add_node(
        self, scene_id: UUID, title: str, description: str = "", is_anchor: bool = False
    ) -> WorldSceneNode:
        node = WorldSceneNode(
            scene_id=scene_id, title=title, description=description, is_anchor=is_anchor
        )
        self.db.add(node)
        await self.db.commit()
        await self.db.refresh(node)
        return node

    async def update_node(self, node_id: UUID, **kwargs) -> Optional[WorldSceneNode]:
        node = await self.db.get(WorldSceneNode, node_id)
        if not node:
            return None
        for k, v in kwargs.items():
            if v is not None:
                setattr(node, k, v)
        await self.db.commit()
        await self.db.refresh(node)
        return node

    async def delete_node(self, node_id: UUID) -> bool:
        node = await self.db.get(WorldSceneNode, node_id)
        if not node:
            return False
        await self.db.delete(node)
        await self.db.commit()
        return True
