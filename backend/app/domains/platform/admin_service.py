"""管理中台业务逻辑（Phase A）。"""

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_ as sa_and
from sqlalchemy import distinct, func, select
from sqlalchemy import or_ as sa_or
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

from app.core.audit import write_audit_log
from app.core.strike_policy import STRIKE_PUBLISH_BLOCK
from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.moderation.models import ModerationCase
from app.domains.platform.admin_moderation import (
    build_moderation_preview,
    resolve_moderation_context,
)
from app.domains.platform.admin_schemas import (
    AdminCharacterResponse,
    AdminCommentSnippet,
    AdminProjectResponse,
    AdminReportResponse,
    AdminUserResponse,
    AdminViolationResponse,
    AuditLogResponse,
    AutoJudgement,
    AuthorModerationProfile,
    DashboardStatsResponse,
    DashboardTopProject,
    ModerationContextResponse,
    ModerationTargetPreview,
    PaginatedResponse,
    ReportResolveRequest,
)
from app.domains.platform.models import AuditLog, ContentReport, PlatformEvent, UserAccount, Violation


def _auto_judgement(case: ModerationCase) -> AutoJudgement:
    """ORM 字段叫 id，契约里叫 case_id（上下文里已经有 target_id，不叫 id 免得歧义）。"""
    prim = (case.answers or {}).get("primary_clause") or {}
    pconf = prim.get("confidence")
    return AutoJudgement(
        case_id=case.id,
        state=case.state,
        engine=case.engine,
        suggested_action=case.suggested_action,
        final_action=case.final_action,
        via=case.via,
        confidence=case.confidence,
        authoritative=case.authoritative,
        calibrated=case.calibrated,
        clause_ids=list(case.clause_ids or []),
        # 单选建议：值在 normalize 阶段已过白名单，这里只做形状防御，不再夹一次。
        primary_suggestion=str(prim.get("value") or ""),
        primary_confidence=float(pconf) if isinstance(pconf, (int, float)) else None,
        reasons=list(case.reasons or []),
        policy_version=case.policy_version,
        questions_version=case.questions_version,
        decided_at=case.decided_at,
    )


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def dashboard_stats(self) -> DashboardStatsResponse:
        pending = (
            await self.db.execute(
                select(func.count())
                .select_from(ContentReport)
                .where(ContentReport.status == "pending")
            )
        ).scalar_one()
        users = (
            await self.db.execute(select(func.count()).select_from(UserAccount))
        ).scalar_one()
        public_projects = (
            await self.db.execute(
                select(func.count())
                .select_from(Project)
                .where(Project.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        public_characters = (
            await self.db.execute(
                select(func.count())
                .select_from(Character)
                .where(Character.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        taken_down = (
            await self.db.execute(
                select(func.count())
                .select_from(Project)
                .where(Project.content_status == "taken_down")
            )
        ).scalar_one()
        banned = (
            await self.db.execute(
                select(func.count())
                .select_from(UserAccount)
                .where(UserAccount.is_banned == True)  # noqa: E712
            )
        ).scalar_one()
        since = datetime.now(timezone.utc) - timedelta(days=7)
        story_plays = (
            await self.db.execute(
                select(func.count())
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == "story_play",
                    PlatformEvent.created_at >= since,
                )
            )
        ).scalar_one()
        forks = (
            await self.db.execute(
                select(func.count())
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == "project_fork",
                    PlatformEvent.created_at >= since,
                )
            )
        ).scalar_one()
        violations_7d = (
            await self.db.execute(
                select(func.count())
                .select_from(Violation)
                .where(Violation.created_at >= since)
            )
        ).scalar_one()
        total_projects = (
            await self.db.execute(select(func.count()).select_from(Project))
        ).scalar_one()
        authors_with_projects = (
            await self.db.execute(
                select(func.count(distinct(Project.author_id))).select_from(Project)
            )
        ).scalar_one()
        played_projects_7d = (
            await self.db.execute(
                select(func.count(distinct(PlatformEvent.subject_id)))
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == "story_play",
                    PlatformEvent.subject_id.is_not(None),
                    PlatformEvent.created_at >= since,
                )
            )
        ).scalar_one()
        upload_bytes, upload_files = self._upload_storage_stats()
        top_rows = (
            await self.db.execute(
                select(Project)
                .where(Project.is_public == True)  # noqa: E712
                .order_by(Project.play_count.desc(), Project.view_count.desc())
                .limit(5)
            )
        ).scalars().all()
        top_projects = [
            DashboardTopProject(
                id=str(p.id),
                title=p.title,
                play_count=p.play_count or 0,
                view_count=p.view_count or 0,
            )
            for p in top_rows
        ]
        return DashboardStatsResponse(
            pending_reports=pending,
            total_users=users,
            public_projects=public_projects,
            public_characters=public_characters,
            taken_down_projects=taken_down,
            banned_users=banned,
            story_plays_7d=story_plays,
            project_forks_7d=forks,
            violations_7d=violations_7d,
            total_projects=total_projects,
            authors_with_projects=authors_with_projects,
            played_projects_7d=played_projects_7d,
            upload_bytes=upload_bytes,
            upload_files=upload_files,
            top_projects=top_projects,
        )

    @staticmethod
    def _upload_storage_stats() -> tuple[int, int]:
        root = Path(settings.upload_dir).parent
        if not root.is_dir():
            return 0, 0
        total_bytes = 0
        file_count = 0
        for path in root.rglob("*"):
            if path.is_file():
                file_count += 1
                try:
                    total_bytes += path.stat().st_size
                except OSError:
                    continue
        return total_bytes, file_count

    async def _report_response(self, report: ContentReport) -> AdminReportResponse:
        preview = await build_moderation_preview(
            self.db,
            target_type=report.target_type,
            target_id=report.target_id,
        )
        return AdminReportResponse(
            id=report.id,
            target_type=report.target_type,
            target_id=report.target_id,
            reason=report.reason,
            status=report.status,
            reporter_token=report.reporter_token,
            resolution_note=report.resolution_note,
            resolved_at=report.resolved_at,
            created_at=report.created_at,
            target_preview=ModerationTargetPreview.model_validate(preview),
        )

    async def list_reports(
        self, *, status: str = "pending", limit: int = 50, offset: int = 0
    ) -> dict:
        """举报队列分页。`total` 是**这个状态下的全量**，不是本页条数——
        没有它，运营看到"50 条"就不知道后面还有没有，而 50 正是过去的硬上限。

        排序末级必须带 `id`：同一事务里插入的多行 `created_at` 完全相同
        （PG 的 now() 取事务开始时间），只排到时间会在翻页时重复或漏项。
        """
        base = select(ContentReport).where(ContentReport.status == status)
        total = (
            await self.db.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()
        result = await self.db.execute(
            base.order_by(ContentReport.created_at.desc(), ContentReport.id.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = list(result.scalars().all())
        out: List[AdminReportResponse] = []
        for r in rows:
            out.append(await self._report_response(r))
        return {"items": out, "total": int(total)}

    async def get_moderation_context(
        self, *, target_type: str, target_id: str
    ) -> ModerationContextResponse:
        preview = await build_moderation_preview(
            self.db, target_type=target_type, target_id=target_id
        )
        raw = await resolve_moderation_context(
            self.db, target_type=target_type, target_id=target_id
        )
        profile = raw.get("author_profile")
        # 人工打开举报上下文时先看到机器结论，而不是从空白开始判
        judgement = (
            await self.db.execute(
                select(ModerationCase)
                .where(
                    ModerationCase.subject_type == target_type,
                    ModerationCase.subject_id == target_id,
                )
                .order_by(ModerationCase.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        return ModerationContextResponse(
            target_preview=ModerationTargetPreview.model_validate(preview),
            related_comments=[
                AdminCommentSnippet.model_validate(c) for c in raw.get("related_comments", [])
            ],
            author_profile=(
                AuthorModerationProfile.model_validate(profile) if profile else None
            ),
            auto_judgement=(_auto_judgement(judgement) if judgement else None),
        )

    async def hide_comment(self, comment_id: UUID, *, note: Optional[str] = None) -> bool:
        from app.domains.platform.comment_service import CommentService

        ok = await CommentService(self.db).hide(comment_id)
        if not ok:
            return False
        self.db.add(
            Violation(
                subject_type="comment",
                subject_id=str(comment_id),
                clause="content_takedown",
                note=note or "admin hide comment",
            )
        )
        await write_audit_log(
            self.db,
            action="comment.hide",
            target_type="comment",
            target_id=str(comment_id),
            detail={"note": note},
        )
        await self.db.commit()
        return True

    async def resolve_report(
        self, report_id: UUID, data: ReportResolveRequest
    ) -> Optional[AdminReportResponse]:
        report = await self.db.get(ContentReport, report_id)
        if not report:
            return None

        siblings: List[ContentReport] = []
        if data.resolve_siblings:
            siblings = list(
                (
                    await self.db.execute(
                        select(ContentReport).where(
                            ContentReport.status == "pending",
                            ContentReport.target_type == report.target_type,
                            ContentReport.target_id == report.target_id,
                            ContentReport.id != report_id,
                        )
                    )
                ).scalars().all()
            )

        if data.action == "take_down":
            await self._take_down_target(report.target_type, report.target_id, data.note)

        resolved_status = "dismissed" if data.action == "dismiss" else "resolved"
        now = datetime.now(timezone.utc)
        for r in [report, *siblings]:
            r.status = resolved_status
            r.resolution_note = data.note
            r.resolved_at = now

        await write_audit_log(
            self.db,
            action=f"report.{data.action}",
            target_type="report",
            target_id=str(report_id),
            detail={
                "target_type": report.target_type,
                "target_id": report.target_id,
                "siblings_resolved": len(siblings),
            },
        )
        await self.db.commit()
        await self.db.refresh(report)
        return await self._report_response(report)

    async def _take_down_target(
        self, target_type: str, target_id: str, note: Optional[str]
    ) -> None:
        if target_type == "project":
            project = await self.db.get(Project, UUID(target_id))
            if project:
                project.content_status = "taken_down"
                project.is_public = False
                await self._strike_author(project.author_id, note)
        elif target_type == "character":
            character = await self.db.get(Character, UUID(target_id))
            if character:
                character.content_status = "taken_down"
                character.is_public = False
                await self._strike_author(character.author_id, note)
        elif target_type == "comment":
            from app.domains.platform.comment_service import CommentService

            await CommentService(self.db).hide(UUID(target_id))

        self.db.add(
            Violation(
                subject_type=target_type,
                subject_id=target_id,
                clause="content_takedown",
                note=note,
            )
        )
        await write_audit_log(
            self.db,
            action="content.take_down",
            target_type=target_type,
            target_id=target_id,
            detail={"note": note},
        )

    async def _strike_author(self, author_id: str, note: Optional[str]) -> None:
        if not author_id or author_id == "anonymous":
            return
        user = (
            await self.db.execute(
                select(UserAccount).where(UserAccount.creator_id == author_id)
            )
        ).scalar_one_or_none()
        if not user:
            return
        user.strike_count = (user.strike_count or 0) + 1
        await write_audit_log(
            self.db,
            action="user.strike",
            target_type="user",
            target_id=str(user.id),
            detail={
                "creator_id": author_id,
                "strike_count": user.strike_count,
                "threshold": STRIKE_PUBLISH_BLOCK,
                "note": note,
            },
        )

    async def list_users(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        creator_id: Optional[str] = None,
        q: Optional[str] = None,
    ) -> PaginatedResponse[AdminUserResponse]:
        base = select(UserAccount)
        count_q = select(func.count()).select_from(UserAccount)
        if creator_id:
            base = base.where(UserAccount.creator_id == creator_id)
            count_q = count_q.where(UserAccount.creator_id == creator_id)
        if q:
            like = f"%{q.strip()}%"
            text_filter = sa_or(
                UserAccount.creator_id.ilike(like),
                UserAccount.email.ilike(like),
                UserAccount.display_name.ilike(like),
            )
            base = base.where(text_filter)
            count_q = count_q.where(text_filter)
        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            base.order_by(UserAccount.created_at.desc()).offset(offset).limit(limit)
        )
        items = [
            AdminUserResponse(
                id=str(u.id),
                creator_id=u.creator_id,
                email=u.email,
                display_name=u.display_name,
                role=u.role,
                is_banned=u.is_banned,
                strike_count=u.strike_count,
                created_at=u.created_at,
            )
            for u in result.scalars().all()
        ]
        return PaginatedResponse(items=items, total=total)

    async def set_user_ban(
        self, user_id: UUID, *, is_banned: bool, note: Optional[str] = None
    ) -> Optional[AdminUserResponse]:
        user = await self.db.get(UserAccount, user_id)
        if not user:
            return None
        user.is_banned = is_banned
        if is_banned:
            user.strike_count = (user.strike_count or 0) + 1
        await write_audit_log(
            self.db,
            action="user.ban" if is_banned else "user.unban",
            target_type="user",
            target_id=str(user_id),
            detail={"note": note},
        )
        await self.db.commit()
        await self.db.refresh(user)
        return AdminUserResponse(
            id=str(user.id),
            creator_id=user.creator_id,
            email=user.email,
            display_name=user.display_name,
            role=user.role,
            is_banned=user.is_banned,
            strike_count=user.strike_count,
            created_at=user.created_at,
        )

    async def set_user_strikes(
        self, user_id: UUID, *, strike_count: int, note: Optional[str] = None
    ) -> Optional[AdminUserResponse]:
        user = await self.db.get(UserAccount, user_id)
        if not user:
            return None
        prev = user.strike_count or 0
        user.strike_count = strike_count
        await write_audit_log(
            self.db,
            action="user.strike_reset",
            target_type="user",
            target_id=str(user_id),
            detail={"from": prev, "to": strike_count, "note": note},
        )
        await self.db.commit()
        await self.db.refresh(user)
        return AdminUserResponse(
            id=str(user.id),
            creator_id=user.creator_id,
            email=user.email,
            display_name=user.display_name,
            role=user.role,
            is_banned=user.is_banned,
            strike_count=user.strike_count,
            created_at=user.created_at,
        )

    async def list_projects(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        q: Optional[str] = None,
        content_status: Optional[str] = None,
    ) -> PaginatedResponse[AdminProjectResponse]:
        base = select(Project)
        count_q = select(func.count()).select_from(Project)
        if q:
            like = f"%{q.strip()}%"
            base = base.where(Project.title.ilike(like))
            count_q = count_q.where(Project.title.ilike(like))
        if content_status:
            base = base.where(Project.content_status == content_status)
            count_q = count_q.where(Project.content_status == content_status)
        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            base.order_by(Project.updated_at.desc()).offset(offset).limit(limit)
        )
        items = [
            AdminProjectResponse(
                id=str(p.id),
                title=p.title,
                author_id=p.author_id,
                is_public=p.is_public,
                content_status=getattr(p, "content_status", "published"),
                view_count=p.view_count,
                play_count=p.play_count or 0,
                created_at=p.created_at,
            )
            for p in result.scalars().all()
        ]
        return PaginatedResponse(items=items, total=total)

    async def update_project_status(
        self, project_id: UUID, content_status: str
    ) -> Optional[AdminProjectResponse]:
        project = await self.db.get(Project, project_id)
        if not project:
            return None
        project.content_status = content_status
        if content_status == "taken_down":
            project.is_public = False
            await self._strike_author(project.author_id, "admin project takedown")
            self.db.add(
                Violation(
                    subject_type="project",
                    subject_id=str(project_id),
                    clause="content_takedown",
                    note="admin content page",
                )
            )
        elif content_status == "published":
            project.is_public = True
        await write_audit_log(
            self.db,
            action="project.status",
            target_type="project",
            target_id=str(project_id),
            detail={"content_status": content_status},
        )
        await self.db.commit()
        await self.db.refresh(project)
        return AdminProjectResponse(
            id=str(project.id),
            title=project.title,
            author_id=project.author_id,
            is_public=project.is_public,
            content_status=project.content_status,
            view_count=project.view_count,
            play_count=project.play_count or 0,
            created_at=project.created_at,
        )

    async def list_characters(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        q: Optional[str] = None,
        content_status: Optional[str] = None,
    ) -> PaginatedResponse[AdminCharacterResponse]:
        base = select(Character)
        count_q = select(func.count()).select_from(Character)
        if q:
            like = f"%{q.strip()}%"
            base = base.where(Character.name.ilike(like))
            count_q = count_q.where(Character.name.ilike(like))
        if content_status:
            base = base.where(Character.content_status == content_status)
            count_q = count_q.where(Character.content_status == content_status)
        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            base.order_by(Character.updated_at.desc()).offset(offset).limit(limit)
        )
        items = [
            AdminCharacterResponse(
                id=str(c.id),
                name=c.name,
                author_id=c.author_id,
                is_public=c.is_public,
                content_status=getattr(c, "content_status", "published"),
                view_count=c.view_count,
                created_at=c.created_at,
            )
            for c in result.scalars().all()
        ]
        return PaginatedResponse(items=items, total=total)

    async def update_character_status(
        self, character_id: UUID, content_status: str
    ) -> Optional[AdminCharacterResponse]:
        character = await self.db.get(Character, character_id)
        if not character:
            return None
        character.content_status = content_status
        if content_status == "taken_down":
            character.is_public = False
            await self._strike_author(character.author_id, "admin character takedown")
            self.db.add(
                Violation(
                    subject_type="character",
                    subject_id=str(character_id),
                    clause="content_takedown",
                    note="admin content page",
                )
            )
        elif content_status == "published":
            character.is_public = True
        await write_audit_log(
            self.db,
            action="character.status",
            target_type="character",
            target_id=str(character_id),
            detail={"content_status": content_status},
        )
        await self.db.commit()
        await self.db.refresh(character)
        return AdminCharacterResponse(
            id=str(character.id),
            name=character.name,
            author_id=character.author_id,
            is_public=character.is_public,
            content_status=character.content_status,
            view_count=character.view_count,
            created_at=character.created_at,
        )

    async def list_violations(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
        creator_id: Optional[str] = None,
    ) -> PaginatedResponse[AdminViolationResponse]:
        query = select(Violation)
        count_query = select(func.count()).select_from(Violation)

        if creator_id:
            project_ids = (
                (
                    await self.db.execute(
                        select(Project.id).where(Project.author_id == creator_id)
                    )
                )
                .scalars()
                .all()
            )
            character_ids = (
                (
                    await self.db.execute(
                        select(Character.id).where(Character.author_id == creator_id)
                    )
                )
                .scalars()
                .all()
            )
            project_id_strs = [str(pid) for pid in project_ids]
            character_id_strs = [str(cid) for cid in character_ids]
            filter_clause = sa_or(
                sa_and(
                    Violation.subject_type == "project",
                    Violation.subject_id.in_(project_id_strs or ["__none__"]),
                ),
                sa_and(
                    Violation.subject_type == "character",
                    Violation.subject_id.in_(character_id_strs or ["__none__"]),
                ),
            )
            query = query.where(filter_clause)
            count_query = count_query.where(filter_clause)

        total = (await self.db.execute(count_query)).scalar_one()
        result = await self.db.execute(
            query.order_by(Violation.created_at.desc()).offset(offset).limit(limit)
        )
        rows = list(result.scalars().all())
        author_cache: dict[str, Optional[str]] = {}
        items: List[AdminViolationResponse] = []
        for v in rows:
            author_id = await self._violation_author_id(v, author_cache)
            items.append(
                AdminViolationResponse(
                    id=v.id,
                    subject_type=v.subject_type,
                    subject_id=v.subject_id,
                    clause=v.clause,
                    note=v.note,
                    actor=v.actor,
                    author_id=author_id,
                    created_at=v.created_at,
                )
            )
        return PaginatedResponse(items=items, total=total)

    async def _violation_author_id(
        self, violation: Violation, cache: dict[str, Optional[str]]
    ) -> Optional[str]:
        key = f"{violation.subject_type}:{violation.subject_id}"
        if key in cache:
            return cache[key]
        author_id: Optional[str] = None
        try:
            if violation.subject_type == "project":
                project = await self.db.get(Project, UUID(violation.subject_id))
                author_id = project.author_id if project else None
            elif violation.subject_type == "character":
                character = await self.db.get(Character, UUID(violation.subject_id))
                author_id = character.author_id if character else None
        except (ValueError, TypeError):
            author_id = None
        cache[key] = author_id
        return author_id

    async def list_audit_logs(
        self, *, limit: int = 100, offset: int = 0, action: Optional[str] = None
    ) -> PaginatedResponse[AuditLogResponse]:
        filters = []
        if action:
            filters.append(AuditLog.action == action)
        count_stmt = select(func.count()).select_from(AuditLog)
        list_stmt = select(AuditLog)
        if filters:
            count_stmt = count_stmt.where(*filters)
            list_stmt = list_stmt.where(*filters)
        total = (await self.db.execute(count_stmt)).scalar_one()
        result = await self.db.execute(
            list_stmt.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        )
        items = [AuditLogResponse.model_validate(r) for r in result.scalars().all()]
        return PaginatedResponse(items=items, total=total)
