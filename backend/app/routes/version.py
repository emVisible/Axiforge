from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.version import VersionResponse, VersionDetailResponse, RollbackRequest
from app.services.version import VersionService
from app.services.character import CharacterService

router = APIRouter(prefix="/api/v1/characters", tags=["versions"])


@router.get("/{character_id}/versions", response_model=List[VersionResponse])
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


@router.get("/{character_id}/versions/{version_id}", response_model=VersionDetailResponse)
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


@router.post("/{character_id}/versions/{version_id}/rollback")
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