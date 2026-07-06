
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base

# ============================================================
# 场景资产
# ============================================================


class AssetScene(Base):
    """全局场景资产池——世界观场景模板"""

    __tablename__ = "asset_scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    location = Column(String(255), nullable=True)
    atmosphere = Column(Text, nullable=True)
    era = Column(String(100), nullable=True)
    world_setting = Column(Text, nullable=True)
    rules = Column(Text, nullable=True)
    tags = Column(JSONB, default=list)

    # 场景预设的节点模板（可被引用剧本导入）
    node_templates = Column(JSONB, default=list)

    image_path = Column(String(500), nullable=True)
    author_id = Column(String(255), default="anonymous")
    is_public = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    fork_from_id = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================
# 道具资产
# ============================================================


class AssetItem(Base):
    """全局道具资产池"""

    __tablename__ = "asset_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), nullable=False, default="日常")
    rarity = Column(String(20), default="普通")
    mechanism_tags = Column(JSONB, default=list)
    effects = Column(JSONB, default=list)
    image_path = Column(String(500), nullable=True)

    author_id = Column(String(255), default="anonymous")
    is_public = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
