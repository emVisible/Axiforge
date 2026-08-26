"""金样本导出：对指定工程同时产出 ①编译器输入 JSON ②Python StoryPackage 输出。
用法：DATABASE_URL=... uv run python scripts/dump_golden.py <project_id> ... --out ../../packages/core/src/__golden__
"""
import asyncio, json, sys
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload, sessionmaker

from app.config import settings
from app.domains.narrative.models import Project, ProjectScene, ProjectNode, ProjectEdge, ProjectRole
from app.domains.assets.models import AssetScene, AssetItem
from app.domains.character.models import Character
from app.domains.narrative.compiler import StoryCompiler


def node_dict(n: ProjectNode) -> dict:
    return {
        "id": str(n.id),
        "stageId": n.stage_id,
        "editorData": n.editor_data or {},
        "narrativeData": n.narrative_data or {},
        "sortOrder": n.sort_order or 0,
    }


def scene_dict(s: ProjectScene) -> dict:
    return {
        "id": str(s.id), "title": s.title, "location": s.location,
        "atmosphere": s.atmosphere, "sceneRefId": s.scene_ref_id,
        "nodes": [],
    }


async def main(project_ids: list[str], out_dir: Path):
    engine = create_async_engine(settings.database_url)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        for pid in project_ids:
            project = (await db.execute(
                select(Project)
                .options(selectinload(Project.scenes), selectinload(Project.nodes),
                         selectinload(Project.edges), selectinload(Project.roles),
                         selectinload(Project.asset_refs))
                .where(Project.id == UUID(pid))
            )).scalar_one_or_none()
            if not project:
                print(f"skip {pid}: not found"); continue

            # 场景资产预解析（TS 侧输入为已解析形态）
            scenes = []
            for s in (project.scenes or []):
                d = scene_dict(s)
                if s.scene_ref_id:
                    asset = await db.get(AssetScene, s.scene_ref_id)
                    if asset:
                        d["sceneRef"] = {"location": asset.location,
                                         "atmosphere": asset.atmosphere,
                                         "imagePath": asset.image_path}
                scenes.append(d)

            # 角色预取（按角色引用顺序去重）
            role_ids = [r.character_ref_id for r in (project.roles or [])]
            seen, chars = set(), []
            for rid in role_ids:
                if rid in seen: continue
                seen.add(rid)
                c = await db.get(Character, rid)
                if c:
                    chars.append({"id": str(c.id), "name": c.name,
                                  "characterData": c.character_data or {},
                                  "imagePath": c.image_path})

            # 道具预解析
            items = []
            for r in (project.asset_refs or []):
                if r.asset_type != "item": continue
                it = await db.get(AssetItem, r.asset_id)
                if it:
                    items.append({"id": str(it.id), "assetId": str(r.asset_id),
                                  "asset": {"id": str(it.id), "name": it.name,
                                            "category": it.category,
                                            "imagePath": it.image_path}})

            compiler_input = {
                "id": str(project.id), "title": project.title,
                "isPublic": bool(project.is_public),
                "worldSetting": project.world_setting,
                "playMeta": project.play_meta if isinstance(project.play_meta, dict) else {},
                "nodes": [node_dict(n) for n in (project.nodes or [])],
                "edges": [{"sourceNodeId": str(e.source_node_id),
                           "targetNodeId": str(e.target_node_id),
                           "label": e.label, "condition": e.condition}
                          for e in (project.edges or [])],
                "scenes": scenes, "roles": [{"characterRefId": r} for r in role_ids],
                "characters": chars, "items": items,
            }

            package = await StoryCompiler(db).compile(UUID(pid), author_id=project.author_id)
            expected = json.loads(package.model_dump_json(by_alias=True))

            slug = f"{project.title[:12]}".replace(" ", "_") or pid[:8]
            d = out_dir / f"{pid[:8]}-{slug}"
            d.mkdir(parents=True, exist_ok=True)
            (d / "input.json").write_text(json.dumps(compiler_input, ensure_ascii=False, indent=2, default=str))
            (d / "expected.json").write_text(json.dumps(expected, ensure_ascii=False, indent=2))
            print(f"dumped {pid} -> {d} (beats={len(expected['beats'])})")
    await engine.dispose()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = Path("packages/core/src/__golden__")
    if "--out" in sys.argv:
        out = Path(sys.argv[sys.argv.index("--out") + 1])
    asyncio.run(main(args, out))
