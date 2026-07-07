from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import UserAccount
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserSessionRequest


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
