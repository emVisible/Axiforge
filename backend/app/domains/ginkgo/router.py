"""Achievement REST API."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.ginkgo.schemas import (
    AchievementCreate,
    AchievementListResponse,
    AchievementResponse,
    AchievementUpdate,
    PlayerAchievementResponse,
    UnlockAchievementRequest,
)
from app.domains.ginkgo.service import AchievementService

ginkgo_router = APIRouter(prefix="/api/v1/ginkgo", tags=["ginkgo"])


@ginkgo_router.get(
    "/projects/{project_id}/achievements",
    response_model=AchievementListResponse,
)
async def list_achievements(project_id: UUID, db: AsyncSession = Depends(get_db)):
    items = await AchievementService(db).list_for_project(project_id)
    return AchievementListResponse(items=items)


@ginkgo_router.post(
    "/projects/{project_id}/achievements",
    response_model=AchievementResponse,
    status_code=201,
)
async def create_achievement(
    project_id: UUID,
    data: AchievementCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await AchievementService(db).create(project_id, data)
    except Exception as exc:
        raise HTTPException(400, str(exc)) from exc


@ginkgo_router.put("/achievements/{achievement_id}", response_model=AchievementResponse)
async def update_achievement(
    achievement_id: UUID,
    data: AchievementUpdate,
    db: AsyncSession = Depends(get_db),
):
    row = await AchievementService(db).update(achievement_id, data)
    if not row:
        raise HTTPException(404, "Achievement not found")
    return row


@ginkgo_router.delete("/achievements/{achievement_id}", status_code=204)
async def delete_achievement(achievement_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await AchievementService(db).delete(achievement_id):
        raise HTTPException(404, "Achievement not found")
    return None


@ginkgo_router.post(
    "/projects/{project_id}/unlock",
    response_model=PlayerAchievementResponse,
)
async def unlock_achievement(
    project_id: UUID,
    data: UnlockAchievementRequest,
    db: AsyncSession = Depends(get_db),
):
    row = await AchievementService(db).unlock(
        project_id, data.player_token, data.achievement_key
    )
    if not row:
        raise HTTPException(404, "Achievement not found")
    return row


@ginkgo_router.get(
    "/projects/{project_id}/player",
    response_model=list[PlayerAchievementResponse],
)
async def list_player_achievements(
    project_id: UUID,
    player_token: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    return await AchievementService(db).list_player_unlocks(project_id, player_token)
