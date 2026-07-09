"""Nexus note business logic."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.nexus.models import NexusNote
from app.domains.nexus.schemas import (
    DistributeRequest,
    DistributeResponse,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
)


class NexusService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_notes(
        self,
        author_id: str,
        *,
        status: Optional[str] = None,
        q: Optional[str] = None,
    ) -> List[NoteResponse]:
        stmt = select(NexusNote).where(NexusNote.author_id == author_id)
        if status:
            stmt = stmt.where(NexusNote.status == status)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(
                or_(NexusNote.title.ilike(like), NexusNote.body.ilike(like))
            )
        stmt = stmt.order_by(NexusNote.updated_at.desc())
        rows = (await self.db.execute(stmt)).scalars().all()
        return [NoteResponse.model_validate(r) for r in rows]

    async def get(self, note_id: UUID) -> Optional[NoteResponse]:
        row = (
            await self.db.execute(select(NexusNote).where(NexusNote.id == note_id))
        ).scalar_one_or_none()
        return NoteResponse.model_validate(row) if row else None

    async def create(self, data: NoteCreate) -> NoteResponse:
        row = NexusNote(
            author_id=data.author_id,
            title=data.title,
            body=data.body,
            tags=data.tags,
            links=data.links,
            status=data.status,
            related_characters=data.related_characters,
            related_projects=data.related_projects,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return NoteResponse.model_validate(row)

    async def update(self, note_id: UUID, data: NoteUpdate) -> Optional[NoteResponse]:
        row = (
            await self.db.execute(select(NexusNote).where(NexusNote.id == note_id))
        ).scalar_one_or_none()
        if not row:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        await self.db.commit()
        await self.db.refresh(row)
        return NoteResponse.model_validate(row)

    async def delete(self, note_id: UUID) -> bool:
        row = (
            await self.db.execute(select(NexusNote).where(NexusNote.id == note_id))
        ).scalar_one_or_none()
        if not row:
            return False
        await self.db.delete(row)
        await self.db.commit()
        return True

    async def distribute(self, data: DistributeRequest) -> DistributeResponse:
        note = (
            await self.db.execute(select(NexusNote).where(NexusNote.id == data.note_id))
        ).scalar_one_or_none()
        if not note or note.author_id != data.author_id:
            return DistributeResponse(ok=False, message="笔记不存在或无权限")

        snippet = note.body.strip()
        if not snippet:
            return DistributeResponse(ok=False, message="笔记内容为空")

        if data.target_type == "character":
            char = (
                await self.db.execute(
                    select(Character).where(Character.id == UUID(data.target_id))
                )
            ).scalar_one_or_none()
            if not char:
                return DistributeResponse(ok=False, message="角色不存在")
            data_blob = dict(char.character_data or {})
            anchor = dict(data_blob.get("anchor") or {})
            anchor["summary"] = (anchor.get("summary") or "") + "\n\n" + snippet
            data_blob["anchor"] = anchor
            char.character_data = data_blob
            await self.db.commit()
            note.status = "archived"
            await self.db.commit()
            return DistributeResponse(ok=True, message="已追加到角色传记")

        project = (
            await self.db.execute(
                select(Project).where(Project.id == UUID(data.target_id))
            )
        ).scalar_one_or_none()
        if not project:
            return DistributeResponse(ok=False, message="作品不存在")
        if data.field == "description":
            project.description = (project.description or "") + "\n\n" + snippet
        else:
            meta = dict(project.play_meta or {})
            entries = list(meta.get("nexus_notes") or [])
            entries.append(
                {
                    "text": snippet,
                    "source": "nexus",
                    "note_id": str(note.id),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            meta["nexus_notes"] = entries
            project.play_meta = meta
        await self.db.commit()
        note.status = "archived"
        await self.db.commit()
        msg = "已追加到作品描述" if data.field == "description" else "已追加到作品策划备忘"
        return DistributeResponse(ok=True, message=msg)
