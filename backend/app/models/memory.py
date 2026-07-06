from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class SessionMemory(Base):
    """会话中的记忆条目——每个已完成的节点产生一条记忆"""

    __tablename__ = "session_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("script_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    node_id = Column(UUID(as_uuid=True), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionFlag(Base):
    """会话中的全局标志"""

    __tablename__ = "session_flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("script_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CharacterState(Base):
    """会话中角色的运行时状态"""

    __tablename__ = "character_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("script_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    character_id = Column(UUID(as_uuid=True), nullable=False)
    state = Column(
        JSONB, default=dict
    )  # { "mood": "angry", "location": "工厂", "alive": true }
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
