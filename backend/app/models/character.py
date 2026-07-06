from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base
from app.models.tag import character_tags


class Character(Base):
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    author_id = Column(String(255), nullable=False, default="anonymous")
    character_data = Column(JSONB, nullable=False)
    is_public = Column(Boolean, default=False)
    image_path = Column(String(500), nullable=True)
    fork_from = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = relationship("Tag", secondary=character_tags, back_populates="characters")
    view_count = Column(Integer, default=0)
