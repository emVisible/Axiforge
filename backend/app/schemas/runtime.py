
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

# ============================================================
# 请求
# ============================================================


class StartSessionRequest(BaseModel):
    project_id: UUID
    player_name: Optional[str] = None


class CompleteNodeRequest(BaseModel):
    node_id: UUID
    choice_label: Optional[str] = None


# ============================================================
# Player Node — 面向玩家的节点视图
# ============================================================


class PlayerChoice(BaseModel):
    """一个玩家可选分支"""

    label: str
    target_node_id: Optional[UUID] = None
    disabled: bool = False  # 条件不满足时禁用
    disabled_reason: Optional[str] = None


class PlayerCharacterSnapshot(BaseModel):
    """节点中出现的角色的当前快照"""

    character_id: UUID
    name: str
    current_expression: str = "neutral"
    current_position: str = "center"
    outfit: Optional[str] = None
    image_path: Optional[str] = None


class PlayerNode(BaseModel):
    """
    面向玩家的叙事节点。

    与编辑器中的 narrative_data 不同，这是经过 DealerService
    处理后、加入了角色运行时状态、解析了条件后的最终视图。
    """

    node_id: UUID
    scene_title: str
    scene_location: Optional[str] = None

    # 文本内容
    speaker_name: Optional[str] = None  # 当前说话者
    dialogue: Optional[str] = None  # 对话文本
    narration: Optional[str] = None  # 旁白文本

    # 背景
    background_description: Optional[str] = None
    background_image: Optional[str] = None
    atmosphere: Optional[str] = None

    # 出场角色（当前场景中的角色及其立绘状态）
    characters_on_stage: List[PlayerCharacterSnapshot] = []

    # 分支选项
    choices: List[PlayerChoice] = []

    # 是否自动推进（旁白/独白场景）
    auto_advance: bool = False
    auto_delay_ms: Optional[int] = None

    # 叙事元信息
    is_anchor: bool = False
    is_ending: bool = False


class PlayerDrawResponse(BaseModel):
    """玩家拉取当前可用事件"""

    session_id: UUID
    session_status: str
    available_nodes: List[PlayerNode]
    current_memories_count: int
    current_flags_count: int


# ============================================================
# Session
# ============================================================


class SessionResponse(BaseModel):
    id: UUID
    project_id: UUID
    status: str
    current_node_id: Optional[UUID] = None
    player_name: Optional[str] = None
    started_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# Memory / Flag / CharacterState
# ============================================================


class SessionMemoryResponse(BaseModel):
    id: UUID
    session_id: UUID
    node_id: UUID
    key: str
    value: dict
    created_at: datetime

    class Config:
        from_attributes = True


class SessionFlagResponse(BaseModel):
    id: UUID
    session_id: UUID
    key: str
    value: dict
    updated_at: datetime

    class Config:
        from_attributes = True


class CharacterRuntimeStateResponse(BaseModel):
    id: UUID
    session_id: UUID
    character_id: UUID
    character_name: str
    image_path: Optional[str] = None
    current_expression: str
    current_position: str
    current_pose: str
    outfit: Optional[str] = None
    mood: str
    affection: int
    relationship_tags: List[str]
    location: Optional[str] = None
    custom_state: dict
    updated_at: datetime

    class Config:
        from_attributes = True
