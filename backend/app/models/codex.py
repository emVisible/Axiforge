
from datetime import datetime
from sqlalchemy import Column, String, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class PlayerCodexEntry(Base):
    """跨作品 IP 账本条目（桥4 第三层，ADR-011 v1.6）

    绑定 player_token + character_ref_id + key，跨剧本持久化角色对玩家的记忆。
    """

    __tablename__ = "player_codex_entries"
    __table_args__ = (
        UniqueConstraint(
            "player_token",
            "character_ref_id",
            "key",
            name="uq_player_codex_entry",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_token = Column(String(64), nullable=False, index=True)
    character_ref_id = Column(String(64), nullable=False, index=True)
    key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=False, default=dict)
    source_project_id = Column(UUID(as_uuid=True), nullable=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
