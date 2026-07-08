# --- from services/user.py ---
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.models import UserAccount
from app.domains.platform.schemas import (
    UserProfileResponse,
    UserProfileUpdate,
    UserSessionRequest,
    UserDataExportResponse,
)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_response(self, row: UserAccount) -> UserProfileResponse:
        return UserProfileResponse(
            id=str(row.id),
            creator_id=row.creator_id,
            player_token=row.player_token,
            email=row.email,
            display_name=row.display_name,
            avatar_emoji=row.avatar_emoji,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def get_or_create_session(
        self, data: UserSessionRequest
    ) -> UserProfileResponse:
        row = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.creator_id == data.creator_id,
                )
            )
        ).scalar_one_or_none()

        if row:
            if row.player_token != data.player_token:
                row.player_token = data.player_token
                await self.db.commit()
                await self.db.refresh(row)
            return self._to_response(row)

        by_player = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.player_token == data.player_token,
                )
            )
        ).scalar_one_or_none()
        if by_player:
            by_player.creator_id = data.creator_id
            await self.db.commit()
            await self.db.refresh(by_player)
            return self._to_response(by_player)

        row = UserAccount(
            creator_id=data.creator_id,
            player_token=data.player_token,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return self._to_response(row)

    async def update_profile(self, data: UserProfileUpdate) -> UserProfileResponse:
        row = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.creator_id == data.creator_id,
                    UserAccount.player_token == data.player_token,
                )
            )
        ).scalar_one_or_none()
        if not row:
            row = UserAccount(
                creator_id=data.creator_id,
                player_token=data.player_token,
            )
            self.db.add(row)

        if data.email is not None:
            row.email = data.email.lower()
        if data.display_name is not None:
            row.display_name = data.display_name.strip() or None
        if data.avatar_emoji is not None:
            row.avatar_emoji = data.avatar_emoji.strip() or None

        await self.db.commit()
        await self.db.refresh(row)
        return self._to_response(row)

    async def resolve_by_email(self, email: str) -> List[UserProfileResponse]:
        result = await self.db.execute(
            select(UserAccount)
            .where(UserAccount.email == email.lower())
            .order_by(UserAccount.updated_at.desc())
        )
        return [self._to_response(r) for r in result.scalars().all()]

    async def get_by_tokens(
        self, creator_id: str, player_token: str
    ) -> Optional[UserProfileResponse]:
        row = (
            await self.db.execute(
                select(UserAccount).where(
                    or_(
                        UserAccount.creator_id == creator_id,
                        UserAccount.player_token == player_token,
                    )
                )
            )
        ).scalar_one_or_none()
        return self._to_response(row) if row else None

    async def get_author_public(self, creator_id: str) -> "AuthorPublicResponse":
        from app.domains.platform.schemas import AuthorPublicResponse

        row = (
            await self.db.execute(
                select(UserAccount).where(UserAccount.creator_id == creator_id)
            )
        ).scalar_one_or_none()
        if not row:
            return AuthorPublicResponse(creator_id=creator_id)
        return AuthorPublicResponse(
            creator_id=row.creator_id,
            display_name=row.display_name,
            avatar_emoji=row.avatar_emoji,
        )

    async def export_data(
        self, creator_id: str, player_token: str
    ) -> Optional[UserDataExportResponse]:
        row = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.creator_id == creator_id,
                    UserAccount.player_token == player_token,
                )
            )
        ).scalar_one_or_none()
        if not row:
            return None

        from app.domains.character.models import Character
        from app.domains.narrative.models import Project
        from app.domains.platform.models import IdentityLink

        projects = (
            await self.db.execute(
                select(Project).where(Project.author_id == creator_id)
            )
        ).scalars().all()
        characters = (
            await self.db.execute(
                select(Character).where(Character.author_id == creator_id)
            )
        ).scalars().all()
        links = (
            await self.db.execute(
                select(IdentityLink).where(
                    or_(
                        IdentityLink.local_id == creator_id,
                        IdentityLink.local_id == player_token,
                    )
                )
            )
        ).scalars().all()

        return UserDataExportResponse(
            profile=self._to_response(row),
            projects=[
                {
                    "id": str(p.id),
                    "title": p.title,
                    "is_public": p.is_public,
                    "created_at": p.created_at.isoformat(),
                }
                for p in projects
            ],
            characters=[
                {
                    "id": str(c.id),
                    "name": c.name,
                    "is_public": c.is_public,
                    "created_at": c.created_at.isoformat(),
                }
                for c in characters
            ],
            identity_links=[
                {
                    "id": str(l.id),
                    "local_id": l.local_id,
                    "email": l.email,
                    "kind": l.kind,
                }
                for l in links
            ],
        )

    async def delete_account(self, creator_id: str, player_token: str) -> bool:
        row = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.creator_id == creator_id,
                    UserAccount.player_token == player_token,
                )
            )
        ).scalar_one_or_none()
        if not row:
            return False

        from app.domains.platform.models import IdentityLink

        links = (
            await self.db.execute(
                select(IdentityLink).where(
                    or_(
                        IdentityLink.local_id == creator_id,
                        IdentityLink.local_id == player_token,
                    )
                )
            )
        ).scalars().all()
        for link in links:
            await self.db.delete(link)
        await self.db.delete(row)
        await self.db.commit()
        return True

# --- from services/identity.py ---
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.models import IdentityLink
from app.domains.platform.schemas import LinkEmailRequest, IdentityLinkResponse


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

# --- from services/report.py ---
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.models import ContentReport
from app.domains.platform.schemas import ReportCreate, ReportResponse


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ReportCreate) -> ReportResponse:
        row = ContentReport(
            target_type=data.target_type,
            target_id=data.target_id,
            reason=data.reason.strip(),
            reporter_token=data.reporter_token,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return ReportResponse.model_validate(row)
