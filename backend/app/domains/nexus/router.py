"""Nexus REST API."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.nexus.schemas import (
    DistributeRequest,
    DistributeResponse,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
)
from app.domains.nexus.service import NexusService

nexus_router = APIRouter(prefix="/api/v1/nexus", tags=["nexus"])


@nexus_router.get("/notes", response_model=List[NoteResponse])
async def list_notes(
    author_id: str = Query(..., min_length=8),
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await NexusService(db).list_notes(author_id, status=status, q=q)


@nexus_router.post("/notes", response_model=NoteResponse, status_code=201)
async def create_note(data: NoteCreate, db: AsyncSession = Depends(get_db)):
    return await NexusService(db).create(data)


@nexus_router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(note_id: UUID, db: AsyncSession = Depends(get_db)):
    row = await NexusService(db).get(note_id)
    if not row:
        raise HTTPException(404, "Note not found")
    return row


@nexus_router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID, data: NoteUpdate, db: AsyncSession = Depends(get_db)
):
    row = await NexusService(db).update(note_id, data)
    if not row:
        raise HTTPException(404, "Note not found")
    return row


@nexus_router.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await NexusService(db).delete(note_id):
        raise HTTPException(404, "Note not found")
    return None


@nexus_router.post("/distribute", response_model=DistributeResponse)
async def distribute_note(data: DistributeRequest, db: AsyncSession = Depends(get_db)):
    return await NexusService(db).distribute(data)
