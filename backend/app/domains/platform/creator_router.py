"""Creator dashboard API."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.platform.creator_schemas import CreatorDashboardResponse
from app.domains.platform.creator_service import CreatorDashboardService

creator_router = APIRouter(prefix="/api/v1/creator", tags=["creator"])


@creator_router.get("/dashboard", response_model=CreatorDashboardResponse)
async def creator_dashboard(
    author_id: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    return await CreatorDashboardService(db).get_dashboard(author_id)
