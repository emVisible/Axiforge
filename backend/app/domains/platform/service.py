# --- from services/user.py ---
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
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
        by_creator = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.creator_id == data.creator_id,
                )
            )
        ).scalar_one_or_none()

        by_player = (
            await self.db.execute(
                select(UserAccount).where(
                    UserAccount.player_token == data.player_token,
                )
            )
        ).scalar_one_or_none()

        # 本地 creator_id / player_token 曾分属两行时合并，避免 unique 冲突 → 500
        if by_creator and by_player and by_creator.id != by_player.id:
            await self.db.delete(by_player)
            await self.db.flush()
            by_creator.player_token = data.player_token
            await self.db.commit()
            await self.db.refresh(by_creator)
            return self._to_response(by_creator)

        if by_creator:
            if by_creator.player_token != data.player_token:
                conflict = (
                    await self.db.execute(
                        select(UserAccount).where(
                            UserAccount.player_token == data.player_token,
                            UserAccount.id != by_creator.id,
                        )
                    )
                ).scalar_one_or_none()
                if conflict:
                    await self.db.delete(conflict)
                    await self.db.flush()
                by_creator.player_token = data.player_token
                await self.db.commit()
                await self.db.refresh(by_creator)
            return self._to_response(by_creator)

        if by_player:
            conflict = (
                await self.db.execute(
                    select(UserAccount).where(
                        UserAccount.creator_id == data.creator_id,
                        UserAccount.id != by_player.id,
                    )
                )
            ).scalar_one_or_none()
            if conflict:
                await self.db.delete(conflict)
                await self.db.flush()
            by_player.creator_id = data.creator_id
            await self.db.commit()
            await self.db.refresh(by_player)
            return self._to_response(by_player)

        row = UserAccount(
            creator_id=data.creator_id,
            player_token=data.player_token,
        )
        self.db.add(row)
        try:
            await self.db.commit()
            await self.db.refresh(row)
        except IntegrityError:
            await self.db.rollback()
            existing = (
                await self.db.execute(
                    select(UserAccount).where(
                        or_(
                            UserAccount.creator_id == data.creator_id,
                            UserAccount.player_token == data.player_token,
                        )
                    )
                )
            ).scalar_one_or_none()
            if existing:
                return self._to_response(existing)
            raise
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
        # 举报进来就先判一遍：运营打开这条举报时看到的是"机器结论 + 依据 + 举报理由"，
        # 而不是从空白开始。审核失败不影响举报本身（advisory_review 内部吞异常）。
        # 顺序要紧：判断必须发生在 commit 之前，否则案件留在未提交的事务里，
        # 举报成功了但结论从来没落库——这条是测试逼出来的。
        #
        # 送判取的是**全文**而不是审阅面板那份摘录：面板给作品的是 `description`、
        # 给长评论的是 500 字截断，用它判定等于让模型评一份目录页；
        # 更糟的是保存路径已经在判全文，两份文本两个指纹，同一部作品会长期挂着两个案件。
        from app.domains.moderation.content import load_subject_content
        from app.domains.moderation.service import advisory_review

        content = await load_subject_content(
            self.db, subject_type=data.target_type, subject_id=data.target_id
        )
        # 取不到全文 = 内容已删除或这类主体不在判断层覆盖范围内。
        # 此时不建案件：旧做法是拿"（内容不存在或已删除）"这句占位去判定，
        # 结论必然干净，于是队列里多出一条"机器看过说没问题"的假留痕。
        if content is not None:
            title, body, author_id = content
            await advisory_review(
                self.db,
                subject_type=data.target_type,
                subject_id=data.target_id,
                title=title,
                body=body,
                author_id=author_id,
            )
        await self.db.commit()
        await self.db.refresh(row)
        return ReportResponse.model_validate(row)
