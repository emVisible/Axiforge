"""审核目标内容解析 — 为管理中台提供可审阅的上下文。"""

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.platform.models import Comment, UserAccount, Violation


def _clip(text: Optional[str], limit: int = 280) -> str:
    if not text:
        return ""
    t = text.strip()
    return t if len(t) <= limit else t[: limit - 1] + "…"


async def _author_profile(
    db: AsyncSession, author_id: Optional[str]
) -> tuple[Optional[str], int, bool]:
    if not author_id or author_id == "anonymous":
        return None, 0, False
    user = (
        await db.execute(
            select(UserAccount).where(UserAccount.creator_id == author_id)
        )
    ).scalar_one_or_none()
    if not user:
        return None, 0, False
    return user.display_name or user.email, user.strike_count or 0, bool(user.is_banned)


async def _violation_count(db: AsyncSession, target_type: str, target_id: str) -> int:
    return (
        await db.execute(
            select(func.count())
            .select_from(Violation)
            .where(
                Violation.subject_type == target_type,
                Violation.subject_id == target_id,
            )
        )
    ).scalar_one()


async def build_moderation_preview(
    db: AsyncSession,
    *,
    target_type: str,
    target_id: str,
) -> dict[str, Any]:
    """返回 ModerationTargetPreview 兼容的 dict。"""
    base: dict[str, Any] = {
        "title": "（内容不存在或已删除）",
        "excerpt": "",
        "author_id": None,
        "author_display": None,
        "author_strike_count": 0,
        "author_is_banned": False,
        "content_status": None,
        "is_public": None,
        "cover_image": None,
        "discover_path": None,
        "parent_title": None,
        "parent_path": None,
        "exists": False,
        "violation_count": await _violation_count(db, target_type, target_id),
    }

    try:
        if target_type == "project":
            project = await db.get(Project, UUID(target_id))
            if not project:
                return base
            display, strikes, banned = await _author_profile(db, project.author_id)
            base.update(
                {
                    "exists": True,
                    "title": project.title,
                    "excerpt": _clip(project.description),
                    "author_id": project.author_id,
                    "author_display": display,
                    "author_strike_count": strikes,
                    "author_is_banned": banned,
                    "content_status": getattr(project, "content_status", "published"),
                    "is_public": project.is_public,
                    "cover_image": project.cover_image,
                    "discover_path": f"/discover/projects/{project.id}",
                }
            )
            return base

        if target_type == "character":
            character = await db.get(Character, UUID(target_id))
            if not character:
                return base
            display, strikes, banned = await _author_profile(db, character.author_id)
            data = character.character_data or {}
            anchor = data.get("anchor") if isinstance(data, dict) else {}
            essence = ""
            if isinstance(anchor, dict):
                essence = anchor.get("essence") or anchor.get("name") or ""
            base.update(
                {
                    "exists": True,
                    "title": character.name,
                    "excerpt": _clip(essence),
                    "author_id": character.author_id,
                    "author_display": display,
                    "author_strike_count": strikes,
                    "author_is_banned": banned,
                    "content_status": getattr(character, "content_status", "published"),
                    "is_public": character.is_public,
                    "cover_image": character.image_path,
                    "discover_path": f"/discover/characters/{character.id}",
                }
            )
            return base

        if target_type == "comment":
            comment = await db.get(Comment, UUID(target_id))
            if not comment:
                return base
            display, strikes, banned = await _author_profile(db, comment.author_id)
            parent_title, parent_path = await _parent_context(
                db, comment.content_type, comment.content_id
            )
            base.update(
                {
                    "exists": True,
                    "title": f"评论 · {comment.content_type}",
                    "excerpt": _clip(comment.body, 500),
                    "author_id": comment.author_id,
                    "author_display": display,
                    "author_strike_count": strikes,
                    "author_is_banned": banned,
                    "content_status": comment.status,
                    "is_public": comment.status == "visible",
                    "parent_title": parent_title,
                    "parent_path": parent_path,
                    "discover_path": parent_path,
                }
            )
            return base

    except (ValueError, TypeError):
        pass

    return base


async def _parent_context(
    db: AsyncSession, content_type: str, content_id: str
) -> tuple[Optional[str], Optional[str]]:
    try:
        if content_type == "project":
            project = await db.get(Project, UUID(content_id))
            if project:
                return project.title, f"/discover/projects/{project.id}"
        elif content_type == "character":
            character = await db.get(Character, UUID(content_id))
            if character:
                return character.name, f"/discover/characters/{character.id}"
    except (ValueError, TypeError):
        pass
    return None, None


async def list_related_comments(
    db: AsyncSession,
    *,
    content_type: str,
    content_id: str,
    limit: int = 5,
    exclude_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    """管理端：最近评论（含 hidden，排除 deleted）。"""
    stmt = (
        select(Comment)
        .where(
            Comment.content_type == content_type,
            Comment.content_id == content_id,
            Comment.status != "deleted",
            Comment.parent_id.is_(None),
        )
        .order_by(Comment.created_at.desc())
        .limit(limit)
    )
    if exclude_id:
        try:
            stmt = stmt.where(Comment.id != UUID(exclude_id))
        except (ValueError, TypeError):
            pass
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": str(r.id),
            "author_id": r.author_id,
            "body": _clip(r.body, 200),
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in rows
    ]


async def build_author_moderation_profile(
    db: AsyncSession, creator_id: Optional[str]
) -> Optional[dict[str, Any]]:
    if not creator_id or creator_id == "anonymous":
        return None
    user = (
        await db.execute(
            select(UserAccount).where(UserAccount.creator_id == creator_id)
        )
    ).scalar_one_or_none()
    project_count = (
        await db.execute(
            select(func.count())
            .select_from(Project)
            .where(Project.author_id == creator_id)
        )
    ).scalar_one()
    character_count = (
        await db.execute(
            select(func.count())
            .select_from(Character)
            .where(Character.author_id == creator_id)
        )
    ).scalar_one()
    project_ids = (
        await db.execute(select(Project.id).where(Project.author_id == creator_id))
    ).scalars().all()
    character_ids = (
        await db.execute(select(Character.id).where(Character.author_id == creator_id))
    ).scalars().all()
    violation_count = 0
    if project_ids or character_ids:
        from sqlalchemy import or_ as sa_or
        from sqlalchemy import and_ as sa_and

        clauses = []
        if project_ids:
            clauses.append(
                sa_and(
                    Violation.subject_type == "project",
                    Violation.subject_id.in_([str(i) for i in project_ids]),
                )
            )
        if character_ids:
            clauses.append(
                sa_and(
                    Violation.subject_type == "character",
                    Violation.subject_id.in_([str(i) for i in character_ids]),
                )
            )
        violation_count = (
            await db.execute(
                select(func.count()).select_from(Violation).where(sa_or(*clauses))
            )
        ).scalar_one()
    return {
        "user_id": str(user.id) if user else None,
        "creator_id": creator_id,
        "display_name": user.display_name if user else None,
        "email": user.email if user else None,
        "strike_count": (user.strike_count or 0) if user else 0,
        "is_banned": bool(user.is_banned) if user else False,
        "project_count": project_count,
        "character_count": character_count,
        "violation_count": violation_count,
    }


async def resolve_moderation_context(
    db: AsyncSession, *, target_type: str, target_id: str
) -> dict[str, Any]:
    preview = await build_moderation_preview(
        db, target_type=target_type, target_id=target_id
    )
    author_id = preview.get("author_id")
    related_comments: list[dict[str, Any]] = []

    if target_type == "project":
        related_comments = await list_related_comments(
            db, content_type="project", content_id=target_id, limit=5
        )
    elif target_type == "character":
        related_comments = await list_related_comments(
            db, content_type="character", content_id=target_id, limit=5
        )
    elif target_type == "comment":
        comment = await db.get(Comment, UUID(target_id))
        if comment:
            related_comments = await list_related_comments(
                db,
                content_type=comment.content_type,
                content_id=comment.content_id,
                limit=5,
                exclude_id=target_id,
            )
            if not author_id:
                author_id = comment.author_id

    author_profile = await build_author_moderation_profile(db, author_id)
    return {
        "related_comments": related_comments,
        "author_profile": author_profile,
    }
