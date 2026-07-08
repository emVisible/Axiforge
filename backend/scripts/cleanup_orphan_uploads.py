#!/usr/bin/env python3
"""列出或删除未被数据库引用的上传文件。

用法:
  uv run python scripts/cleanup_orphan_uploads.py          # 仅列出
  uv run python scripts/cleanup_orphan_uploads.py --delete # 删除孤儿文件
"""

from __future__ import annotations

import argparse
import asyncio
import re
from pathlib import Path

from sqlalchemy import select

from app.config import settings
from app.database import async_session, register_models
from app.domains.assets.models import AssetItem, AssetScene
from app.domains.character.models import Character
from app.domains.narrative.models import Project

UPLOAD_REF = re.compile(r"/uploads/([^/?#]+)")


def refs_from_value(val: str | None, bucket: set[str]) -> None:
    if not val:
        return
    for m in UPLOAD_REF.finditer(val):
        bucket.add(m.group(1))


def refs_from_json(obj, bucket: set[str]) -> None:
    if obj is None:
        return
    if isinstance(obj, str):
        refs_from_value(obj, bucket)
    elif isinstance(obj, dict):
        for v in obj.values():
            refs_from_json(v, bucket)
    elif isinstance(obj, list):
        for v in obj:
            refs_from_json(v, bucket)


async def collect_referenced() -> set[str]:
    register_models()
    referenced: set[str] = set()
    async with async_session() as db:
        for row in (await db.execute(select(Project.cover_image))).scalars():
            refs_from_value(row, referenced)
        for row in (await db.execute(select(Character.image_path))).scalars():
            refs_from_value(row, referenced)
        for row in (await db.execute(select(AssetScene.image_path))).scalars():
            refs_from_value(row, referenced)
        for row in (await db.execute(select(AssetItem.image_path))).scalars():
            refs_from_value(row, referenced)
        for row in (await db.execute(select(Character.character_data))).scalars():
            refs_from_json(row, referenced)
    return referenced


async def main(delete: bool) -> None:
    upload_root = Path(settings.upload_dir).resolve()
    if not upload_root.exists():
        print(f"Upload dir missing: {upload_root}")
        return

    referenced = await collect_referenced()
    orphans: list[Path] = []
    for path in upload_root.rglob("*"):
        if not path.is_file():
            continue
        if path.name not in referenced:
            orphans.append(path)

    print(f"Referenced: {len(referenced)} filenames")
    print(f"Orphans: {len(orphans)}")
    for p in sorted(orphans):
        rel = p.relative_to(upload_root)
        print(f"  {'DELETE' if delete else 'orphan'}: {rel}")
        if delete:
            p.unlink(missing_ok=True)

    if delete:
        print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--delete", action="store_true", help="删除孤儿文件")
    args = parser.parse_args()
    asyncio.run(main(args.delete))
