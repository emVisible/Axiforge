"""分支对照样本的播种脚本（金样本第四份，专补 scene 引用兜底 / 道具 / 术语表三条零覆盖分支）。

为什么要有它：三份示范作金样本里 `sceneRefId` 全是 null、`assetRefs` 全是 0、`playMeta` 全是 {}，
也就是说 2026-09-29 抓出来的两处真实分叉（舞台库导入的背景在网页有、桌面空白；道具恒空）
**金样本一条都没覆盖**——它只证明"当前三份样本两边一致"，证明不了"每条分支两边都走"。
本脚本产出的工程把兜底的四种组合各放一遍（自有值优先 / 空串算没值 / 资产字段也空 / 资产查不到），
再把道具引用挂一条存在的与一条悬空的，术语表给出正常值、首尾空白、空 term 三种条目。

用法（一次性 scratch 库，不碰开发库）：
    createdb -h localhost -U young axiforge_golden
    cd backend && DATABASE_URL=postgresql+asyncpg://young@localhost:5432/axiforge_golden uv run alembic upgrade head
    DATABASE_URL=... uv run python scripts/seed_branch_parity.py
    DATABASE_URL=... uv run python scripts/dump_golden.py <打印出来的 id> --out ../../packages/core/src/__golden__
"""

import asyncio
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.domains.assets.models import AssetItem, AssetScene
from app.domains.character.models import Character
from app.domains.narrative.models import (
    Project,
    ProjectAssetRef,
    ProjectEdge,
    ProjectNode,
    ProjectRole,
    ProjectScene,
)

FIXED = uuid.UUID("b1a7c0d0-0000-4000-8000-000000000001")


def _uid(n: int) -> uuid.UUID:
    return uuid.UUID(f"b1a7c0d0-0000-4000-8000-{n:012d}")


async def main() -> None:
    engine = create_async_engine(settings.database_url)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        # 幂等：同一份固定 id 重跑先清后建
        # 固定 id 的所有行都先删掉：本脚本可反复跑，产出的金样本必须逐字节一致
        for model, column, values in [
            (ProjectEdge, ProjectEdge.project_id, [FIXED]),
            (ProjectAssetRef, ProjectAssetRef.project_id, [FIXED]),
            (ProjectRole, ProjectRole.project_id, [FIXED]),
            (ProjectNode, ProjectNode.project_id, [FIXED]),
            (ProjectScene, ProjectScene.project_id, [FIXED]),
            (Project, Project.id, [FIXED]),
            (Character, Character.id, [_uid(10), _uid(11)]),
            (AssetScene, AssetScene.id, [_uid(20), _uid(21)]),
            (AssetItem, AssetItem.id, [_uid(30)]),
        ]:
            await db.execute(delete(model).where(column.in_(values)))
        await db.flush()

        char_public = Character(
            id=_uid(10),
            name="朝",
            author_id="parity-author",
            character_data={"anchor": {"name": "朝", "essence": "守夜人"}},
            is_public=True,
        )
        char_private = Character(
            id=_uid(11),
            name="陌生人",
            author_id="other-author",
            character_data={"anchor": {"name": "陌生人"}},
            is_public=False,
        )
        db.add_all([char_public, char_private])

        asset_full = AssetScene(
            id=_uid(20),
            name="地下站",
            location="方舟·地下",
            atmosphere="潮湿",
            image_path="scenes/parity-under.png",
            author_id="parity-author",
            is_public=True,
        )
        asset_empty = AssetScene(
            id=_uid(21),
            name="空白站",
            location=None,
            atmosphere=None,
            image_path=None,
            author_id="parity-author",
        )
        db.add_all([asset_full, asset_empty])

        item = AssetItem(
            id=_uid(30),
            name="旧钥匙",
            description="锈了，但还能开",
            category="道具",
            rarity="普通",
            mechanism_tags=["开门"],
            effects=[{"type": "unlock", "target": "储物间"}],
            image_path="items/parity-key.png",
            author_id="parity-author",
        )
        db.add(item)

        project = Project(
            id=FIXED,
            title="【对照】分支兜底",
            description="金样本第四份：scene 引用兜底 / 道具 / 术语表",
            world_setting="近未来移动都市「交汇港」",
            rules="夜间不得外出",
            theme_tags=["对照", "兜底"],
            mechanism="单线",
            genre="悬疑",
            is_public=True,
            play_meta={
                "glossary": [
                    {"id": "g1", "term": " 交汇港 ", "definition": "漂浮在大陆边缘的港口都市"},
                    {"term": "无 id 词条", "definition": "缺 id 时按下标补"},
                    {"term": "   ", "definition": "空 term 应当被丢弃"},
                ]
            },
        )
        db.add(project)

        scenes = [
            ProjectScene(
                id=_uid(40), project_id=FIXED, title="自有值优先",
                location="站内", atmosphere="干燥", scene_ref_id=None, sort_order=0,
            ),
            ProjectScene(
                id=_uid(41), project_id=FIXED, title="空串算没值",
                location="", atmosphere="", scene_ref_id=asset_full.id, sort_order=1,
            ),
            ProjectScene(
                id=_uid(42), project_id=FIXED, title="资产字段也空",
                location="月台", atmosphere=None, scene_ref_id=asset_empty.id, sort_order=2,
            ),
            ProjectScene(
                id=_uid(43), project_id=FIXED, title="资产查不到",
                location=None, atmosphere=None,
                scene_ref_id=uuid.UUID("b1a7c0d0-0000-4000-8000-999999999999"),
                sort_order=3,
            ),
        ]
        db.add_all(scenes)

        nodes = [
            ProjectNode(
                id=_uid(50), project_id=FIXED, stage_id=scenes[1].id, sort_order=0,
                editor_data={"position": {"x": 0, "y": 0}},
                narrative_data={
                    "title": "开场",
                    "narration": "灯一盏盏灭下去。",
                    "speaker": char_public.name,
                    "is_anchor": True,
                    "script": [
                        {"op": "bg", "image": "scenes/parity-under.png"},
                        {"op": "bgm", "track": "night_hum", "loop": True},
                        {"op": "say", "text": "别站在灯下。", "speaker": "朝"},
                    ],
                },
            ),
            ProjectNode(
                id=_uid(51), project_id=FIXED, stage_id=scenes[3].id, sort_order=0,
                editor_data={},
                narrative_data={
                    "title": "分支",
                    "narration": "两条路。",
                    "script": [
                        {"op": "narration", "text": "两条路。"},
                        {
                            "op": "choice",
                            "options": [
                                {"label": "走左边", "to": None, "condition": {"flag": "left"}},
                                {"label": "走右边", "to": None},
                            ],
                        },
                    ],
                },
            ),
            ProjectNode(
                id=_uid(52), project_id=FIXED, stage_id=scenes[2].id, sort_order=0,
                editor_data={},
                narrative_data={"title": "收束", "narration": "天亮。", "is_ending": True},
            ),
        ]
        db.add_all(nodes)

        db.add_all([
            ProjectRole(id=_uid(60), project_id=FIXED, character_ref_id=char_public.id, importance=5),
            ProjectRole(id=_uid(61), project_id=FIXED, character_ref_id=char_private.id, importance=2),
            # 同一个角色挂两次：本地契约与 TS 编译器会去重，Python 早前不去重——
            # 这条引用就是为了让两端在这个分支上必须给出同一个 codexScope。
            ProjectRole(id=_uid(62), project_id=FIXED, character_ref_id=char_public.id, importance=1),
        ])

        db.add_all([
            ProjectAssetRef(id=_uid(70), project_id=FIXED, asset_type="item", asset_id=item.id),
            # 悬空引用：另一端（本地/HTTP 与桌面）都必须跳过而不是编出一条空道具
            ProjectAssetRef(id=_uid(71), project_id=FIXED, asset_type="item",
                            asset_id=uuid.UUID("b1a7c0d0-0000-4000-8000-888888888888")),
            ProjectAssetRef(id=_uid(72), project_id=FIXED, asset_type="scene", asset_id=asset_full.id),
        ])

        db.add_all([
            ProjectEdge(id=_uid(80), project_id=FIXED, source_node_id=nodes[0].id,
                        target_node_id=nodes[1].id, label="继续",
                        condition={"op": "and", "items": [{"type": "flag", "key": "visited", "value": True}]}),
            ProjectEdge(id=_uid(81), project_id=FIXED, source_node_id=nodes[1].id,
                        target_node_id=nodes[2].id, label=None, condition=None),
        ])

        await db.commit()

    await engine.dispose()
    print(f"seeded project id: {FIXED}")


if __name__ == "__main__":
    asyncio.run(main())
