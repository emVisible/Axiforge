
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...schemas.asset import (
    AssetSceneCreate,
    AssetSceneUpdate,
    AssetSceneResponse,
    AssetItemCreate,
    AssetItemUpdate,
    AssetItemResponse,
)
from ...services.asset import AssetService

router = APIRouter(prefix="/api/v1/editor/assets", tags=["editor-assets"])


# ================================================================
# Scene
# ================================================================


@router.post("/scenes", response_model=AssetSceneResponse, status_code=201)
async def create_scene(data: AssetSceneCreate, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).create_scene(data)


@router.get("/scenes/public", response_model=List[AssetSceneResponse])
async def list_public_scenes(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).list_public_scenes(skip, limit, search, tags)


@router.get("/scenes/user/{author_id}", response_model=List[AssetSceneResponse])
async def list_user_scenes(author_id: str, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).list_user_scenes(author_id)


@router.get("/scenes/{scene_id}", response_model=AssetSceneResponse)
async def get_scene(scene_id: UUID, db: AsyncSession = Depends(get_db)):
    scene = await AssetService(db).get_scene(scene_id)
    if not scene:
        raise HTTPException(404, "Scene not found")
    return scene


@router.put("/scenes/{scene_id}", response_model=AssetSceneResponse)
async def update_scene(
    scene_id: UUID,
    data: AssetSceneUpdate,
    db: AsyncSession = Depends(get_db),
):
    scene = await AssetService(db).update_scene(scene_id, data)
    if not scene:
        raise HTTPException(404, "Scene not found")
    return scene


@router.delete("/scenes/{scene_id}", status_code=204)
async def delete_scene(scene_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await AssetService(db).delete_scene(scene_id):
        raise HTTPException(404, "Scene not found")


# ================================================================
# Item
# ================================================================


@router.post("/items", response_model=AssetItemResponse, status_code=201)
async def create_item(data: AssetItemCreate, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).create_item(data)


@router.get("/items/public", response_model=List[AssetItemResponse])
async def list_public_items(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).list_public_items(skip, limit, category, search)


@router.get("/items/user/{author_id}", response_model=List[AssetItemResponse])
async def list_user_items(author_id: str, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).list_user_items(author_id)


@router.get("/items/{item_id}", response_model=AssetItemResponse)
async def get_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    item = await AssetService(db).get_item(item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.put("/items/{item_id}", response_model=AssetItemResponse)
async def update_item(
    item_id: UUID,
    data: AssetItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    item = await AssetService(db).update_item(item_id, data)
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await AssetService(db).delete_item(item_id):
        raise HTTPException(404, "Item not found")
