from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.story import StoryCreate, StoryUpdate, StoryResponse, StoryListResponse
from app.services.story import StoryService

router = APIRouter(prefix="/api/v1/characters", tags=["stories"])


@router.post("/{character_id}/stories", response_model=StoryResponse, status_code=201)
async def create_story(character_id: UUID, data: StoryCreate, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    return await service.create_story(character_id, data)


@router.get("/{character_id}/stories", response_model=List[StoryListResponse])
async def list_stories(character_id: UUID, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    return await service.get_stories(character_id)


@router.get("/{character_id}/stories/{story_id}", response_model=StoryResponse)
async def get_story(character_id: UUID, story_id: UUID, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    story = await service.get_story(story_id)
    if not story or story.character_id != character_id:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.put("/{character_id}/stories/{story_id}", response_model=StoryResponse)
async def update_story(character_id: UUID, story_id: UUID, data: StoryUpdate, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    story = await service.get_story(story_id)
    if not story or story.character_id != character_id:
        raise HTTPException(status_code=404)
    return await service.update_story(story_id, data)


@router.delete("/{character_id}/stories/{story_id}", status_code=204)
async def delete_story(character_id: UUID, story_id: UUID, db: AsyncSession = Depends(get_db)):
    service = StoryService(db)
    story = await service.get_story(story_id)
    if not story or story.character_id != character_id:
        raise HTTPException(status_code=404)
    await service.delete_story(story_id)