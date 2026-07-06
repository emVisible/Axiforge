from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base

character_tags = Table(
    "character_tags",
    Base.metadata,
    Column(
        "character_id",
        UUID(as_uuid=True),
        ForeignKey("characters.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), nullable=False)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    characters = relationship(
        "Character", secondary=character_tags, back_populates="tags"
    )
