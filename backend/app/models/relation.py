from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database import Base


class CharacterRelation(Base):
    __tablename__ = "character_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String(20), nullable=False, default="custom")  # "preset" | "custom"
    relation_name = Column(String(50), nullable=False)  # 关系名：师徒、宿敌、暗恋...
    description = Column(Text, nullable=True)
    is_mutual = Column(Boolean, default=False)  # 是否双向
    created_at = Column(DateTime, default=datetime.utcnow)