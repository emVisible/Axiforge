
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.runtime import SaveSlot
from app.schemas.save import SaveSlotUpsert


class SaveService:
    """存档槽持久化（桥4 第二层）。

    单槽自动存档：以 (project_id, player_token, slot) 唯一定位，存在则覆盖。
    存的是整份 RuntimeState，读回后交由 @axiforge/core 的 restore() 续玩。
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _ensure_project(self, project_id: UUID) -> None:
        exists = await self.db.scalar(select(Project.id).where(Project.id == project_id))
        if not exists:
            raise ValueError("Project not found")

    async def upsert(self, project_id: UUID, data: SaveSlotUpsert) -> SaveSlot:
        await self._ensure_project(project_id)
        slot = await self.db.scalar(
            select(SaveSlot).where(
                SaveSlot.project_id == project_id,
                SaveSlot.player_token == data.player_token,
                SaveSlot.slot == data.slot,
            )
        )
        if slot is None:
            slot = SaveSlot(
                project_id=project_id,
                player_token=data.player_token,
                slot=data.slot,
            )
            self.db.add(slot)
        slot.state = data.state
        slot.summary = data.summary
        slot.beat_id = data.beat_id
        slot.thumb_path = data.thumb_path
        await self.db.commit()
        await self.db.refresh(slot)
        return slot

    async def get(
        self, project_id: UUID, player_token: str, slot: int = 0
    ) -> Optional[SaveSlot]:
        return await self.db.scalar(
            select(SaveSlot).where(
                SaveSlot.project_id == project_id,
                SaveSlot.player_token == player_token,
                SaveSlot.slot == slot,
            )
        )

    async def list_saves(
        self, project_id: UUID, player_token: str
    ) -> List[SaveSlot]:
        result = await self.db.execute(
            select(SaveSlot)
            .where(
                SaveSlot.project_id == project_id,
                SaveSlot.player_token == player_token,
            )
            .order_by(SaveSlot.slot)
        )
        return list(result.scalars().all())

    async def clear(self, project_id: UUID, player_token: str, slot: int = 0) -> None:
        await self.db.execute(
            delete(SaveSlot).where(
                SaveSlot.project_id == project_id,
                SaveSlot.player_token == player_token,
                SaveSlot.slot == slot,
            )
        )
        await self.db.commit()
