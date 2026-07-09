"""Creator-facing dashboard aggregation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.assets.models import AssetItem, AssetScene
from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.platform.creator_schemas import (
    ContentCounts,
    CreatorDashboardResponse,
    PublicPrivateRatio,
    TrendPoint,
)
from app.domains.platform.models import ContentReport, PlatformEvent, Comment


class CreatorDashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard(self, author_id: str) -> CreatorDashboardResponse:
        since = datetime.now(timezone.utc) - timedelta(days=7)
        project_ids = await self._author_project_ids(author_id)
        character_ids = await self._author_character_ids(author_id)
        item_ids = await self._author_item_ids(author_id)
        scene_ids = await self._author_scene_ids(author_id)

        counts = ContentCounts(
            projects=len(project_ids),
            characters=len(character_ids),
            items=len(item_ids),
            scenes=len(scene_ids),
        )

        public_ratio = await self._public_ratio(author_id)
        views_7d = await self._sum_views_7d(author_id, since)
        plays_7d = await self._event_count_7d(
            "story_play", project_ids, since
        )
        forks_7d = await self._event_count_7d(
            "project_fork", project_ids, since
        )
        comments_7d = await self._comment_count_7d(project_ids, since)
        total_comments = await self._total_comments(project_ids)
        pending_reports = await self._pending_reports(
            project_ids, character_ids, item_ids, scene_ids
        )
        trend = await self._build_trend(project_ids, since)

        return CreatorDashboardResponse(
            author_id=author_id,
            counts=counts,
            public_ratio=public_ratio,
            views_7d=views_7d,
            plays_7d=plays_7d,
            forks_7d=forks_7d,
            comments_7d=comments_7d,
            total_comments=total_comments,
            pending_reports=pending_reports,
            trend=trend,
        )

    async def _author_project_ids(self, author_id: str) -> List[str]:
        rows = (
            await self.db.execute(
                select(Project.id).where(Project.author_id == author_id)
            )
        ).scalars().all()
        return [str(r) for r in rows]

    async def _author_character_ids(self, author_id: str) -> List[str]:
        rows = (
            await self.db.execute(
                select(Character.id).where(Character.author_id == author_id)
            )
        ).scalars().all()
        return [str(r) for r in rows]

    async def _author_item_ids(self, author_id: str) -> List[str]:
        rows = (
            await self.db.execute(
                select(AssetItem.id).where(AssetItem.author_id == author_id)
            )
        ).scalars().all()
        return [str(r) for r in rows]

    async def _author_scene_ids(self, author_id: str) -> List[str]:
        rows = (
            await self.db.execute(
                select(AssetScene.id).where(AssetScene.author_id == author_id)
            )
        ).scalars().all()
        return [str(r) for r in rows]

    async def _public_ratio(self, author_id: str) -> PublicPrivateRatio:
        pub_projects = (
            await self.db.execute(
                select(func.count())
                .select_from(Project)
                .where(Project.author_id == author_id, Project.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        total_projects = (
            await self.db.execute(
                select(func.count())
                .select_from(Project)
                .where(Project.author_id == author_id)
            )
        ).scalar_one()
        pub_chars = (
            await self.db.execute(
                select(func.count())
                .select_from(Character)
                .where(Character.author_id == author_id, Character.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        total_chars = (
            await self.db.execute(
                select(func.count())
                .select_from(Character)
                .where(Character.author_id == author_id)
            )
        ).scalar_one()
        pub_items = (
            await self.db.execute(
                select(func.count())
                .select_from(AssetItem)
                .where(AssetItem.author_id == author_id, AssetItem.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        total_items = (
            await self.db.execute(
                select(func.count())
                .select_from(AssetItem)
                .where(AssetItem.author_id == author_id)
            )
        ).scalar_one()
        pub_scenes = (
            await self.db.execute(
                select(func.count())
                .select_from(AssetScene)
                .where(AssetScene.author_id == author_id, AssetScene.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        total_scenes = (
            await self.db.execute(
                select(func.count())
                .select_from(AssetScene)
                .where(AssetScene.author_id == author_id)
            )
        ).scalar_one()
        public = pub_projects + pub_chars + pub_items + pub_scenes
        private = (
            (total_projects - pub_projects)
            + (total_chars - pub_chars)
            + (total_items - pub_items)
            + (total_scenes - pub_scenes)
        )
        return PublicPrivateRatio(public=public, private=private)

    async def _sum_views_7d(self, author_id: str, since: datetime) -> int:
        view_events = (
            await self.db.execute(
                select(func.count())
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == "content_view",
                    PlatformEvent.created_at >= since,
                    PlatformEvent.meta["author_id"].astext == author_id,
                )
            )
        ).scalar_one()
        if view_events:
            return view_events
        # fallback: aggregate view_count from projects (not time-bounded)
        return (
            await self.db.execute(
                select(func.coalesce(func.sum(Project.view_count), 0))
                .select_from(Project)
                .where(Project.author_id == author_id)
            )
        ).scalar_one()

    async def _event_count_7d(
        self,
        event_type: str,
        subject_ids: List[str],
        since: datetime,
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

    async def _comment_count_7d(
        self, project_ids: List[str], since: datetime
    ) -> int:
        if not project_ids:
            return 0
        return (
            await self.db.execute(
                select(func.count())
                .select_from(Comment)
                .where(
                    Comment.content_type == "project",
                    Comment.content_id.in_(project_ids),
                    Comment.created_at >= since,
                    Comment.status == "visible",
                )
            )
        ).scalar_one()

    async def _total_comments(self, project_ids: List[str]) -> int:
        if not project_ids:
            return 0
        return (
            await self.db.execute(
                select(func.count())
                .select_from(Comment)
                .where(
                    Comment.content_type == "project",
                    Comment.content_id.in_(project_ids),
                    Comment.status == "visible",
                )
            )
        ).scalar_one()

    async def _pending_reports(
        self,
        project_ids: List[str],
        character_ids: List[str],
        item_ids: List[str],
        scene_ids: List[str],
    ) -> int:
        clauses = []
        if project_ids:
            clauses.append(
                and_(
                    ContentReport.target_type == "project",
                    ContentReport.target_id.in_(project_ids),
                )
            )
        if character_ids:
            clauses.append(
                and_(
                    ContentReport.target_type == "character",
                    ContentReport.target_id.in_(character_ids),
                )
            )
        if item_ids:
            clauses.append(
                and_(
                    ContentReport.target_type == "item",
                    ContentReport.target_id.in_(item_ids),
                )
            )
        if scene_ids:
            clauses.append(
                and_(
                    ContentReport.target_type == "scene",
                    ContentReport.target_id.in_(scene_ids),
                )
            )
        if not clauses:
            return 0
        return (
            await self.db.execute(
                select(func.count())
                .select_from(ContentReport)
                .where(
                    ContentReport.status == "pending",
                    or_(*clauses),
                )
            )
        ).scalar_one()

    async def _build_trend(
        self, project_ids: List[str], since: datetime
    ) -> List[TrendPoint]:
        points: List[TrendPoint] = []
        now = datetime.now(timezone.utc)
        for offset in range(6, -1, -1):
            day_start = (now - timedelta(days=offset)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_end = day_start + timedelta(days=1)
            date_label = day_start.strftime("%m-%d")
            plays = 0
            forks = 0
            views = 0
            if project_ids:
                plays = (
                    await self.db.execute(
                        select(func.count())
                        .select_from(PlatformEvent)
                        .where(
                            PlatformEvent.event_type == "story_play",
                            PlatformEvent.subject_id.in_(project_ids),
                            PlatformEvent.created_at >= day_start,
                            PlatformEvent.created_at < day_end,
                        )
                    )
                ).scalar_one()
                forks = (
                    await self.db.execute(
                        select(func.count())
                        .select_from(PlatformEvent)
                        .where(
                            PlatformEvent.event_type == "project_fork",
                            PlatformEvent.subject_id.in_(project_ids),
                            PlatformEvent.created_at >= day_start,
                            PlatformEvent.created_at < day_end,
                        )
                    )
                ).scalar_one()
                views = (
                    await self.db.execute(
                        select(func.count())
                        .select_from(PlatformEvent)
                        .where(
                            PlatformEvent.event_type == "content_view",
                            PlatformEvent.subject_type == "project",
                            PlatformEvent.subject_id.in_(project_ids),
                            PlatformEvent.created_at >= day_start,
                            PlatformEvent.created_at < day_end,
                        )
                    )
                ).scalar_one()
            points.append(
                TrendPoint(date=date_label, views=views, plays=plays, forks=forks)
            )
        return points
