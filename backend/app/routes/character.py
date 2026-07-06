from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.character import (
    CharacterCreate,
    CharacterForkRequest,
    CharacterResponse,
    CharacterSearchResponse,
    CharacterUpdate,
)
from app.services.character import CharacterService
from app.schemas.character import CharacterExportRequest

router = APIRouter(prefix="/api/v1/characters", tags=["characters"])


@router.post("/", response_model=CharacterResponse, status_code=201)
async def create_character(
    character: CharacterCreate, db: AsyncSession = Depends(get_db)
):
    service = CharacterService(db)
    return await service.create_character(character)


@router.get("/public", response_model=CharacterSearchResponse)
async def list_public_characters(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="逗号分隔的标签名"),
    sort: str = Query("recent", pattern="^(recent|popular)$"),
    db: AsyncSession = Depends(get_db),
):
    service = CharacterService(db)
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    characters, total = await service.search_public_characters(
        skip=skip, limit=limit, search=search, tag_names=tag_list, sort_by=sort
    )
    return CharacterSearchResponse(
        items=characters, total=total, skip=skip, limit=limit
    )


@router.get("/user/{author_id}", response_model=List[CharacterResponse])
async def list_user_characters(author_id: str, db: AsyncSession = Depends(get_db)):
    service = CharacterService(db)
    return await service.get_user_characters(author_id)


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = CharacterService(db)
    character = await service.get_character(character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: UUID, update: CharacterUpdate, db: AsyncSession = Depends(get_db)
):
    service = CharacterService(db)
    character = await service.update_character(character_id, update)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.delete("/{character_id}", status_code=204)
async def delete_character(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = CharacterService(db)
    deleted = await service.delete_character(character_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Character not found")


@router.post("/{character_id}/fork", response_model=CharacterResponse)
async def fork_character(
    character_id: UUID,
    fork_request: CharacterForkRequest = CharacterForkRequest(),
    db: AsyncSession = Depends(get_db),
):
    service = CharacterService(db)
    result = await service.fork_character(
        character_id,
        new_name=fork_request.new_name,
        new_author_id=fork_request.author_id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Original character not found")
    _, forked = result
    return forked


@router.get("/{character_id}/fork-chain")
async def get_fork_chain(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = CharacterService(db)
    chain = await service.get_fork_chain(character_id)
    if not chain:
        raise HTTPException(status_code=404, detail="Character not found")
    return {
        "original_id": str(chain["original"].id),
        "original_name": chain["original"].name,
        "total_forks": chain["total_forks"],
        "chain": [
            {
                "id": str(c.id),
                "name": c.name,
                "author_id": c.author_id,
                "created_at": c.created_at.isoformat(),
                "is_current": c.id == character_id,
            }
            for c in chain["chain"]
        ],
    }


@router.post("/{character_id}/export")
async def export_character(
    character_id: UUID,
    request: CharacterExportRequest = CharacterExportRequest(),
    db: AsyncSession = Depends(get_db),
):
    service = CharacterService(db)
    character = await service.get_character(character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    result = {
        "character_data": character.character_data,
        "name": character.name,
        "tags": [t.name for t in character.tags] if character.tags else [],
    }

    if request.include_stories:
        from app.services.story import StoryService

        story_service = StoryService(db)
        stories = await story_service.get_stories(character_id)
        result["stories"] = [
            {"title": s.title, "content": s.content, "word_count": s.word_count}
            for s in stories
        ]

    if request.include_relations:
        from app.services.relation import RelationService

        relation_service = RelationService(db)
        relations = await relation_service.get_relations_for_character(character_id)
        result["relations"] = relations

    return result
