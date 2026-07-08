# --- from routes/character.py ---
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.character.schemas import (
    CharacterCreate,
    CharacterForkRequest,
    CharacterResponse,
    CharacterSearchResponse,
    CharacterUpdate,
)
from app.domains.character.service import CharacterService
from app.domains.character.schemas import CharacterExportRequest

character_router = APIRouter(prefix="/api/v1/characters", tags=["characters"])


@character_router.post("/", response_model=CharacterResponse, status_code=201)
async def create_character(
    character: CharacterCreate, db: AsyncSession = Depends(get_db)
):
    service = CharacterService(db)
    return await service.create_character(character)


@character_router.get("/public", response_model=CharacterSearchResponse)
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


@character_router.get("/user/{author_id}", response_model=List[CharacterResponse])
async def list_user_characters(author_id: str, db: AsyncSession = Depends(get_db)):
    service = CharacterService(db)
    return await service.get_user_characters(author_id)


@character_router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: UUID,
    bump_view: bool = Query(False),
    viewer_token: Optional[str] = Query(None, max_length=128),
    db: AsyncSession = Depends(get_db),
):
    service = CharacterService(db)
    character = await service.get_character(
        character_id, bump_view=bump_view, viewer_token=viewer_token
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@character_router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: UUID, update: CharacterUpdate, db: AsyncSession = Depends(get_db)
):
    service = CharacterService(db)
    try:
        character = await service.update_character(character_id, update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@character_router.delete("/{character_id}", status_code=204)
async def delete_character(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = CharacterService(db)
    deleted = await service.delete_character(character_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Character not found")


@character_router.post("/{character_id}/fork", response_model=CharacterResponse)
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


@character_router.get("/{character_id}/fork-chain")
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


@character_router.post("/{character_id}/export")
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
        from app.domains.character.story_service import StoryService

        story_service = StoryService(db)
        stories = await story_service.get_stories(character_id)
        result["stories"] = [
            {"title": s.title, "content": s.content, "word_count": s.word_count}
            for s in stories
        ]

    if request.include_relations:
        from app.domains.character.relation_service import RelationService

        relation_service = RelationService(db)
        relations = await relation_service.get_relations_for_character(character_id)
        result["relations"] = relations

    return result

# --- from routes/story.py ---
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.character.schemas import StoryCreate, StoryUpdate, StoryResponse, StoryListResponse
from app.domains.character.story_service import StoryService

story_router = APIRouter(prefix="/api/v1/characters", tags=["stories"])


@story_router.post("/{character_id}/stories", response_model=StoryResponse, status_code=201)
async def create_story(character_id: UUID, data: StoryCreate, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    return await service.create_story(character_id, data)


@story_router.get("/{character_id}/stories", response_model=List[StoryListResponse])
async def list_stories(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    return await service.get_stories(character_id)


@story_router.get("/{character_id}/stories/{story_id}", response_model=StoryResponse)
async def get_story(character_id: UUID, story_id: UUID, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    story = await service.get_story(story_id)
    if not story or story.character_id != character_id:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@story_router.put("/{character_id}/stories/{story_id}", response_model=StoryResponse)
async def update_story(character_id: UUID, story_id: UUID, data: StoryUpdate, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    story = await service.get_story(story_id)
    if not story or story.character_id != character_id:
        raise HTTPException(status_code=404)
    return await service.update_story(story_id, data)


@story_router.delete("/{character_id}/stories/{story_id}", status_code=204)
async def delete_story(character_id: UUID, story_id: UUID, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    story = await service.get_story(story_id)
    if not story or story.character_id != character_id:
        raise HTTPException(status_code=404)
    await service.delete_story(story_id)

# --- from routes/relation.py ---
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.character.schemas import (
    RelationCreate,
    RelationUpdate,
    RelationResponse,
    RelationGraphResponse,
)
from app.domains.character.relation_service import RelationService
from app.domains.character.relation_service import get_presets_by_category

relation_router = APIRouter(tags=["relations"])


# 预设关系 — 独立路径，放最前面
@relation_router.get("/api/v1/relations/presets")
async def get_presets():
    return get_presets_by_category()


# 角色关系
@relation_router.get(
    "/api/v1/characters/{character_id}/relations", response_model=List[RelationResponse]
)
async def list_relations(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = RelationService(db)
    return await service.get_relations_for_character(character_id)


@relation_router.post(
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


@relation_router.get(
    "/api/v1/characters/{character_id}/relation-graph",
    response_model=RelationGraphResponse,
)
async def get_relation_graph(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = RelationService(db)
    return await service.get_relation_graph(character_id)


@relation_router.get(
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


@relation_router.put("/api/v1/characters/{character_id}/relations/{relation_id}")
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


@relation_router.delete(
    "/api/v1/characters/{character_id}/relations/{relation_id}", status_code=204
)
async def delete_relation(
    character_id: UUID, relation_id: UUID, db: AsyncSession = Depends(get_db)
):
    service = RelationService(db)
    deleted = await service.delete_relation(relation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Relation not found")

# --- from routes/version.py ---
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.character.schemas import VersionResponse, VersionDetailResponse, RollbackRequest
from app.domains.character.version_service import VersionService
from app.domains.character.service import CharacterService

version_router = APIRouter(prefix="/api/v1/characters", tags=["versions"])


@version_router.get("/{character_id}/versions", response_model=List[VersionResponse])
async def list_versions(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = VersionService(db)
    versions = await service.get_versions(character_id)
    return [
        {
            "id": v.id,
            "character_id": v.character_id,
            "version_number": v.version_number,
            "name": v.name,
            "tags": v.tags_json or [],
            "change_summary": v.change_summary,
            "created_at": v.created_at,
        }
        for v in versions
    ]


@version_router.get("/{character_id}/versions/{version_id}", response_model=VersionDetailResponse)
async def get_version(character_id: UUID, version_id: UUID, db: AsyncSession = Depends(get_db)):
    service = VersionService(db)
    version = await service.get_version(version_id)
    if not version or version.character_id != character_id:
        raise HTTPException(status_code=404, detail="Version not found")
    return {
        "id": version.id,
        "character_id": version.character_id,
        "version_number": version.version_number,
        "name": version.name,
        "tags": version.tags_json or [],
        "character_data": version.character_data,
        "change_summary": version.change_summary,
        "created_at": version.created_at,
    }


@version_router.post("/{character_id}/versions/{version_id}/rollback")
async def rollback_version(
    character_id: UUID,
    version_id: UUID,
    request: RollbackRequest = RollbackRequest(),
    db: AsyncSession = Depends(get_db),
):
    service = VersionService(db)
    character = await service.rollback(character_id, version_id, request.change_summary)
    if not character:
        raise HTTPException(status_code=404, detail="Version or character not found")

    char_service = CharacterService(db)
    return await char_service.get_character(character_id)

# --- from routes/tag.py ---
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.character.schemas import TagResponse
from app.domains.character.tag_service import TagService

tag_router = APIRouter(prefix="/api/v1/tags", tags=["tags"])


@tag_router.get("/", response_model=List[TagResponse])
async def list_tags(
    sort_by: str = Query("usage", pattern="^(usage|name)$"),
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    return await service.get_all_tags(sort_by=sort_by)

routers = [character_router, story_router, relation_router, version_router, tag_router]
