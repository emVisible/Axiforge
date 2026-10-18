# --- from services/compiler.py ---
"""
Story Compiler（ADR-008 桥1）

把一个剧本（DB：scenes / nodes / edges / roles）编译为可移植的 StoryPackage IR，
供 @axiforge/core 引擎在客户端本地播放。后端由此从"逐句解释器"转为"编译器"。

兼容迁移（ADR-009）：v1.0 的单句节点（speaker/dialogue/narration/choices）自动
包装为演出脚本——旧项目零手工迁移可玩。若节点已带新版 narrative_data.script，
则直接采用。
"""

from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.narrative.models import Project, ProjectScene, ProjectNode
from app.domains.assets.models import AssetScene, AssetItem
from app.domains.character.models import Character
from app.domains.narrative.ir import (
    StoryPackage,
    Beat,
    Transition,
    CharacterRef,
    SceneRef,
    ItemRef,
    GlossaryEntry,
    CharacterProfile,
    Instruction,
    SayInstruction,
    ChoiceInstruction,
    ChoiceOption,
    SayInstruction as _Say,  # noqa: F401 (可读性别名保留)
)
from pydantic import TypeAdapter

# 用于把 narrative_data.script 里的原始 dict 解析成带判别式的 Instruction
_instruction_list_adapter = TypeAdapter(List[Instruction])


class StoryCompiler:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def compile(
        self, project_id: UUID, *, author_id: Optional[str] = None
    ) -> StoryPackage:
        project = await self._load_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        if not project.is_public:
            if not author_id or author_id != project.author_id:
                raise PermissionError("Project is private")

        # --- 角色引用（名称 / 头像 / 名称→id 映射） ---
        characters, name_to_id = await self._build_characters(project)

        # --- 场景引用（含 asset 背景解析） ---
        scenes = await self._build_scenes(project)

        # --- 道具引用 ---
        items = await self._build_items(project)

        # --- 节点查找表 + 出边表 + 入边集合 ---
        all_nodes: Dict[str, ProjectNode] = {}
        node_scene: Dict[str, ProjectScene] = {}
        scene_by_id = {str(s.id): s for s in (project.scenes or [])}
        for node in project.nodes or []:
            nid = str(node.id)
            all_nodes[nid] = node
            if node.stage_id:
                node_scene[nid] = scene_by_id.get(str(node.stage_id))
        if not all_nodes:
            for scene in project.scenes or []:
                for node in scene.nodes or []:
                    all_nodes[str(node.id)] = node
                    node_scene[str(node.id)] = scene

        edges_by_source: Dict[str, list] = {}
        nodes_with_incoming: set[str] = set()
        transitions: List[Transition] = []
        for edge in project.edges or []:
            sid = str(edge.source_node_id)
            tid = str(edge.target_node_id)
            edges_by_source.setdefault(sid, []).append(edge)
            nodes_with_incoming.add(tid)
            transitions.append(
                Transition(from_=sid, to=tid, label=edge.label)
            )

        # --- 编译每个节点为 Beat ---
        beats: List[Beat] = []
        for node_id, node in all_nodes.items():
            scene = node_scene.get(node_id)
            beats.append(
                self._compile_beat(
                    node,
                    node_id,
                    scene,
                    edges_by_source.get(node_id, []),
                    name_to_id,
                )
            )

        start_beat_id = self._pick_start_beat(
            all_nodes, nodes_with_incoming, edges_by_source
        )

        glossary = self._build_glossary(project)
        profiles = await self._build_character_profiles(project)
        # 选角引用不去重（编排台允许同一角色挂两条），但 codexScope 的用途是
        # "查哪些角色的跨作品记忆"：重复项没有语义，而两端各给一份就是第二个真相源。
        # TS 侧 packages/core/compiler.ts:419 一直去重，这里按它的口径收敛（保持首次出现顺序）。
        codex_scope = list(dict.fromkeys(
            str(r.character_ref_id)
            for r in (project.roles or [])
            if r.character_ref_id
        ))

        return StoryPackage(
            irVersion=1,
            projectId=str(project.id),
            title=project.title,
            startBeatId=start_beat_id,
            beats=beats,
            transitions=transitions,
            characters=characters,
            scenes=scenes,
            items=items,
            worldSetting=project.world_setting,
            glossary=glossary,
            characterProfiles=profiles,
            codexScope=codex_scope,
        )

    # ------------------------------------------------------------
    # Beat 编译
    # ------------------------------------------------------------

    def _compile_beat(
        self,
        node: ProjectNode,
        node_id: str,
        scene: Optional[ProjectScene],
        outgoing_edges: list,
        name_to_id: Dict[str, str],
    ) -> Beat:
        narrative = node.narrative_data or {}

        script = self._build_script(narrative, outgoing_edges, name_to_id)

        manual_choices = narrative.get("choices") or []
        has_choice = any(getattr(i, "op", None) == "choice" for i in script)
        manual_ending = narrative.get("is_ending")
        is_ending = (
            bool(manual_ending)
            if manual_ending is not None
            else (
                not outgoing_edges
                and not manual_choices
                and not has_choice
            )
        )
        ending_label = narrative.get("ending_label")

        return Beat(
            id=node_id,
            sceneId=str(scene.id) if scene else None,
            sceneTitle=scene.title if scene else None,
            stage=str(scene.id) if scene else None,
            actors=self._extract_actors(script, narrative, name_to_id),
            props=narrative.get("props") or [],
            trigger=narrative.get("trigger_condition"),
            script=script,
            effects=narrative.get("effects", []) or [],
            isEnding=is_ending,
            endingLabel=ending_label,
        )

    def _extract_actors(
        self,
        script: List[Instruction],
        narrative: dict,
        name_to_id: Dict[str, str],
    ) -> List[str]:
        explicit = narrative.get("actors")
        if isinstance(explicit, list) and explicit:
            return [str(a) for a in explicit]
        actors: set[str] = set()
        for inst in script:
            op = getattr(inst, "op", None)
            cid = getattr(inst, "characterId", None)
            if cid and op in ("say", "show", "hide", "move"):
                actors.add(str(cid))
            speaker = getattr(inst, "speaker", None)
            if speaker and speaker in name_to_id:
                actors.add(name_to_id[speaker])
        return sorted(actors)

    def _build_script(
        self,
        narrative: dict,
        outgoing_edges: list,
        name_to_id: Dict[str, str],
    ) -> List[Instruction]:
        # 新格式：节点已带演出脚本 → 直接采用
        raw_script = narrative.get("script")
        if isinstance(raw_script, list) and raw_script:
            return _instruction_list_adapter.validate_python(raw_script)

        # 兼容迁移：单句节点 → 合成演出脚本
        script: List[Instruction] = []

        narration = narrative.get("narration")
        if narration:
            script.append(SayInstruction(characterId=None, speaker=None, text=narration))

        dialogue = narrative.get("dialogue")
        if dialogue:
            speaker = narrative.get("speaker")
            cid = name_to_id.get(speaker) if speaker else None
            script.append(
                SayInstruction(characterId=cid, speaker=speaker, text=dialogue)
            )

        # 分支：manual choices 优先；否则 >=2 出边视为分支
        manual_choices = narrative.get("choices") or []
        if manual_choices:
            script.append(
                ChoiceInstruction(
                    options=[
                        ChoiceOption(
                            label=c.get("label", "继续"),
                            to=c.get("target_node_id"),
                            condition=c.get("condition"),
                        )
                        for c in manual_choices
                    ]
                )
            )
        elif len(outgoing_edges) >= 2:
            script.append(
                ChoiceInstruction(
                    options=[
                        ChoiceOption(
                            label=e.label or "继续",
                            to=str(e.target_node_id),
                            condition=e.condition,
                        )
                        for e in outgoing_edges
                    ]
                )
            )
        # 单出边 → 线性，交由 transition 自动推进（不生成 choice）

        return script

    def _pick_start_beat(
        self,
        all_nodes: Dict[str, ProjectNode],
        nodes_with_incoming: set[str],
        edges_by_source: Dict[str, list],
    ) -> Optional[str]:
        candidates: List[tuple[str, ProjectNode]] = []
        for node_id, node in all_nodes.items():
            narrative = node.narrative_data or {}
            if not narrative.get("trigger_condition") and node_id not in nodes_with_incoming:
                candidates.append((node_id, node))

        if not candidates:
            return next(iter(all_nodes), None)

        def score(item: tuple[str, ProjectNode]) -> int:
            node_id, node = item
            narrative = node.narrative_data or {}
            value = 0
            # 起点必然流向某处；无出边者多为悬空/终点，强烈降权
            if edges_by_source.get(node_id):
                value += 20
            if narrative.get("dialogue") or narrative.get("script") or narrative.get("narration"):
                value += 10
            if not narrative.get("is_anchor"):
                value += 5
            return value

        # 分数相同则取 sort_order 更小者（编辑器中更靠前 = 更像起点）
        return max(
            candidates, key=lambda it: (score(it), -(it[1].sort_order or 0))
        )[0]

    # ------------------------------------------------------------
    # 角色 / 场景引用
    # ------------------------------------------------------------

    async def _build_characters(
        self, project: Project
    ) -> tuple[List[CharacterRef], Dict[str, str]]:
        role_ids = [r.character_ref_id for r in (project.roles or [])]
        if not role_ids:
            return [], {}

        result = await self.db.execute(
            select(Character).where(Character.id.in_(role_ids))
        )
        chars = list(result.scalars().all())

        refs: List[CharacterRef] = []
        name_to_id: Dict[str, str] = {}
        for c in chars:
            # 表情差分（桥5）：character_data.sprites = { 表情key: 图片路径 }
            # 无 Alembic 迁移，差分表存于六层 JSONB 内，避免给 characters 加列。
            expressions = None
            data = c.character_data if isinstance(c.character_data, dict) else {}
            sprites = data.get("sprites")
            if isinstance(sprites, dict) and sprites:
                expressions = {
                    str(k): str(v) for k, v in sprites.items() if v
                }
            refs.append(
                CharacterRef(
                    id=str(c.id),
                    name=c.name,
                    imagePath=c.image_path,
                    expressions=expressions,
                )
            )
            if c.name:
                name_to_id[c.name] = str(c.id)
        return refs, name_to_id

    async def _build_scenes(self, project: Project) -> List[SceneRef]:
        refs: List[SceneRef] = []
        for scene in project.scenes or []:
            location = scene.location
            atmosphere = scene.atmosphere
            background_image = None

            if scene.scene_ref_id:
                asset = await self.db.get(AssetScene, scene.scene_ref_id)
                if asset:
                    location = location or asset.location
                    atmosphere = atmosphere or asset.atmosphere
                    background_image = asset.image_path

            refs.append(
                SceneRef(
                    id=str(scene.id),
                    title=scene.title,
                    location=location,
                    atmosphere=atmosphere,
                    backgroundImage=background_image,
                )
            )
        return refs

    async def _build_items(self, project: Project) -> List[ItemRef]:
        item_refs = [
            r for r in (project.asset_refs or []) if r.asset_type == "item"
        ]
        if not item_refs:
            return []

        ids = [r.asset_id for r in item_refs]
        result = await self.db.execute(
            select(AssetItem).where(AssetItem.id.in_(ids))
        )
        items_by_id = {str(i.id): i for i in result.scalars().all()}

        refs: List[ItemRef] = []
        for ref in item_refs:
            item = items_by_id.get(str(ref.asset_id))
            if not item:
                continue
            refs.append(
                ItemRef(
                    id=str(item.id),
                    name=item.name,
                    category=item.category,
                    imagePath=item.image_path,
                )
            )
        return refs

    def _build_glossary(self, project: Project) -> List[GlossaryEntry]:
        meta = project.play_meta if isinstance(project.play_meta, dict) else {}
        raw = meta.get("glossary") or []
        entries: List[GlossaryEntry] = []
        if not isinstance(raw, list):
            return entries
        for i, item in enumerate(raw):
            if not isinstance(item, dict):
                continue
            term = str(item.get("term") or "").strip()
            definition = str(item.get("definition") or "").strip()
            if not term:
                continue
            entries.append(
                GlossaryEntry(
                    id=str(item.get("id") or f"g{i}"),
                    term=term,
                    definition=definition,
                )
            )
        return entries

    async def _build_character_profiles(
        self, project: Project
    ) -> List[CharacterProfile]:
        role_ids = [r.character_ref_id for r in (project.roles or [])]
        if not role_ids:
            return []

        result = await self.db.execute(
            select(Character).where(Character.id.in_(role_ids))
        )
        chars = list(result.scalars().all())
        profiles: List[CharacterProfile] = []
        for c in chars:
            data = c.character_data if isinstance(c.character_data, dict) else {}
            anchor = data.get("anchor") if isinstance(data.get("anchor"), dict) else {}
            contour = data.get("contour") if isinstance(data.get("contour"), dict) else {}
            profiles.append(
                CharacterProfile(
                    id=str(c.id),
                    name=c.name,
                    imagePath=c.image_path,
                    summary=anchor.get("summary"),
                    essence=anchor.get("essence"),
                    identity=contour.get("identity"),
                    appearance=contour.get("appearance"),
                    tags=anchor.get("tags") or [],
                )
            )
        return profiles

    async def _load_project(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes),
                selectinload(Project.nodes),
                selectinload(Project.edges),
                selectinload(Project.roles),
                selectinload(Project.asset_refs),
            )
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()
