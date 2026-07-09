"""存档缩略图路径解析（服务端根据 Beat / 舞台资产生成）。"""

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.assets.models import AssetScene
from app.domains.narrative.models import ProjectNode, ProjectScene


def _bg_from_script(script: list[Any]) -> Optional[str]:
    for inst in reversed(script):
        if not isinstance(inst, dict):
            continue
        if inst.get("op") != "bg":
            continue
        image = inst.get("image")
        if isinstance(image, str) and image.strip():
            return image.strip()
    return None


async def resolve_save_thumb_path(
    db: AsyncSession,
    *,
    project_id: UUID,
    beat_id: Optional[str],
    client_thumb: Optional[str],
) -> Optional[str]:
    """客户端未提供缩略图时，从 Beat 演出脚本或舞台背景资产推导。"""
    if client_thumb and str(client_thumb).strip():
        return str(client_thumb).strip()
    if not beat_id:
        return None

    try:
        node_uuid = UUID(beat_id)
    except ValueError:
        return None

    node = await db.get(ProjectNode, node_uuid)
    if not node or node.project_id != project_id:
        return None

    narrative = node.narrative_data or {}
    script = narrative.get("script")
    if isinstance(script, list):
        from_script = _bg_from_script(script)
        if from_script:
            return from_script

    if not node.stage_id:
        return None

    scene = await db.get(ProjectScene, node.stage_id)
    if not scene:
        return None

    scene_data = scene.scene_data if isinstance(scene.scene_data, dict) else {}
    inline_bg = scene_data.get("image_path") or scene_data.get("background_image")
    if isinstance(inline_bg, str) and inline_bg.strip():
        return inline_bg.strip()

    if scene.scene_ref_id:
        asset = await db.get(AssetScene, scene.scene_ref_id)
        if asset and asset.image_path:
            return asset.image_path

    return None
