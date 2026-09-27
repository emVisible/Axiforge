"""「送审正文」的唯一口径：按案件主体取**全文**给判断层。

保存、举报、重判三个入口都从这里取文本。之前举报入口复用的是
`build_moderation_preview` 那份为面板做的摘录（评论 500 字、其余 280 字），
而作品只取 `description`——正文一个字都没送进去。拿摘录去判定正是
`MAX_MODEL_CHARS` 刻意拒绝的事："看不全就做自动裁决"不能因为换了个入口就变成允许的；
两份文本两个指纹，同一部作品还会长期挂着两个案件。
"""
from __future__ import annotations

from types import SimpleNamespace
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.character.models import Character
from app.domains.narrative.models import Project, ProjectNode
from app.domains.narrative.service import project_subject_text
from app.domains.platform.models import Comment


async def load_subject_content(db: AsyncSession, *, subject_type: str,
                               subject_id: str) -> Optional[Tuple[str, str, str]]:
    """返回 (title, body, author_id)；内容已删除或主体类型不认识时返回 None。"""
    try:
        key = UUID(subject_id)
    except (TypeError, ValueError):
        return None

    if subject_type == "comment":
        row = (await db.execute(select(Comment).where(Comment.id == key))).scalar_one_or_none()
        if not row:
            return None
        return "", row.body or "", row.author_id or ""

    if subject_type == "character":
        row = (await db.execute(select(Character).where(Character.id == key))).scalar_one_or_none()
        if not row:
            return None
        anchor = (row.character_data or {}).get("anchor") or {}
        essence = anchor.get("essence") if isinstance(anchor, dict) else ""
        return row.name or "", essence or "", row.author_id or ""

    if subject_type == "project":
        proj = await db.get(Project, key)
        if not proj:
            return None
        nodes = (
            await db.execute(
                select(ProjectNode.narrative_data, ProjectNode.sort_order)
                .where(ProjectNode.project_id == key)
            )
        ).all()
        title, body = project_subject_text(
            title=proj.title or "",
            description=proj.description or "",
            nodes=[SimpleNamespace(narrative_data=nd, sort_order=so) for nd, so in nodes],
        )
        return title, body, proj.author_id or ""

    return None
