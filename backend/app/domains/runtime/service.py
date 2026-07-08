# --- from services/player.py ---

from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.domains.narrative.models import Project, ProjectScene, ProjectNode, ProjectRole
from app.domains.assets.models import AssetScene
from app.domains.character.models import Character
from app.domains.runtime.models import (
    RuntimeSession,
    SessionEvent,
    SessionMemory,
    SessionFlag,
    CharacterRuntimeState,
)
from app.domains.runtime.schemas import (
    SessionResponse,
    PlayerNode,
    PlayerChoice,
    PlayerCharacterSnapshot,
    PlayerDrawResponse,
    SessionMemoryResponse,
    SessionFlagResponse,
    CharacterRuntimeStateResponse,
)


class PlayerService:
    """
    玩家运行时服务——叙事状态机

    核心职责：
    1. 创建和管理游玩会话
    2. 根据当前状态匹配可用节点（条件系统）
    3. 应用节点效果（记忆/标志/角色状态变化）
    4. 生成面向玩家的 PlayerNode 视图
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ================================================================
    # 会话管理
    # ================================================================

    async def start_session(
        self, project_id: UUID, player_name: Optional[str] = None
    ) -> SessionResponse:
        """创建新的游玩会话，初始化角色状态"""
        # 加载剧本和角色关联
        project = await self._load_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # 创建会话
        session = RuntimeSession(
            project_id=project_id,
            player_name=player_name,
            status="active",
        )
        self.db.add(session)
        await self.db.flush()

        # 为每个关联角色创建初始运行时状态
        for role in project.roles or []:
            name, default_tags = await self._resolve_role_character(
                role.character_ref_id
            )
            if name:
                state = CharacterRuntimeState(
                    session_id=session.id,
                    character_id=role.character_ref_id,
                    character_name=name,
                    current_expression="neutral",
                    current_position="center",
                    current_pose="idle",
                    mood="neutral",
                    affection=0,
                    relationship_tags=(
                        role.locked_version.get("tags", [])
                        if role.locked_version
                        else default_tags
                    ),
                    custom_state={},
                )
                self.db.add(state)

        await self.db.commit()
        await self.db.refresh(session)
        return SessionResponse.model_validate(session)

    async def get_session(self, session_id: UUID) -> Optional[RuntimeSession]:
        """获取会话 ORM 对象（内部使用）"""
        return await self.db.get(RuntimeSession, session_id)

    async def get_session_response(self, session_id: UUID) -> Optional[SessionResponse]:
        session = await self.db.get(RuntimeSession, session_id)
        if not session:
            return None
        return SessionResponse.model_validate(session)

    # ================================================================
    # 叙事推进核心
    # ================================================================

    async def draw(self, session_id: UUID) -> PlayerDrawResponse:
        session = await self.db.get(RuntimeSession, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        project = await self._load_project_with_edges(session.project_id)
        if not project:
            raise ValueError(f"Project {session.project_id} not found")

        memories = await self._get_session_memories(session_id)
        flags = await self._get_session_flags(session_id)
        character_states = await self._get_character_states(session_id)
        character_images = await self._get_character_image_map(character_states)
        completed_node_ids = await self._get_completed_node_ids(session_id)

        # 构建节点查找表（ADR-017：节点直挂 project）
        all_nodes: dict[str, ProjectNode] = {}
        node_scene_map: dict[str, ProjectScene] = {}
        scene_by_id = {str(s.id): s for s in (project.scenes or [])}
        for node in project.nodes or []:
            nid = str(node.id)
            all_nodes[nid] = node
            if node.stage_id:
                scene = scene_by_id.get(str(node.stage_id))
                if scene:
                    node_scene_map[nid] = scene
        if not all_nodes:
            for scene in project.scenes or []:
                for node in scene.nodes or []:
                    all_nodes[str(node.id)] = node
                    node_scene_map[str(node.id)] = scene

        # 构建连线查找表：source_node_id -> list of edges
        edges_by_source: dict[str, list] = {}
        for edge in project.edges or []:
            sid = str(edge.source_node_id)
            if sid not in edges_by_source:
                edges_by_source[sid] = []
            edges_by_source[sid].append(edge)

        # 构建入边集合：用于判断"起始节点"
        nodes_with_incoming = set()
        for edge in project.edges or []:
            nodes_with_incoming.add(str(edge.target_node_id))

        available_nodes = []

        # 如果还没有完成任何节点，返回"起始节点"
        if not completed_node_ids:
            entry_candidates: list[tuple[str, ProjectNode]] = []
            for node_id, node in all_nodes.items():
                narrative = node.narrative_data or {}
                trigger = narrative.get("trigger_condition")
                if not trigger and node_id not in nodes_with_incoming:
                    entry_candidates.append((node_id, node))

            entry = self._pick_entry_node(entry_candidates)
            if entry:
                node_id, node = entry
                scene = node_scene_map.get(node_id)
                player_node = await self._build_player_node_with_edges(
                    node,
                    scene,
                    edges_by_source.get(node_id, []),
                    character_states,
                    memories,
                    flags,
                    character_images,
                )
                available_nodes.append(player_node)

            if not available_nodes:
                # 没有明确的起始节点，取第一个无条件的节点
                for node_id, node in all_nodes.items():
                    narrative = node.narrative_data or {}
                    if (
                        not narrative.get("trigger_condition")
                        and node_id not in completed_node_ids
                    ):
                        scene = node_scene_map.get(node_id)
                        player_node = await self._build_player_node_with_edges(
                            node,
                            scene,
                            edges_by_source.get(node_id, []),
                            character_states,
                            memories,
                            flags,
                            character_images,
                        )
                        available_nodes.append(player_node)
                        break
        else:
            # 有已完成节点：沿最后完成节点 + 上次选择找下一个
            last_completed = await self._get_last_completed_node_id(session_id)

            # 获取玩家上次的选择
            last_choice = None
            if session.state and isinstance(session.state, dict):
                last_choice = session.state.get("last_choice")

            if last_completed and last_completed in edges_by_source:
                outgoing = edges_by_source[last_completed]

                # 根据 last_choice 筛选出边
                if last_choice:
                    matched_edges = [
                        e
                        for e in outgoing
                        if (e.label == last_choice or e.source_port == last_choice)
                    ]
                    outgoing = matched_edges

                for edge in outgoing:
                    target_id = str(edge.target_node_id)
                    if target_id in completed_node_ids:
                        continue

                    target_node = all_nodes.get(target_id)
                    if not target_node:
                        continue

                    narrative = target_node.narrative_data or {}
                    if self._evaluate_condition(
                        narrative.get("trigger_condition"),
                        memories,
                        flags,
                        character_states,
                        completed_node_ids,
                    ):
                        scene = node_scene_map.get(target_id)
                        player_node = await self._build_player_node_with_edges(
                            target_node,
                            scene,
                            edges_by_source.get(target_id, []),
                            character_states,
                            memories,
                            flags,
                            character_images,
                        )
                        available_nodes.append(player_node)
                        break

            # fallback：无连线匹配时找所有条件满足的节点
            if not available_nodes:
                for node_id, node in all_nodes.items():
                    if node_id in completed_node_ids:
                        continue
                    narrative = node.narrative_data or {}
                    if self._evaluate_condition(
                        narrative.get("trigger_condition"),
                        memories,
                        flags,
                        character_states,
                        completed_node_ids,
                    ):
                        scene = node_scene_map.get(node_id)
                        player_node = await self._build_player_node_with_edges(
                            node,
                            scene,
                            edges_by_source.get(node_id, []),
                            character_states,
                            memories,
                            flags,
                            character_images,
                        )
                        available_nodes.append(player_node)

            if not available_nodes:
                if len(completed_node_ids) >= len(all_nodes):
                    session.status = "completed"
                    await self.db.commit()

        return PlayerDrawResponse(
            session_id=session_id,
            session_status=session.status,
            available_nodes=available_nodes,
            current_memories_count=len(memories),
            current_flags_count=len(flags),
        )

    async def _load_project_with_edges(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes),
                selectinload(Project.nodes),
                selectinload(Project.edges),
                selectinload(Project.roles),
            )
            .where(Project.id == project_id)
        )
        return result.scalars().first()

    async def _build_player_node_with_edges(
        self,
        node: ProjectNode,
        scene: ProjectScene,
        outgoing_edges: list,
        character_states: list,
        memories: list,
        flags: list,
        character_images: Optional[Dict[UUID, Optional[str]]] = None,
    ) -> PlayerNode:
        """构建 PlayerNode，从连线自动生成 choices"""
        narrative = node.narrative_data or {}
        image_map = character_images or {}

        # 从出边生成 choices
        choices = []
        for edge in outgoing_edges:
            target_id = str(edge.target_node_id)
            label = edge.label or edge.source_port or "继续"
            choices.append(
                PlayerChoice(
                    label=label,
                    target_node_id=UUID(target_id) if target_id else None,
                    disabled=False,
                    disabled_reason=None,
                )
            )

        # 如果 narrative_data 里有手动定义的 choices，优先使用
        manual_choices = narrative.get("choices")
        if manual_choices:
            choices = []
            for c in manual_choices:
                is_disabled = False
                disabled_reason = None
                if c.get("condition"):
                    if not self._evaluate_condition(
                        c["condition"], memories, flags, character_states, set()
                    ):
                        is_disabled = True
                        disabled_reason = "条件未满足"
                choices.append(
                    PlayerChoice(
                        label=c["label"],
                        target_node_id=(
                            UUID(c["target_node_id"])
                            if c.get("target_node_id")
                            else None
                        ),
                        disabled=is_disabled,
                        disabled_reason=disabled_reason,
                    )
                )

        characters_on_stage = [
            PlayerCharacterSnapshot(
                character_id=cs.character_id,
                name=cs.character_name,
                current_expression=cs.current_expression,
                current_position=cs.current_position,
                outfit=cs.outfit,
                image_path=image_map.get(cs.character_id),
            )
            for cs in character_states
        ]

        scene_ctx = await self._resolve_scene_context(scene)

        return PlayerNode(
            node_id=node.id,
            scene_title=scene_ctx["title"],
            scene_location=scene_ctx["location"],
            speaker_name=narrative.get("speaker"),
            dialogue=narrative.get("dialogue"),
            narration=narrative.get("narration"),
            background_description=scene_ctx["description"],
            background_image=scene_ctx["background_image"],
            atmosphere=scene_ctx["atmosphere"],
            characters_on_stage=characters_on_stage,
            choices=choices,
            auto_advance=narrative.get("auto_advance", False),
            auto_delay_ms=narrative.get("auto_delay_ms"),
            is_anchor=narrative.get("is_anchor", False),
            is_ending=not choices and narrative.get("is_anchor", False),
        )

    async def _get_completed_node_ids(self, session_id: UUID) -> set:
        result = await self.db.execute(
            select(SessionEvent.node_id).where(
                SessionEvent.session_id == session_id,
                SessionEvent.node_id.isnot(None),
            )
        )
        return {str(row[0]) for row in result.fetchall()}

    async def complete(
        self, session_id: UUID, node_id: UUID, choice_label: Optional[str] = None
    ) -> PlayerDrawResponse:
        session = await self.db.get(RuntimeSession, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        node = await self.db.get(ProjectNode, node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")

        narrative = node.narrative_data or {}

        # 记录事件
        event = SessionEvent(
            session_id=session_id,
            node_id=node_id,
            choice_label=choice_label,
            narrative_text=narrative.get("dialogue")
            or narrative.get("narration")
            or "",
            speaker_character_id=None,
        )
        self.db.add(event)

        # 应用效果
        effects = narrative.get("effects", [])
        await self._apply_effects(session_id, node_id, effects)

        session.current_node_id = node_id
        if choice_label:
            current_state = session.state or {}
            current_state["last_choice"] = choice_label
            session.state = current_state

        await self.db.commit()

        # 返回完成后的状态
        return await self.draw(session_id)

    # ================================================================
    # 记忆/标志/角色状态查询
    # ================================================================

    async def get_memories(self, session_id: UUID) -> List[SessionMemoryResponse]:
        result = await self.db.execute(
            select(SessionMemory)
            .where(SessionMemory.session_id == session_id)
            .order_by(SessionMemory.created_at.desc())
        )
        return [SessionMemoryResponse.model_validate(m) for m in result.scalars().all()]

    async def get_flags(self, session_id: UUID) -> List[SessionFlagResponse]:
        result = await self.db.execute(
            select(SessionFlag).where(SessionFlag.session_id == session_id)
        )
        return [SessionFlagResponse.model_validate(f) for f in result.scalars().all()]

    async def get_character_states(
        self, session_id: UUID
    ) -> List[CharacterRuntimeStateResponse]:
        result = await self.db.execute(
            select(CharacterRuntimeState).where(
                CharacterRuntimeState.session_id == session_id
            )
        )
        states = list(result.scalars().all())
        image_map = await self._get_character_image_map(states)
        return [
            CharacterRuntimeStateResponse(
                id=s.id,
                session_id=s.session_id,
                character_id=s.character_id,
                character_name=s.character_name,
                image_path=image_map.get(s.character_id),
                current_expression=s.current_expression,
                current_position=s.current_position,
                current_pose=s.current_pose,
                outfit=s.outfit,
                mood=s.mood,
                affection=s.affection,
                relationship_tags=s.relationship_tags or [],
                location=s.location,
                custom_state=s.custom_state or {},
                updated_at=s.updated_at,
            )
            for s in states
        ]

    # ================================================================
    # 内部：条件评估
    # ================================================================

    def _evaluate_condition(
        self,
        condition: Optional[dict],
        memories: list,
        flags: list,
        character_states: list,
        completed_node_ids: set,
    ) -> bool:
        if not condition:
            return True

        # 新格式：{ "type": "all"|"any"|"none", "conditions": [...] }
        conditions_list = condition.get("conditions")
        if conditions_list and isinstance(conditions_list, list):
            match_type = condition.get("type", "all")
            results = []
            for cond in conditions_list:
                cond_type = cond.get("type")
                key = cond.get("key")
                operator = cond.get("operator", "eq")
                value = cond.get("value")

                if cond_type == "memory":
                    results.append(self._match_memory(memories, key, operator, value))
                elif cond_type == "flag":
                    results.append(self._match_flag(flags, key, operator, value))
                elif cond_type == "character_state":
                    results.append(
                        self._match_character_state(
                            character_states, key, operator, value
                        )
                    )
                elif cond_type == "node_completed":
                    results.append(str(value) in completed_node_ids if value else False)
                else:
                    results.append(False)

            if match_type == "all":
                return all(results)
            elif match_type == "any":
                return any(results)
            elif match_type == "none":
                return not any(results)
            return False

        # 旧格式兼容：直接就是条件对象 { "type": "memory", "key": "...", ... }
        cond_type = condition.get("type")
        key = condition.get("key")
        operator = condition.get("operator", "eq")
        value = condition.get("value")

        if cond_type == "memory":
            return self._match_memory(memories, key, operator, value)
        elif cond_type == "flag":
            return self._match_flag(flags, key, operator, value)
        elif cond_type == "character_state":
            return self._match_character_state(character_states, key, operator, value)
        elif cond_type == "node_completed":
            return str(value) in completed_node_ids if value else False
        return False

    def _match_memory(
        self, memories: list, key: str, operator: str, value: Any
    ) -> bool:
        for m in memories:
            if m.key == key:
                actual = m.value
                if isinstance(actual, dict) and "_value" in actual and len(actual) == 1:
                    actual = actual["_value"]
                return self._compare(actual, operator, value)
        return operator == "ne"

    def _match_flag(self, flags: list, key: str, operator: str, value: Any) -> bool:
        for f in flags:
            if f.key == key:
                actual = f.value
                if isinstance(actual, dict) and "_value" in actual and len(actual) == 1:
                    actual = actual["_value"]
                return self._compare(actual, operator, value)
        return operator == "ne"

    def _match_character_state(
        self, states: List[CharacterRuntimeState], key: str, operator: str, value: Any
    ) -> bool:
        for s in states:
            # key 格式: "character_id.field" 如 "xxx.mood" 或 "xxx.affection"
            parts = key.split(".", 1)
            if len(parts) == 2:
                char_id_str, field = parts
                if str(s.character_id) == char_id_str:
                    field_value = getattr(s, field, None) or s.custom_state.get(field)
                    return self._compare(field_value, operator, value)
        return operator == "ne"

    def _compare(self, actual: Any, operator: str, expected: Any) -> bool:
        """比较两个值，自动归一化布尔类型"""

        # 归一化布尔值：字符串 "true"/"false" 与布尔 True/False 互转
        def normalize(v):
            if isinstance(v, str) and v.lower() in ("true", "false"):
                return v.lower() == "true"
            if isinstance(v, bool):
                return v
            return v

        actual_norm = normalize(actual)
        expected_norm = normalize(expected)

        if operator == "eq":
            return actual_norm == expected_norm or str(actual) == str(expected)
        elif operator == "ne":
            return actual_norm != expected_norm and str(actual) != str(expected)
        elif operator == "gt":
            try:
                return float(actual) > float(expected)
            except (TypeError, ValueError):
                return False
        elif operator == "lt":
            try:
                return float(actual) < float(expected)
            except (TypeError, ValueError):
                return False
        elif operator == "contains":
            if isinstance(actual, list):
                return expected in actual
            if isinstance(actual, str):
                return str(expected) in actual
            return False
        return False

    # ================================================================
    # 内部：效果应用
    # ================================================================
    async def _apply_effects(
        self, session_id: UUID, node_id: UUID, effects: list
    ) -> None:
        for effect in effects:
            effect_type = effect.get("type")
            key = effect.get("key")
            value = effect.get("value")

            if effect_type == "memory":
                self.db.add(
                    SessionMemory(
                        session_id=session_id,
                        node_id=node_id,
                        key=key,
                        value=value if isinstance(value, dict) else {"_value": value},
                    )
                )
            elif effect_type == "flag":
                existing = await self.db.execute(
                    select(SessionFlag).where(
                        SessionFlag.session_id == session_id,
                        SessionFlag.key == key,
                    )
                )
                flag = existing.scalar_one_or_none()
                if flag:
                    flag.value = value if isinstance(value, dict) else {"_value": value}
                else:
                    self.db.add(
                        SessionFlag(
                            session_id=session_id,
                            key=key,
                            value=(
                                value if isinstance(value, dict) else {"_value": value}
                            ),
                        )
                    )
            elif effect_type == "character_state":
                parts = key.split(".", 1)
                if len(parts) == 2:
                    char_id_str, field = parts
                    try:
                        char_id = UUID(char_id_str)
                    except ValueError:
                        continue
                    existing = await self.db.execute(
                        select(CharacterRuntimeState).where(
                            CharacterRuntimeState.session_id == session_id,
                            CharacterRuntimeState.character_id == char_id,
                        )
                    )
                    state = existing.scalar_one_or_none()
                    if state:
                        if hasattr(state, field):
                            setattr(state, field, value)
                        else:
                            state.custom_state = state.custom_state or {}
                            state.custom_state[field] = value

    # ================================================================
    # 内部：构建 PlayerNode 视图
    # ================================================================

    async def _build_player_node(
        self,
        node: ProjectNode,
        scene: ProjectScene,
        character_states: List[CharacterRuntimeState],
        memories: List[SessionMemory],
        flags: List[SessionFlag],
    ) -> PlayerNode:
        """将内部节点转换为面向玩家的视图"""
        narrative = node.narrative_data or {}

        # 构建角色快照
        characters_on_stage = [
            PlayerCharacterSnapshot(
                character_id=cs.character_id,
                name=cs.character_name,
                current_expression=cs.current_expression,
                current_position=cs.current_position,
                outfit=cs.outfit,
            )
            for cs in character_states
        ]

        # 构建选项，评估每个选项的条件
        choices = []
        for choice_data in narrative.get("choices", []):
            is_disabled = False
            disabled_reason = None
            if choice_data.get("condition"):
                if not self._evaluate_condition(
                    choice_data["condition"], memories, flags, character_states
                ):
                    is_disabled = True
                    disabled_reason = "条件未满足"
            choices.append(
                PlayerChoice(
                    label=choice_data["label"],
                    target_node_id=(
                        UUID(choice_data["target_node_id"])
                        if choice_data.get("target_node_id")
                        else None
                    ),
                    disabled=is_disabled,
                    disabled_reason=disabled_reason,
                )
            )

        scene_ctx = await self._resolve_scene_context(scene)

        return PlayerNode(
            node_id=node.id,
            scene_title=scene_ctx["title"],
            scene_location=scene_ctx["location"],
            speaker_name=narrative.get("speaker"),
            dialogue=narrative.get("dialogue"),
            narration=narrative.get("narration"),
            background_description=scene_ctx["description"],
            background_image=scene_ctx["background_image"],
            atmosphere=scene_ctx["atmosphere"],
            characters_on_stage=characters_on_stage,
            choices=choices,
            auto_advance=narrative.get("auto_advance", False),
            auto_delay_ms=narrative.get("auto_delay_ms"),
            is_anchor=narrative.get("is_anchor", False),
            is_ending=not choices and narrative.get("is_anchor", False),
        )

    # ================================================================
    # 内部：数据加载
    # ================================================================

    async def _resolve_scene_context(
        self, scene: Optional[ProjectScene]
    ) -> dict:
        """合并剧本场景与关联 asset_scenes 的视觉上下文。"""
        if not scene:
            return {
                "title": "",
                "location": None,
                "description": None,
                "atmosphere": None,
                "background_image": None,
            }

        description = scene.description or None
        atmosphere = scene.atmosphere
        location = scene.location
        background_image = None

        if scene.scene_ref_id:
            asset = await self.db.get(AssetScene, scene.scene_ref_id)
            if asset:
                if not description:
                    description = asset.description or None
                if not atmosphere:
                    atmosphere = asset.atmosphere
                if not location:
                    location = asset.location
                background_image = asset.image_path

        return {
            "title": scene.title,
            "location": location,
            "description": description,
            "atmosphere": atmosphere,
            "background_image": background_image,
        }

    def _pick_entry_node(
        self, candidates: list[tuple[str, ProjectNode]]
    ) -> Optional[tuple[str, ProjectNode]]:
        """从无入边节点中选取最佳起始节点，优先有对话内容的非锚点节点。"""
        if not candidates:
            return None
        if len(candidates) == 1:
            return candidates[0]

        def score(item: tuple[str, ProjectNode]) -> int:
            _, node = item
            narrative = node.narrative_data or {}
            value = 0
            if narrative.get("dialogue"):
                value += 10
            if not narrative.get("is_anchor"):
                value += 5
            if narrative.get("narration") and not narrative.get("is_anchor"):
                value += 2
            return value

        return max(candidates, key=score)

    async def _get_character_image_map(
        self, character_states: list
    ) -> Dict[UUID, Optional[str]]:
        char_ids = {cs.character_id for cs in character_states}
        if not char_ids:
            return {}

        result = await self.db.execute(
            select(Character.id, Character.image_path).where(
                Character.id.in_(char_ids)
            )
        )
        return {row[0]: row[1] for row in result.fetchall()}

    async def _resolve_role_character(
        self, character_ref_id: UUID
    ) -> tuple[Optional[str], list]:
        """从 Workshop Character 解析角色名与标签。"""
        result = await self.db.execute(
            select(Character)
            .options(selectinload(Character.tags))
            .where(Character.id == character_ref_id)
        )
        char = result.scalar_one_or_none()
        if char:
            return char.name, [t.name for t in (char.tags or [])]
        return None, []

    async def _get_last_completed_node_id(
        self, session_id: UUID
    ) -> Optional[str]:
        result = await self.db.execute(
            select(SessionEvent.node_id)
            .where(
                SessionEvent.session_id == session_id,
                SessionEvent.node_id.isnot(None),
            )
            .order_by(SessionEvent.created_at.desc())
            .limit(1)
        )
        row = result.first()
        return str(row[0]) if row else None

    async def _load_project(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes),
                selectinload(Project.nodes),
                selectinload(Project.roles),
            )
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def _get_session_memories(self, session_id: UUID) -> List[SessionMemory]:
        result = await self.db.execute(
            select(SessionMemory).where(SessionMemory.session_id == session_id)
        )
        return list(result.scalars().all())

    async def _get_session_flags(self, session_id: UUID) -> List[SessionFlag]:
        result = await self.db.execute(
            select(SessionFlag).where(SessionFlag.session_id == session_id)
        )
        return list(result.scalars().all())

    async def _get_character_states(
        self, session_id: UUID
    ) -> List[CharacterRuntimeState]:
        result = await self.db.execute(
            select(CharacterRuntimeState).where(
                CharacterRuntimeState.session_id == session_id
            )
        )
        return list(result.scalars().all())
