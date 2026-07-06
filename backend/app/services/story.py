from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.story import CharacterStory


class StoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_story(self, character_id: UUID, data) -> CharacterStory:
        word_count = len(data.content.replace('\n', ' ').split()) if data.content else 0
        story = CharacterStory(
            character_id=character_id,
            title=data.title,
            content=data.content or "",
            word_count=word_count,
        )
        self.db.add(story)
        await self.db.commit()
        await self.db.refresh(story)
        return story

    async def get_stories(self, character_id: UUID) -> List[CharacterStory]:
        result = await self.db.execute(
            select(CharacterStory)
            .where(CharacterStory.character_id == character_id)
            .order_by(CharacterStory.sort_order, CharacterStory.created_at.desc())
        )
        return result.scalars().all()

    async def get_story(self, story_id: UUID) -> Optional[CharacterStory]:
        result = await self.db.execute(
            select(CharacterStory).where(CharacterStory.id == story_id)
        )
        return result.scalar_one_or_none()

    async def update_story(self, story_id: UUID, data) -> Optional[CharacterStory]:
        story = await self.get_story(story_id)
        if not story:
            return None
        if data.title is not None:
            story.title = data.title
        if data.content is not None:
            story.content = data.content
            story.word_count = len(data.content.replace('\n', ' ').split())
        if data.sort_order is not None:
            story.sort_order = data.sort_order
        await self.db.commit()
        await self.db.refresh(story)
        return story

    async def delete_story(self, story_id: UUID) -> bool:
        story = await self.get_story(story_id)
        if not story:
            return False
        await self.db.delete(story)
        await self.db.commit()
        return True