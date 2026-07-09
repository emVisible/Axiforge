"""Creator dashboard API."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.platform.creator_schemas import (
    CreatorDashboardResponse,
    CreatorHubResponse,
    FeaturedProjectsUpdate,
)
from app.domains.platform.creator_service import CreatorDashboardService
from app.domains.platform.creator_hub_service import CreatorHubService

creator_router = APIRouter(prefix="/api/v1/creator", tags=["creator"])


@creator_router.get("/dashboard", response_model=CreatorDashboardResponse)
async def creator_dashboard(
    author_id: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    return await CreatorDashboardService(db).get_dashboard(author_id)


@creator_router.get("/hub", response_model=CreatorHubResponse)
async def creator_hub(
    author_id: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    return await CreatorHubService(db).get_hub(author_id)


@creator_router.put("/featured", status_code=204)
async def set_featured_projects(
    data: FeaturedProjectsUpdate,
    db: AsyncSession = Depends(get_db),
):
    await CreatorHubService(db).set_featured(data.creator_id, data.project_ids)
    return None
