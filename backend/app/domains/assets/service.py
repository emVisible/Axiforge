# --- from services/asset.py ---

from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.core.pagination import Page
from app.domains.assets.models import AssetScene, AssetItem
from app.domains.narrative.models import ProjectAssetRef, ProjectScene
from app.domains.assets.schemas import (
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
        return (await self._attach_scene_ref_counts([scene]))[0]

    async def get_scene(self, scene_id: UUID) -> Optional[AssetSceneResponse]:
        scene = await self.db.get(AssetScene, scene_id)
        if not scene:
            return None
        await self._increment_view(scene)
        return (await self._attach_scene_ref_counts([scene]))[0]

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
        return await self._attach_scene_ref_counts(list(result.scalars().all()))

    async def search_public_scenes(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Page[AssetSceneResponse]:
        """带总数的场景模板分页查询，供 Discover 多标签浏览使用。"""
        base_filter = AssetScene.is_public == True  # noqa: E712
        count_query = select(func.count()).select_from(AssetScene).where(base_filter)
        query = select(AssetScene).where(base_filter)
        if search:
            like = AssetScene.name.ilike(f"%{search}%")
            query = query.where(like)
            count_query = count_query.where(like)
        if tags:
            tag_filter = AssetScene.tags.contains(tags)
            query = query.where(tag_filter)
            count_query = count_query.where(tag_filter)

        total = (await self.db.execute(count_query)).scalar_one()
        result = await self.db.execute(
            query.order_by(AssetScene.updated_at.desc()).offset(skip).limit(limit)
        )
        items = await self._attach_scene_ref_counts(list(result.scalars().all()))
        return Page(items=items, total=total, skip=skip, limit=limit)

    async def list_user_scenes(self, author_id: str) -> List[AssetSceneResponse]:
        result = await self.db.execute(
            select(AssetScene)
            .where(AssetScene.author_id == author_id)
            .order_by(AssetScene.updated_at.desc())
        )
        return await self._attach_scene_ref_counts(list(result.scalars().all()))

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
        return (await self._attach_scene_ref_counts([scene]))[0]

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
        return (await self._attach_item_ref_counts([item]))[0]

    async def get_item(self, item_id: UUID) -> Optional[AssetItemResponse]:
        item = await self.db.get(AssetItem, item_id)
        if not item:
            return None
        await self._increment_view(item)
        return (await self._attach_item_ref_counts([item]))[0]

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
        return await self._attach_item_ref_counts(list(result.scalars().all()))

    async def search_public_items(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Page[AssetItemResponse]:
        """带总数的道具分页查询，供 Discover 多标签浏览使用。"""
        base_filter = AssetItem.is_public == True  # noqa: E712
        count_query = select(func.count()).select_from(AssetItem).where(base_filter)
        query = select(AssetItem).where(base_filter)
        if category:
            cat_filter = AssetItem.category == category
            query = query.where(cat_filter)
            count_query = count_query.where(cat_filter)
        if search:
            like = AssetItem.name.ilike(f"%{search}%")
            query = query.where(like)
            count_query = count_query.where(like)

        total = (await self.db.execute(count_query)).scalar_one()
        result = await self.db.execute(
            query.order_by(AssetItem.updated_at.desc()).offset(skip).limit(limit)
        )
        items = await self._attach_item_ref_counts(list(result.scalars().all()))
        return Page(items=items, total=total, skip=skip, limit=limit)

    async def list_user_items(self, author_id: str) -> List[AssetItemResponse]:
        result = await self.db.execute(
            select(AssetItem)
            .where(AssetItem.author_id == author_id)
            .order_by(AssetItem.updated_at.desc())
        )
        return await self._attach_item_ref_counts(list(result.scalars().all()))

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
        return (await self._attach_item_ref_counts([item]))[0]

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

    async def _item_ref_counts(self, item_ids: List[UUID]) -> dict[str, int]:
        if not item_ids:
            return {}
        result = await self.db.execute(
            select(ProjectAssetRef.asset_id, func.count())
            .where(ProjectAssetRef.asset_type == "item")
            .where(ProjectAssetRef.asset_id.in_(item_ids))
            .group_by(ProjectAssetRef.asset_id)
        )
        return {str(row[0]): int(row[1]) for row in result.all()}

    async def _scene_ref_counts(self, scene_ids: List[UUID]) -> dict[str, int]:
        if not scene_ids:
            return {}
        result = await self.db.execute(
            select(ProjectScene.scene_ref_id, func.count())
            .where(ProjectScene.scene_ref_id.in_(scene_ids))
            .group_by(ProjectScene.scene_ref_id)
        )
        return {
            str(row[0]): int(row[1])
            for row in result.all()
            if row[0] is not None
        }

    async def _attach_item_ref_counts(
        self, items: List[AssetItem]
    ) -> List[AssetItemResponse]:
        counts = await self._item_ref_counts([i.id for i in items])
        return [
            AssetItemResponse.model_validate(i).model_copy(
                update={"ref_count": counts.get(str(i.id), 0)}
            )
            for i in items
        ]

    async def _attach_scene_ref_counts(
        self, scenes: List[AssetScene]
    ) -> List[AssetSceneResponse]:
        counts = await self._scene_ref_counts([s.id for s in scenes])
        return [
            AssetSceneResponse.model_validate(s).model_copy(
                update={"ref_count": counts.get(str(s.id), 0)}
            )
            for s in scenes
        ]
