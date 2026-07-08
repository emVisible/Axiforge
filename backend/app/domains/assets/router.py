# --- from routes/editor/asset.py ---

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import Page
from app.database import get_db
from app.domains.assets.schemas import (
    AssetSceneCreate,
    AssetSceneUpdate,
    AssetSceneResponse,
    AssetItemCreate,
    AssetItemUpdate,
    AssetItemResponse,
)
from app.domains.assets.service import AssetService

editor_asset_router = APIRouter(prefix="/api/v1/editor/assets", tags=["editor-assets"])


# ================================================================
# Scene
# ================================================================


@editor_asset_router.post("/scenes", response_model=AssetSceneResponse, status_code=201)
async def create_scene(data: AssetSceneCreate, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).create_scene(data)


@editor_asset_router.get("/scenes/public", response_model=List[AssetSceneResponse])
async def list_public_scenes(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).list_public_scenes(skip, limit, search, tags)


@editor_asset_router.get("/scenes/discover", response_model=Page[AssetSceneResponse])
async def discover_scenes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """带总数的场景模板分页查询，供 Discover 多标签浏览使用。"""
    return await AssetService(db).search_public_scenes(skip, limit, search, tags)


@editor_asset_router.get("/scenes/user/{author_id}", response_model=List[AssetSceneResponse])
async def list_user_scenes(author_id: str, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).list_user_scenes(author_id)


@editor_asset_router.get("/scenes/{scene_id}", response_model=AssetSceneResponse)
async def get_scene(scene_id: UUID, db: AsyncSession = Depends(get_db)):
    scene = await AssetService(db).get_scene(scene_id)
    if not scene:
        raise HTTPException(404, "Scene not found")
    return scene


@editor_asset_router.put("/scenes/{scene_id}", response_model=AssetSceneResponse)
async def update_scene(
    scene_id: UUID,
    data: AssetSceneUpdate,
    db: AsyncSession = Depends(get_db),
):
    scene = await AssetService(db).update_scene(scene_id, data)
    if not scene:
        raise HTTPException(404, "Scene not found")
    return scene


@editor_asset_router.delete("/scenes/{scene_id}", status_code=204)
async def delete_scene(scene_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await AssetService(db).delete_scene(scene_id):
        raise HTTPException(404, "Scene not found")


# ================================================================
# Item
# ================================================================


@editor_asset_router.post("/items", response_model=AssetItemResponse, status_code=201)
async def create_item(data: AssetItemCreate, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).create_item(data)


@editor_asset_router.get("/items/public", response_model=List[AssetItemResponse])
async def list_public_items(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).list_public_items(skip, limit, category, search)


@editor_asset_router.get("/items/discover", response_model=Page[AssetItemResponse])
async def discover_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """带总数的道具分页查询，供 Discover 多标签浏览使用。"""
    return await AssetService(db).search_public_items(skip, limit, category, search)


@editor_asset_router.get("/items/user/{author_id}", response_model=List[AssetItemResponse])
async def list_user_items(author_id: str, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).list_user_items(author_id)


@editor_asset_router.get("/items/{item_id}", response_model=AssetItemResponse)
async def get_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    item = await AssetService(db).get_item(item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@editor_asset_router.put("/items/{item_id}", response_model=AssetItemResponse)
async def update_item(
    item_id: UUID,
    data: AssetItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    item = await AssetService(db).update_item(item_id, data)
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@editor_asset_router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await AssetService(db).delete_item(item_id):
        raise HTTPException(404, "Item not found")

# --- from routes/upload.py ---
import hashlib
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.image_compress import compress_image
from app.config import settings

upload_router = APIRouter(prefix="/api/v1", tags=["upload"])

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
MAX_SIZE = 5 * 1024 * 1024  # 5MB
_EXT_BY_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


@upload_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "仅支持 JPEG/PNG/WebP/GIF")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "图片不能超过 5MB")

    contents, out_type = compress_image(contents, file.content_type or "")
    digest = hashlib.sha256(contents).hexdigest()
    ext = _EXT_BY_TYPE.get(out_type, _EXT_BY_TYPE.get(file.content_type or "", "png"))
    filename = f"{digest[:32]}.{ext}"
    filepath = Path(settings.upload_dir) / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    if not filepath.exists():
        filepath.write_bytes(contents)

    return {"url": f"/uploads/{filename}"}

routers = [editor_asset_router, upload_router]
