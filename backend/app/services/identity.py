from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity import IdentityLink
from app.schemas.identity import LinkEmailRequest, IdentityLinkResponse


class IdentityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def link_email(self, data: LinkEmailRequest) -> IdentityLinkResponse:
        existing = (
            await self.db.execute(
                select(IdentityLink).where(IdentityLink.local_id == data.local_id)
            )
        ).scalar_one_or_none()
        if existing:
            existing.email = data.email.lower()
            existing.kind = data.kind
        else:
            existing = IdentityLink(
                local_id=data.local_id,
                email=data.email.lower(),
                kind=data.kind,
            )
            self.db.add(existing)
        await self.db.commit()
        await self.db.refresh(existing)
        return IdentityLinkResponse.model_validate(existing)

    async def resolve_by_email(self, email: str) -> List[IdentityLinkResponse]:
        result = await self.db.execute(
            select(IdentityLink)
            .where(IdentityLink.email == email.lower())
            .order_by(IdentityLink.created_at.desc())
        )
        return [IdentityLinkResponse.model_validate(r) for r in result.scalars().all()]

    async def get_by_local_id(self, local_id: str) -> Optional[IdentityLinkResponse]:
        row = (
            await self.db.execute(
                select(IdentityLink).where(IdentityLink.local_id == local_id)
            )
        ).scalar_one_or_none()
        return IdentityLinkResponse.model_validate(row) if row else None
