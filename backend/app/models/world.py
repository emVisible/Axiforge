from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class WorldSceneNode(Base):
    __tablename__ = "world_scene_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scene_id = Column(
        UUID(as_uuid=True),
        ForeignKey("world_scenes.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    is_anchor = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    trigger_condition = Column(JSONB, nullable=True)
    effects = Column(JSONB, nullable=True)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)


class WorldScene(Base):
    __tablename__ = "world_scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    location = Column(String(255), nullable=True)
    atmosphere = Column(Text, nullable=True)  # 氛围描述
    era = Column(String(100), nullable=True)  # 时代
    tags = Column(JSONB, default=list)
    world_setting = Column(Text, nullable=True)  # 所属世界观
    rules = Column(Text, nullable=True)  # 场景规则
    image_path = Column(String(500), nullable=True)
    author_id = Column(String(255), default="anonymous")
    is_public = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    nodes = relationship(
        "WorldSceneNode", back_populates="scene", cascade="all, delete-orphan"
    )


WorldSceneNode.scene = relationship("WorldScene", back_populates="nodes")
