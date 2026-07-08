# --- from routes/search.py ---

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.assets.models import AssetItem, AssetScene
from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.narrative.service import ProjectService
from app.domains.character.service import CharacterService

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.get("/discover")
async def discover(
    skip: int = 0,
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
):
    """统一发现页数据：公开剧本 + 角色（v1.5）"""
    projects = await ProjectService(db).list_public(skip, limit)
    chars = await CharacterService(db).get_public_characters(skip=skip, limit=limit)
    return {
        "projects": projects,
        "characters": [
            {
                "id": str(c.id),
                "name": c.name,
                "author_id": c.author_id,
                "image_path": c.image_path,
                "view_count": c.view_count,
                "tags": [t.name for t in (c.tags or [])],
            }
            for c in chars
        ],
    }


@router.get("/all")
async def search_all(
    q: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    if not q.strip():
        return {"results": []}

    term = f"%{q}%"
    results = []

    projects = (
        (
            await db.execute(
                select(Project)
                .where(Project.title.ilike(term), Project.is_public == True)
                .limit(3)
            )
        )
        .scalars()
        .all()
    )
    for p in projects:
        results.append(
            {
                "id": str(p.id),
                "name": p.title,
                "type": "剧本",
                "url": f"/play/{p.id}",
            }
        )

    scenes = (
        (
            await db.execute(
                select(AssetScene)
                .where(AssetScene.name.ilike(term), AssetScene.is_public == True)
                .limit(3)
            )
        )
        .scalars()
        .all()
    )
    for s in scenes:
        results.append(
            {
                "id": str(s.id),
                "name": s.name,
                "type": "场景",
                "url": f"/studio/scenes/{s.id}",
            }
        )

    items = (
        (
            await db.execute(
                select(AssetItem)
                .where(AssetItem.name.ilike(term), AssetItem.is_public == True)
                .limit(3)
            )
        )
        .scalars()
        .all()
    )
    for i in items:
        results.append(
            {
                "id": str(i.id),
                "name": i.name,
                "type": "道具",
                "url": f"/studio/items/{i.id}",
            }
        )

    characters = (
        (
            await db.execute(
                select(Character)
                .where(Character.name.ilike(term), Character.is_public == True)
                .limit(3)
            )
        )
        .scalars()
        .all()
    )
    for c in characters:
        results.append(
            {
                "id": str(c.id),
                "name": c.name,
                "type": "角色",
                "url": f"/studio/characters/{c.id}",
            }
        )

    return {"results": results}


@router.get("/scenes")
async def search_scenes(
    q: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    if not q.strip():
        return []
    term = f"%{q}%"
    result = await db.execute(
        select(AssetScene)
        .where(AssetScene.name.ilike(term), AssetScene.is_public == True)
        .limit(8)
    )
    scenes = result.scalars().all()
    return [{"id": str(s.id), "name": s.name} for s in scenes]


@router.get("/items")
async def search_items(
    q: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    if not q.strip():
        return []
    term = f"%{q}%"
    result = await db.execute(
        select(AssetItem)
        .where(AssetItem.name.ilike(term), AssetItem.is_public == True)
        .limit(8)
    )
    items = result.scalars().all()
    return [{"id": str(i.id), "name": i.name} for i in items]
