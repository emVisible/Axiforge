
from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.asset import AssetScene, AssetItem
from app.schemas.asset import (
    AssetSceneCreate,
    AssetSceneUpdate,
    AssetSceneResponse,
    AssetItemCreate,
    AssetItemUpdate,
    AssetItemResponse,
)


class AssetService:
    """全局资产池管理——场景/道具"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ================================================================
    # Scene
    # ================================================================

    async def create_scene(self, data: AssetSceneCreate) -> AssetSceneResponse:
        scene = AssetScene(**data.model_dump())
        self.db.add(scene)
        await self.db.commit()
        await self.db.refresh(scene)
        return AssetSceneResponse.model_validate(scene)

    async def get_scene(self, scene_id: UUID) -> Optional[AssetSceneResponse]:
        scene = await self.db.get(AssetScene, scene_id)
        if not scene:
            return None
        await self._increment_view(scene)
        return AssetSceneResponse.model_validate(scene)

    async def list_public_scenes(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> List[AssetSceneResponse]:
        query = select(AssetScene).where(AssetScene.is_public == True)
        if search:
            query = query.where(AssetScene.name.ilike(f"%{search}%"))
        if tags:
            query = query.where(AssetScene.tags.contains(tags))
        query = query.order_by(AssetScene.updated_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return [AssetSceneResponse.model_validate(s) for s in result.scalars().all()]

    async def list_user_scenes(self, author_id: str) -> List[AssetSceneResponse]:
        result = await self.db.execute(
            select(AssetScene)
            .where(AssetScene.author_id == author_id)
            .order_by(AssetScene.updated_at.desc())
        )
        return [AssetSceneResponse.model_validate(s) for s in result.scalars().all()]

    async def update_scene(
        self, scene_id: UUID, data: AssetSceneUpdate
    ) -> Optional[AssetSceneResponse]:
        scene = await self.db.get(AssetScene, scene_id)
        if not scene:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(scene, key, value)
        await self.db.commit()
        await self.db.refresh(scene)
        return AssetSceneResponse.model_validate(scene)

    async def delete_scene(self, scene_id: UUID) -> bool:
        scene = await self.db.get(AssetScene, scene_id)
        if not scene:
            return False
        await self.db.delete(scene)
        await self.db.commit()
        return True

    # ================================================================
    # Item
    # ================================================================

    async def create_item(self, data: AssetItemCreate) -> AssetItemResponse:
        item = AssetItem(**data.model_dump())
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return AssetItemResponse.model_validate(item)

    async def get_item(self, item_id: UUID) -> Optional[AssetItemResponse]:
        item = await self.db.get(AssetItem, item_id)
        if not item:
            return None
        await self._increment_view(item)
        return AssetItemResponse.model_validate(item)

    async def list_public_items(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[AssetItemResponse]:
        query = select(AssetItem).where(AssetItem.is_public == True)
        if category:
            query = query.where(AssetItem.category == category)
        if search:
            query = query.where(AssetItem.name.ilike(f"%{search}%"))
        query = query.order_by(AssetItem.updated_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return [AssetItemResponse.model_validate(i) for i in result.scalars().all()]

    async def list_user_items(self, author_id: str) -> List[AssetItemResponse]:
        result = await self.db.execute(
            select(AssetItem)
            .where(AssetItem.author_id == author_id)
            .order_by(AssetItem.updated_at.desc())
        )
        return [AssetItemResponse.model_validate(i) for i in result.scalars().all()]

    async def update_item(
        self, item_id: UUID, data: AssetItemUpdate
    ) -> Optional[AssetItemResponse]:
        item = await self.db.get(AssetItem, item_id)
        if not item:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        await self.db.commit()
        await self.db.refresh(item)
        return AssetItemResponse.model_validate(item)

    async def delete_item(self, item_id: UUID) -> bool:
        item = await self.db.get(AssetItem, item_id)
        if not item:
            return False
        await self.db.delete(item)
        await self.db.commit()
        return True

    # ================================================================
    # 内部
    # ================================================================

    async def _increment_view(self, obj) -> None:
        """增加浏览量"""
        if hasattr(obj, "view_count"):
            obj.view_count = (obj.view_count or 0) + 1
            await self.db.commit()
