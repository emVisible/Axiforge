"""Discover topic aggregation API."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.narrative.models import Project
from app.domains.narrative.schemas import ProjectResponse
from app.domains.platform.discover_dashboard_service import DiscoverDashboardService

topic_router = APIRouter(prefix="/api/v1/discover", tags=["discover"])


class TopicSummary(BaseModel):
    slug: str
    label: str
    project_count: int


class TopicListResponse(BaseModel):
    items: List[TopicSummary]


class DiscoverDashboardProject(BaseModel):
    id: str
    title: str
    description: str = ""
    cover_image: str | None = None
    play_count: int = 0
    view_count: int = 0
    author_id: str


class DiscoverDashboardResponse(BaseModel):
    counts: dict[str, int]
    activity_7d: dict[str, int] = Field(default_factory=dict)
    hot_topics: List[TopicSummary] = Field(default_factory=list)
    trending_projects: List[DiscoverDashboardProject] = Field(default_factory=list)


@topic_router.get("/dashboard", response_model=DiscoverDashboardResponse)
async def discover_dashboard(db: AsyncSession = Depends(get_db)):
    """Grove 聚合概览：公开库规模、7 日活跃、热门话题与作品。"""
    data = await DiscoverDashboardService(db).get_dashboard()
    return DiscoverDashboardResponse(
        counts=data.counts,
        activity_7d=data.activity_7d,
        hot_topics=[
            TopicSummary(slug=t.slug, label=t.label, project_count=t.project_count)
            for t in data.hot_topics
        ],
        trending_projects=[
            DiscoverDashboardProject(
                id=p.id,
                title=p.title,
                description=p.description,
                cover_image=p.cover_image,
                play_count=p.play_count,
                view_count=p.view_count,
                author_id=p.author_id,
            )
            for p in data.trending_projects
        ],
    )


@topic_router.get("/topics", response_model=TopicListResponse)
async def list_topics(db: AsyncSession = Depends(get_db)):
  """轻量话题簇：从公开作品的 mechanism / theme_tags 聚合。"""
  projects = (
      await db.execute(
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
  items = [
      TopicSummary(slug=slug, label=slug, project_count=cnt)
      for slug, cnt in sorted(counts.items(), key=lambda x: (-x[1], x[0]))
  ][:40]
  return TopicListResponse(items=items)


@topic_router.get("/topics/{slug}/projects", response_model=List[ProjectResponse])
async def topic_projects(
    slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Project)
        .where(
            Project.is_public == True,  # noqa: E712
            or_(
                Project.mechanism == slug,
                Project.topic_slug == slug,
                Project.theme_tags.contains([slug]),
            ),
        )
        .order_by(Project.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [ProjectResponse.model_validate(r) for r in rows]
