# --- from services/seed_showcase.py ---
"""官方示范内容种子（v1.5 内容战役 + v1.6 Codex 演示）"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.character.models import Character
from app.domains.narrative.models import Project
from app.domains.character.schemas import CharacterCreate, CharacterData, Anchor, Contour, Demeanor, Psyche, Trace, Bond
from app.domains.narrative.schemas import (
    ProjectCreate,
    ProjectNodeCreate,
    ProjectNodeUpdate,
    ProjectRoleCreate,
    ProjectEdgeCreate,
    ProjectSceneCreate,
)
from app.domains.character.service import CharacterService
from app.domains.narrative.service import ProjectService

OFFICIAL_AUTHOR = "axiforge-official"

SHOWCASE_TITLES = (
    "【示范】序章·交汇",
    "【示范】缘起·选择",
    "【示范】再会·记忆",
)


async def _official_project_exists(db: AsyncSession, title: str) -> bool:
    row = (
        await db.execute(
            select(Project.id).where(
                Project.title == title,
                Project.author_id == OFFICIAL_AUTHOR,
            )
        )
    ).scalar_one_or_none()
    return row is not None


async def _create_yansha(db: AsyncSession) -> Character:
    existing = (
        await db.execute(
            select(Character).where(
                Character.name == "堰纱",
                Character.author_id == OFFICIAL_AUTHOR,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing

    char = await CharacterService(db).create_character(
        CharacterCreate(
            is_public=True,
            character_data=CharacterData(
                anchor=Anchor(
                    name="堰纱",
                    essence="背负过往、却仍在寻找答案的少女",
                    tags=["RN", "示范角色"],
                    summary="跨作品记忆演示用角色",
                ),
                contour=Contour(
                    identity="神秘来客",
                    first_impression="安静，目光像在打量很久以前的故人",
                ),
                demeanor=Demeanor(speech_style="克制、偶尔露出柔软"),
                psyche=Psyche(desire="被理解", fear="再次被遗忘"),
                trace=Trace(background="曾在「缘起」中与玩家相遇"),
                bond=Bond(attitude_to_others="谨慎地敞开心扉"),
            ),
        )
    )
    char.author_id = OFFICIAL_AUTHOR
    await db.commit()
    await db.refresh(char)
    return char


async def _proj(
    db: AsyncSession,
    title: str,
    description: str,
    *,
    is_meta: bool = True,
    world_setting: Optional[str] = None,
    play_meta: Optional[dict] = None,
) -> Any:
    svc = ProjectService(db)
    return await svc.create(
        ProjectCreate(
            title=title,
            description=description,
            author_id=OFFICIAL_AUTHOR,
            is_public=True,
            is_meta=is_meta,
            world_setting=world_setting,
            play_meta=play_meta or {},
        )
    )


async def _scene(db: AsyncSession, project_id: UUID, title: str) -> Any:
    return await ProjectService(db).add_scene(
        project_id, ProjectSceneCreate(title=title, description="")
    )


async def _node(
    db: AsyncSession,
    project_id: UUID,
    stage_id: UUID,
    narrative_data: dict,
    position: Optional[dict] = None,
) -> Any:
    return await ProjectService(db).add_node(
        project_id,
        ProjectNodeCreate(
            editor_data={"position": position or {"x": 200, "y": 120}},
            narrative_data=narrative_data,
            stage_id=stage_id,
        ),
        stage_id=stage_id,
    )


async def _patch_node_script(
    db: AsyncSession, node_id: UUID, narrative_data: dict
) -> None:
    await ProjectService(db).update_node(
        node_id, ProjectNodeUpdate(narrative_data=narrative_data)
    )


async def _edges(db: AsyncSession, project_id: UUID, edges: List[dict]) -> None:
    await ProjectService(db).update_edges_batch(
        project_id,
        [ProjectEdgeCreate(**e) for e in edges],
    )


async def _role(db: AsyncSession, project_id: UUID, char_id: UUID) -> None:
    await ProjectService(db).add_role(
        project_id,
        ProjectRoleCreate(character_ref_id=char_id, importance=3),
    )


async def seed_cinematic_demo(db: AsyncSession) -> Dict[str, str]:
    """示范①：方舟风演出短篇（楔子1）"""
    title = SHOWCASE_TITLES[0]
    if await _official_project_exists(db, title):
        row = (
            await db.execute(
                select(Project).where(
                    Project.title == title, Project.author_id == OFFICIAL_AUTHOR
                )
            )
        ).scalar_one()
        return {"id": str(row.id), "title": title, "status": "exists"}

    p = await _proj(
        db,
        title,
        "官方示范：镜头、配乐与立绘演出。适合学习 Script 层指令编排。",
        world_setting="近未来移动都市「交汇港」",
        play_meta={
            "glossary": [
                {
                    "id": "g1",
                    "term": "交汇港",
                    "definition": "漂浮在大陆边缘的巨大港口都市，本作舞台。",
                }
            ]
        },
    )
    scene = await _scene(db, p.id, "甲板")
    start = next(
        n for n in scene.nodes if n.narrative_data.get("title") == "开始"
    )

    opening = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "开场",
            "script": [
                {"op": "bg", "image": "deck_sunset"},
                {"op": "bgm", "track": "theme_calm", "fadeMs": 1200, "loop": True},
                {"op": "narration", "text": "夕阳把交汇港染成琥珀色。海风带着金属与海盐的气味。"},
                {"op": "transition", "kind": "fade", "ms": 800},
                {"op": "camera", "action": "zoom", "scale": 1.08, "ms": 600},
                {"op": "say", "speaker": "广播", "text": "各位旅客，交汇港即将入港。"},
                {"op": "narration", "text": "你望向远方逐渐靠近的都市轮廓。"},
                {
                    "op": "choice",
                    "options": [
                        {"label": "继续眺望", "to": None},
                        {"label": "收回目光", "to": None},
                    ],
                },
            ],
        },
        {"x": 280, "y": 80},
    )
    branch_a = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "眺望",
            "script": [
                {"op": "camera", "action": "zoom", "scale": 1.15, "ms": 800},
                {"op": "camera", "action": "shake", "intensity": 4, "ms": 400},
                {"op": "narration", "text": "灯火一盏盏亮起，像有人在对你说：欢迎回来。"},
            ],
            "is_ending": True,
            "ending_label": "眺望结局",
        },
        {"x": 120, "y": 280},
    )
    branch_b = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "收回",
            "script": [
                {"op": "transition", "kind": "fade", "ms": 500},
                {"op": "say", "text": "你转身走向舱门。故事，才刚开始。"},
            ],
            "is_ending": True,
            "ending_label": "入港结局",
        },
        {"x": 440, "y": 280},
    )

    # 修正 choice to 指向具体节点
    opening_nd = opening.narrative_data.copy()
    script = opening_nd["script"]
    choice = script[-1]
    choice["options"][0]["to"] = str(branch_a.id)
    choice["options"][1]["to"] = str(branch_b.id)
    await _patch_node_script(
        db,
        opening.id,
        {**opening_nd, "script": script},
    )

    await _edges(
        db,
        p.id,
        [
            {"source_node_id": start.id, "target_node_id": opening.id, "label": ""},
        ],
    )
    return {"id": str(p.id), "title": title, "status": "created"}


async def seed_sg_origin(db: AsyncSession, yansha_id: UUID) -> Dict[str, str]:
    """示范②：SG 风 Part1 — 写入 Codex"""
    title = SHOWCASE_TITLES[1]
    if await _official_project_exists(db, title):
        row = (
            await db.execute(
                select(Project).where(
                    Project.title == title, Project.author_id == OFFICIAL_AUTHOR
                )
            )
        ).scalar_one()
        return {"id": str(row.id), "title": title, "status": "exists"}

    p = await _proj(
        db,
        title,
        "官方示范：你的选择会被写入跨作品记忆。请先游玩本作，再玩「再会·记忆」。",
        world_setting="雨夜的老旧公寓",
    )
    await _role(db, p.id, yansha_id)
    scene = await _scene(db, p.id, "公寓")
    start = next(n for n in scene.nodes if n.narrative_data.get("title") == "开始")

    meet = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "雨夜",
            "speaker": "堰纱",
            "dialogue": "……你为什么会来这里？",
            "script": [
                {"op": "bg", "image": "apartment_rain"},
                {"op": "bgm", "track": "rain_piano", "loop": True},
                {"op": "say", "speaker": "堰纱", "text": "……你为什么会来这里？"},
                {
                    "op": "choice",
                    "options": [
                        {"label": "我来帮你", "to": None},
                        {"label": "只是路过", "to": None},
                    ],
                },
            ],
        },
        {"x": 300, "y": 100},
    )
    trust = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "信任",
            "script": [
                {"op": "say", "speaker": "堰纱", "text": "……谢谢。我会记住今晚。"},
            ],
            "effects": [
                {
                    "type": "codex_write",
                    "key": f"{yansha_id}.met_player",
                    "value": True,
                },
                {
                    "type": "codex_write",
                    "key": f"{yansha_id}.trust",
                    "value": "high",
                },
            ],
            "is_ending": True,
            "ending_label": "信任结局",
        },
        {"x": 120, "y": 300},
    )
    distant = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "疏远",
            "script": [
                {"op": "say", "speaker": "堰纱", "text": "……是吗。那请便。"},
            ],
            "effects": [
                {
                    "type": "codex_write",
                    "key": f"{yansha_id}.met_player",
                    "value": True,
                },
                {
                    "type": "codex_write",
                    "key": f"{yansha_id}.trust",
                    "value": "low",
                },
            ],
            "is_ending": True,
            "ending_label": "疏远结局",
        },
        {"x": 480, "y": 300},
    )

    meet_nd = meet.narrative_data.copy()
    script = meet_nd["script"]
    script[-1]["options"][0]["to"] = str(trust.id)
    script[-1]["options"][1]["to"] = str(distant.id)
    await _patch_node_script(
        db,
        meet.id,
        {**meet_nd, "script": script},
    )

    await _edges(
        db,
        p.id,
        [{"source_node_id": start.id, "target_node_id": meet.id, "label": ""}],
    )
    return {"id": str(p.id), "title": title, "status": "created"}


async def seed_sg_reunion(db: AsyncSession, yansha_id: UUID) -> Dict[str, str]:
    """示范③：SG 风 Part2 — 读取 Codex，开场因记忆而不同"""
    title = SHOWCASE_TITLES[2]
    if await _official_project_exists(db, title):
        row = (
            await db.execute(
                select(Project).where(
                    Project.title == title, Project.author_id == OFFICIAL_AUTHOR
                )
            )
        ).scalar_one()
        return {"id": str(row.id), "title": title, "status": "exists"}

    p = await _proj(
        db,
        title,
        "官方示范：若你玩过「缘起·选择」，堰纱会记得你。RN 跨作品首秀。",
        world_setting="一年后的交汇港咖啡馆",
    )
    await _role(db, p.id, yansha_id)
    scene = await _scene(db, p.id, "咖啡馆")
    start = next(n for n in scene.nodes if n.narrative_data.get("title") == "开始")

    router = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "推门",
            "script": [
                {"op": "bg", "image": "cafe_day"},
                {"op": "narration", "text": "推开咖啡馆的门，风铃轻响。"},
            ],
        },
        {"x": 300, "y": 80},
    )
    remember = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "她记得你",
            "trigger_condition": {
                "type": "all",
                "conditions": [
                    {
                        "type": "codex",
                        "key": f"{yansha_id}.trust",
                        "operator": "eq",
                        "value": "high",
                    }
                ],
            },
            "script": [
                {"op": "show", "characterId": f"{yansha_id}", "expression": "smile", "position": "center"},
                {"op": "say", "speaker": "堰纱", "text": "……你来了。我就知道你还会来。"},
            ],
            "is_ending": True,
            "ending_label": "再会·信任",
        },
        {"x": 120, "y": 280},
    )
    stranger = await _node(
        db,
        p.id,
        scene.id,
        {
            "title": "陌生重逢",
            "trigger_condition": {
                "type": "any",
                "conditions": [
                    {
                        "type": "codex",
                        "key": f"{yansha_id}.met_player",
                        "operator": "ne",
                        "value": True,
                    },
                    {
                        "type": "codex",
                        "key": f"{yansha_id}.trust",
                        "operator": "eq",
                        "value": "low",
                    },
                ],
            },
            "script": [
                {"op": "say", "speaker": "堰纱", "text": "……我们，见过吗？"},
            ],
            "is_ending": True,
            "ending_label": "再会·陌生",
        },
        {"x": 480, "y": 280},
    )

    await _edges(
        db,
        p.id,
        [
            {"source_node_id": start.id, "target_node_id": router.id, "label": ""},
            {"source_node_id": router.id, "target_node_id": remember.id, "label": ""},
            {"source_node_id": router.id, "target_node_id": stranger.id, "label": ""},
        ],
    )
    return {"id": str(p.id), "title": title, "status": "created"}


async def seed_all_showcases(db: AsyncSession) -> Dict[str, Any]:
    yansha = await _create_yansha(db)
    yid = yansha.id
    return {
        "character_id": str(yid),
        "projects": [
            await seed_cinematic_demo(db),
            await seed_sg_origin(db, yid),
            await seed_sg_reunion(db, yid),
        ],
    }
