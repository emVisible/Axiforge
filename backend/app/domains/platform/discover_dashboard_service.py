"""Discover Grove dashboard aggregation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.assets.models import AssetItem, AssetScene
from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.platform.models import Comment, PlatformEvent


class TopicCount:
    def __init__(self, slug: str, label: str, project_count: int):
        self.slug = slug
        self.label = label
        self.project_count = project_count


class DiscoverDashboardProject:
    def __init__(
        self,
        *,
        id: str,
        title: str,
        description: str,
        cover_image: str | None,
        play_count: int,
        view_count: int,
        author_id: str,
    ):
        self.id = id
        self.title = title
        self.description = description
        self.cover_image = cover_image
        self.play_count = play_count
        self.view_count = view_count
        self.author_id = author_id


class DiscoverDashboardResponse:
    def __init__(
        self,
        *,
        counts: dict[str, int],
        activity_7d: dict[str, int],
        hot_topics: List[TopicCount],
        trending_projects: List[DiscoverDashboardProject],
    ):
        self.counts = counts
        self.activity_7d = activity_7d
        self.hot_topics = hot_topics
        self.trending_projects = trending_projects


class DiscoverDashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard(self) -> DiscoverDashboardResponse:
        since = datetime.now(timezone.utc) - timedelta(days=7)

        projects = (
            await self.db.execute(
                select(func.count()).select_from(Project).where(Project.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        characters = (
            await self.db.execute(
                select(func.count())
                .select_from(Character)
                .where(Character.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        items = (
            await self.db.execute(
                select(func.count())
                .select_from(AssetItem)
                .where(AssetItem.is_public == True)  # noqa: E712
            )
        ).scalar_one()
        scenes = (
            await self.db.execute(
                select(func.count())
                .select_from(AssetScene)
                .where(AssetScene.is_public == True)  # noqa: E712
            )
        ).scalar_one()

        plays_7d = (
            await self.db.execute(
                select(func.count())
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == "play_start",
                    PlatformEvent.created_at >= since,
                )
            )
        ).scalar_one()
        forks_7d = (
            await self.db.execute(
                select(func.count())
                .select_from(PlatformEvent)
                .where(
                    PlatformEvent.event_type == "project_fork",
                    PlatformEvent.created_at >= since,
                )
            )
        ).scalar_one()
        comments_7d = (
            await self.db.execute(
                select(func.count())
                .select_from(Comment)
                .where(Comment.created_at >= since, Comment.status == "visible")
            )
        ).scalar_one()

        hot_topics = await self._hot_topics()
        trending = (
            await self.db.execute(
                select(Project)
                .where(Project.is_public == True)  # noqa: E712
                .order_by(Project.play_count.desc(), Project.view_count.desc())
                .limit(6)
            )
        ).scalars().all()

        return DiscoverDashboardResponse(
            counts={
                "projects": int(projects),
                "characters": int(characters),
                "items": int(items),
                "scenes": int(scenes),
            },
            activity_7d={
                "plays": int(plays_7d),
                "forks": int(forks_7d),
                "comments": int(comments_7d),
            },
            hot_topics=hot_topics,
            trending_projects=[
                DiscoverDashboardProject(
                    id=str(p.id),
                    title=p.title,
                    description=p.description or "",
                    cover_image=p.cover_image,
                    play_count=p.play_count or 0,
                    view_count=p.view_count or 0,
                    author_id=p.author_id,
                )
                for p in trending
            ],
        )

    async def _hot_topics(self) -> List[TopicCount]:
        projects = (
            await self.db.execute(
                select(Project).where(Project.is_public == True)  # noqa: E712
            )
        ).scalars().all()
        counts: dict[str, int] = {}
        for p in projects:
            if p.mechanism:
                counts[p.mechanism] = counts.get(p.mechanism, 0) + 1
            for tag in p.theme_tags or []:
                if isinstance(tag, str) and tag.strip():
                    counts[tag.strip()] = counts.get(tag.strip(), 0) + 1
            if p.topic_slug:
                counts[p.topic_slug] = counts.get(p.topic_slug, 0) + 1
        return [
            TopicCount(slug=slug, label=slug, project_count=cnt)
            for slug, cnt in sorted(counts.items(), key=lambda x: (-x[1], x[0]))
        ][:6]
