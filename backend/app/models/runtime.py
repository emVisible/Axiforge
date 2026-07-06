
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class RuntimeSession(Base):
    """一次剧本游玩会话"""

    __tablename__ = "runtime_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(String(20), default="active")
    current_node_id = Column(UUID(as_uuid=True), nullable=True)
    player_name = Column(String(255), nullable=True)
    state = Column(JSONB, default=dict)
    started_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SessionEvent(Base):
    """会话中已触发的事件记录"""

    __tablename__ = "session_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("runtime_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    node_id = Column(UUID(as_uuid=True), nullable=True)
    choice_label = Column(String(255), nullable=True)
    narrative_text = Column(Text, nullable=True)
    speaker_character_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionMemory(Base):
    """会话记忆条目"""

    __tablename__ = "session_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("runtime_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    node_id = Column(UUID(as_uuid=True), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionFlag(Base):
    """会话全局标志"""

    __tablename__ = "session_flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("runtime_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CharacterRuntimeState(Base):
    """角色运行时状态——VN 视角的核心数据结构"""

    __tablename__ = "character_runtime_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("runtime_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    character_id = Column(UUID(as_uuid=True), nullable=False)
    character_name = Column(String(255), nullable=False)

    # VN 表现层
    current_expression = Column(String(50), default="neutral")  # 立绘表情
    current_position = Column(String(50), default="center")  # 立绘位置
    current_pose = Column(String(50), default="idle")  # 姿势
    outfit = Column(String(100), nullable=True)  # 当前服装

    # 叙事状态
    mood = Column(String(50), default="neutral")
    affection = Column(Integer, default=0)  # 好感度 -100 ~ 100
    relationship_tags = Column(JSONB, default=list)  # 动态关系标签
    location = Column(String(255), nullable=True)

    # 自定义扩展
    custom_state = Column(JSONB, default=dict)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
