from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.tag import TagResponse
from app.services.tag import TagService

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])


@router.get("/", response_model=List[TagResponse])
async def list_tags(
    sort_by: str = Query("usage", pattern="^(usage|name)$"),
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    return await service.get_all_tags(sort_by=sort_by)
