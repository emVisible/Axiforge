from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), nullable=False, default="日常")  # 日常/魔幻/科技/关键道具
    rarity = Column(String(20), default="普通")  # 普通/稀有/传说
    effects = Column(JSONB, default=list)  # 效果标签
    image_path = Column(String(500), nullable=True)
    author_id = Column(String(255), default="anonymous")
    is_public = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)