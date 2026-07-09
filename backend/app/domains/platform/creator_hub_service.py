"""Creator Hub public profile aggregation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.narrative.models import Project
from app.domains.platform.creator_schemas import CreatorHubProject, CreatorHubResponse
from app.domains.platform.models import Comment, PlatformEvent, UserAccount


class CreatorHubService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_hub(self, author_id: str) -> CreatorHubResponse:
        user = (
            await self.db.execute(
                select(UserAccount).where(UserAccount.creator_id == author_id)
            )
        ).scalar_one_or_none()
        meta = (user.creator_meta if user else None) or {}
        featured_ids = [str(x) for x in meta.get("featured_project_ids", [])][:3]

        projects = (
            await self.db.execute(
                select(Project)
                .where(Project.author_id == author_id, Project.is_public == True)  # noqa: E712
                .order_by(Project.updated_at.desc())
            )
        ).scalars().all()

        project_ids = [str(p.id) for p in projects]
        comment_counts = await self._comment_counts(project_ids)
        fork_counts = await self._fork_counts(project_ids)

        hub_projects: List[CreatorHubProject] = []
        for p in projects:
            pid = str(p.id)
            hub_projects.append(
                CreatorHubProject(
                    id=pid,
                    title=p.title,
                    description=p.description or "",
                    cover_image=p.cover_image,
                    view_count=p.view_count or 0,
                    play_count=p.play_count or 0,
                    comment_count=comment_counts.get(pid, 0),
                    fork_count=fork_counts.get(pid, 0),
                    is_public=p.is_public,
                )
            )

        featured = [hp for hp in hub_projects if hp.id in featured_ids]
        if not featured and hub_projects:
            featured = hub_projects[: min(3, len(hub_projects))]

        since = datetime.now(timezone.utc) - timedelta(days=7)
        forks_7d = await self._event_count_7d("project_fork", project_ids, since)

        return CreatorHubResponse(
            author_id=author_id,
            display_name=user.display_name if user else None,
            avatar_emoji=user.avatar_emoji if user else None,
            featured_projects=featured,
            projects=hub_projects,
            total_views=sum(p.view_count or 0 for p in projects),
            total_plays=sum(p.play_count or 0 for p in projects),
            total_comments=sum(comment_counts.values()),
            forks_7d=forks_7d,
        )

    async def set_featured(self, creator_id: str, project_ids: List[str]) -> bool:
        user = (
            await self.db.execute(
                select(UserAccount).where(UserAccount.creator_id == creator_id)
            )
        ).scalar_one_or_none()
        if not user:
            user = UserAccount(
                creator_id=creator_id,
                player_token=f"player-{creator_id[-12:]}",
                creator_meta={"featured_project_ids": project_ids[:3]},
            )
            self.db.add(user)
        else:
            meta = dict(user.creator_meta or {})
            meta["featured_project_ids"] = project_ids[:3]
            user.creator_meta = meta
        await self.db.commit()
        return True

    async def _comment_counts(self, project_ids: List[str]) -> dict[str, int]:
        if not project_ids:
            return {}
        rows = (
            await self.db.execute(
                select(Comment.content_id, func.count())
                .where(
                    Comment.content_type == "project",
                    Comment.content_id.in_(project_ids),
                    Comment.status == "visible",
                )
                .group_by(Comment.content_id)
            )
        ).all()
        return {str(cid): int(cnt) for cid, cnt in rows}

    async def _fork_counts(self, project_ids: List[str]) -> dict[str, int]:
        if not project_ids:
            return {}
        rows = (
            await self.db.execute(
                select(Project.fork_from, func.count())
                .where(Project.fork_from.is_not(None))
                .group_by(Project.fork_from)
            )
        ).all()
        out: dict[str, int] = {}
        for fork_from, cnt in rows:
            if fork_from and str(fork_from) in project_ids:
                out[str(fork_from)] = int(cnt)
        return out

    async def _event_count_7d(
        self, event_type: str, subject_ids: List[str], since: datetime
    ) -> int:
        if not subject_ids:
            return 0
        return (
            await self.db.execute(
                select(func.count())
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == event_type,
                    PlatformEvent.subject_id.in_(subject_ids),
                    PlatformEvent.created_at >= since,
                )
            )
        ).scalar_one()
