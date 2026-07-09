"""Achievement business logic."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.ginkgo.models import AchievementDefinition, PlayerAchievement
from app.domains.ginkgo.schemas import (
    AchievementCreate,
    AchievementResponse,
    AchievementUpdate,
    PlayerAchievementResponse,
)


class AchievementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_project(self, project_id: UUID) -> List[AchievementResponse]:
        rows = (
            await self.db.execute(
                select(AchievementDefinition)
                .where(AchievementDefinition.project_id == project_id)
                .order_by(AchievementDefinition.created_at.asc())
            )
        ).scalars().all()
        return [AchievementResponse.model_validate(r) for r in rows]

    async def create(
        self, project_id: UUID, data: AchievementCreate
    ) -> AchievementResponse:
        row = AchievementDefinition(
            project_id=project_id,
            key=data.key,
            title=data.title,
            description=data.description,
            icon=data.icon,
            condition=data.condition,
            is_public=data.is_public,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return AchievementResponse.model_validate(row)

    async def update(
        self, achievement_id: UUID, data: AchievementUpdate
    ) -> Optional[AchievementResponse]:
        row = (
            await self.db.execute(
                select(AchievementDefinition).where(AchievementDefinition.id == achievement_id)
            )
        ).scalar_one_or_none()
        if not row:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        await self.db.commit()
        await self.db.refresh(row)
        return AchievementResponse.model_validate(row)

    async def delete(self, achievement_id: UUID) -> bool:
        row = (
            await self.db.execute(
                select(AchievementDefinition).where(AchievementDefinition.id == achievement_id)
            )
        ).scalar_one_or_none()
        if not row:
            return False
        await self.db.delete(row)
        await self.db.commit()
        return True

    async def unlock(
        self,
        project_id: UUID,
        player_token: str,
        achievement_key: str,
    ) -> Optional[PlayerAchievementResponse]:
        ach = (
            await self.db.execute(
                select(AchievementDefinition).where(
                    AchievementDefinition.project_id == project_id,
                    AchievementDefinition.key == achievement_key,
                )
            )
        ).scalar_one_or_none()
        if not ach:
            return None
        existing = (
            await self.db.execute(
                select(PlayerAchievement).where(
                    PlayerAchievement.player_token == player_token,
                    PlayerAchievement.achievement_id == ach.id,
                )
            )
        ).scalar_one_or_none()
        if existing:
            return PlayerAchievementResponse(
                id=existing.id,
                achievement_id=existing.achievement_id,
                project_id=existing.project_id,
                unlocked_at=existing.unlocked_at,
                achievement=AchievementResponse.model_validate(ach),
            )
        row = PlayerAchievement(
            player_token=player_token,
            achievement_id=ach.id,
            project_id=project_id,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return PlayerAchievementResponse(
            id=row.id,
            achievement_id=row.achievement_id,
            project_id=row.project_id,
            unlocked_at=row.unlocked_at,
            achievement=AchievementResponse.model_validate(ach),
        )

    async def list_player_unlocks(
        self, project_id: UUID, player_token: str
    ) -> List[PlayerAchievementResponse]:
        rows = (
            await self.db.execute(
                select(PlayerAchievement, AchievementDefinition)
                .join(
                    AchievementDefinition,
                    AchievementDefinition.id == PlayerAchievement.achievement_id,
                )
                .where(
                    PlayerAchievement.project_id == project_id,
                    PlayerAchievement.player_token == player_token,
                )
                .order_by(PlayerAchievement.unlocked_at.desc())
            )
        ).all()
        return [
            PlayerAchievementResponse(
                id=pa.id,
                achievement_id=pa.achievement_id,
                project_id=pa.project_id,
                unlocked_at=pa.unlocked_at,
                achievement=AchievementResponse.model_validate(ad),
            )
            for pa, ad in rows
        ]
