from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class CharacterVersion(Base):
    __tablename__ = "character_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    character_data = Column(JSONB, nullable=False)
    name = Column(String(255), nullable=False)
    tags_json = Column(JSONB, default=list)
    change_summary = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)