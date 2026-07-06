
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Text,
    Boolean,
    Float,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class Project(Base):
    """
    剧本（原 Script）

    一个剧本是一个叙事容器。它引用资产池中的角色/场景/道具/插件，
    并定义节点和连线来组织叙事流程。
    """

    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    cover_image = Column(String(500), nullable=True)

    # 核心设定
    mechanism = Column(String(100), nullable=True)  # 核心机制：日常/密室逃脱/末日生存
    style_reference = Column(String(255), nullable=True)  # 参考风格
    theme_tags = Column(JSONB, default=list)  # 主题标签
    genre = Column(String(100), nullable=True)  # 题材
    world_setting = Column(Text, nullable=True)  # 世界观
    rules = Column(Text, nullable=True)  # 规则

    # 元数据
    is_public = Column(Boolean, default=False)
    is_meta = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    author_id = Column(String(255), default="anonymous")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    scenes = relationship(
        "ProjectScene",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectScene.sort_order",
    )
    roles = relationship(
        "ProjectRole",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    asset_refs = relationship(
        "ProjectAssetRef",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    edges = relationship(
        "ProjectEdge",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectScene(Base):
    """
    剧本中的场景（原 Scene）

    场景可以引用全局 AssetScene，也可以内联定义，或锁定引用版本。
    - source = "reference": 引用 asset_scenes 中的场景，实时同步
    - source = "locked": 引用但锁定当前版本，不再自动更新
    - source = "inline": 完全在剧本内定义，不依赖资产池
    """

    __tablename__ = "project_scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    # 引用控制
    source = Column(
        String(20), nullable=False, default="inline"
    )  # reference | locked | inline
    scene_ref_id = Column(UUID(as_uuid=True), nullable=True)  # 指向 asset_scenes.id
    scene_data = Column(JSONB, nullable=True)  # 锁定或内联时的完整场景数据

    # 内联字段（inline 模式下直接使用，reference 模式下从 asset 同步）
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    location = Column(String(255), nullable=True)
    atmosphere = Column(Text, nullable=True)
    parent_scene_id = Column(UUID(as_uuid=True), nullable=True)

    sort_order = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    project = relationship("Project", back_populates="scenes")
    nodes = relationship(
        "ProjectNode",
        back_populates="scene",
        cascade="all, delete-orphan",
        order_by="ProjectNode.sort_order",
    )


class ProjectNode(Base):
    """
    剧本节点（原 ScriptNode）

    核心设计：编辑器数据与叙事数据分离。
    - editor_data: 画布坐标、尺寸、连线端点——仅供编辑器使用
    - narrative_data: 标题、描述、触发条件、完成效果——供运行时使用

    一个节点在编辑器中是一个可视方块，在运行时是一个叙事单元。
    两种视角共享同一个数据行，但读取的字段不同。
    """

    __tablename__ = "project_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scene_id = Column(
        UUID(as_uuid=True),
        ForeignKey("project_scenes.id", ondelete="CASCADE"),
        nullable=False,
    )

    # === 编辑器数据（仅供编辑器读取和写入） ===
    editor_data = Column(JSONB, default=dict)
    # 结构: {
    #   "position": { "x": float, "y": float },
    #   "size": { "width": float, "height": float },
    #   "ports": { "input": str, "outputs": [{ "id": str, "label": str }] },
    # }

    # === 叙事数据（编辑器写入，运行时读取） ===
    narrative_data = Column(JSONB, default=dict)
    # 结构: {
    #   "title": str,
    #   "description": str,
    #   "is_anchor": bool,
    #   "speaker": str | null,           # 说话角色名
    #   "dialogue": str | null,          # 对话文本
    #   "narration": str | null,         # 旁白文本
    #   "trigger_condition": Condition | null,
    #   "effects": Effect[],
    #   "choices": [{
    #     "label": str,                  # 选项文本
    #     "target_node_id": str | null,  # 目标节点（手动指定）
    #     "condition": Condition | null, # 选项可见条件
    #   }],
    #   "auto_advance": bool,            # 是否自动推进
    #   "auto_delay_ms": int | null,     # 自动推进延迟
    # }
    #
    # Condition 结构:
    #   { "type": "memory"|"flag"|"character_state"|"node_completed",
    #     "key": str, "operator": "eq"|"ne"|"gt"|"lt"|"contains", "value": any }
    #
    # Effect 结构:
    #   { "type": "memory"|"flag"|"character_state",
    #     "key": str, "value": any }

    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    scene = relationship("ProjectScene", back_populates="nodes")


class ProjectRole(Base):
    """
    剧本中的角色关联（原 ScriptRole）

    引用 Workshop Character（characters 表）。
    """

    __tablename__ = "project_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    character_ref_id = Column(
        UUID(as_uuid=True), nullable=False
    )  # 指向 characters.id
    locked_version = Column(JSONB, nullable=True)  # 锁定时的角色快照

    importance = Column(Integer, default=0)  # 0-5 重要级
    role_description = Column(Text, nullable=True)  # 在本剧本中的角色定位

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    project = relationship("Project", back_populates="roles")


class ProjectAssetRef(Base):
    """
    剧本中的资产引用（道具/插件）

    统一的轻量引用表。不存储资产数据，只记录引用了什么。
    """

    __tablename__ = "project_asset_refs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    asset_type = Column(String(20), nullable=False)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    locked_version = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    project = relationship("Project", back_populates="asset_refs")


class ProjectEdge(Base):
    """
    节点连线（纯编辑器概念）

    连线定义了节点之间的转移关系。在编辑器中由 React Flow 的 Edge 管理，
    在运行时，DealerService 根据 narrative_data 中的 choices 和 trigger_condition
    来决定可用的事件，而非直接读取 edges 表。

    此表存在是为了：
    1. 持久化编辑器画布的连线状态
    2. 作为 choices 的视觉来源（编辑器可根据连线自动生成 choices）
    """

    __tablename__ = "project_edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    source_node_id = Column(UUID(as_uuid=True), nullable=False)
    target_node_id = Column(UUID(as_uuid=True), nullable=False)
    source_port = Column(
        String(50), default="output_true"
    )  # output_true | output_false | output_custom
    label = Column(String(255), nullable=True)
    condition = Column(JSONB, nullable=True)  # 连线上的条件（编辑器辅助）

    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    project = relationship("Project", back_populates="edges")
