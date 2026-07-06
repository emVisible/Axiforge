from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.relation import (
    RelationCreate,
    RelationUpdate,
    RelationResponse,
    RelationGraphResponse,
)
from app.services.relation import RelationService
from app.services.relation_presets import get_presets_by_category

router = APIRouter(tags=["relations"])


# 预设关系 — 独立路径，放最前面
@router.get("/api/v1/relations/presets")
async def get_presets():
    return get_presets_by_category()


# 角色关系
@router.get(
    "/api/v1/characters/{character_id}/relations", response_model=List[RelationResponse]
)
async def list_relations(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = RelationService(db)
    return await service.get_relations_for_character(character_id)


@router.post(
    "/api/v1/characters/{character_id}/relations",
    response_model=RelationResponse,
    status_code=201,
)
async def create_relation(
    character_id: UUID, data: RelationCreate, db: AsyncSession = Depends(get_db)
):
    if data.target_id == character_id:
        raise HTTPException(status_code=400, detail="不能与自己建立关系")
    service = RelationService(db)
    result = await service.create_relation(character_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Target character not found")
    return result


@router.get(
    "/api/v1/characters/{character_id}/relation-graph",
    response_model=RelationGraphResponse,
)
async def get_relation_graph(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = RelationService(db)
    return await service.get_relation_graph(character_id)


@router.get(
    "/api/v1/characters/{character_id}/relations/{relation_id}",
    response_model=RelationResponse,
)
async def get_relation(
    character_id: UUID, relation_id: UUID, db: AsyncSession = Depends(get_db)
):
    service = RelationService(db)
    relations = await service.get_relations_for_character(character_id)
    for r in relations:
        if r["id"] == str(relation_id):
            return r
    raise HTTPException(status_code=404, detail="Relation not found")


@router.put("/api/v1/characters/{character_id}/relations/{relation_id}")
async def update_relation(
    character_id: UUID,
    relation_id: UUID,
    data: RelationUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = RelationService(db)
    relation = await service.update_relation(relation_id, data)
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    return {"ok": True}


@router.delete(
    "/api/v1/characters/{character_id}/relations/{relation_id}", status_code=204
)
async def delete_relation(
    character_id: UUID, relation_id: UUID, db: AsyncSession = Depends(get_db)
):
    service = RelationService(db)
    deleted = await service.delete_relation(relation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Relation not found")
