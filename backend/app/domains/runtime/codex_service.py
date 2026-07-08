# --- from services/codex.py ---
"""跨作品 IP 账本（Player Codex）服务"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.runtime.models import PlayerCodexEntry


class CodexService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_ledger(
        self,
        player_token: str,
        character_ref_ids: Optional[List[str]] = None,
    ) -> Dict[str, Dict[str, Any]]:
        """返回 { characterRefId: { key: value } } 结构，对齐 @axiforge/core CodexLedger。"""
        q = select(PlayerCodexEntry).where(
            PlayerCodexEntry.player_token == player_token
        )
        if character_ref_ids:
            q = q.where(
                PlayerCodexEntry.character_ref_id.in_(character_ref_ids)
            )
        rows = (await self.db.execute(q)).scalars().all()
        ledger: Dict[str, Dict[str, Any]] = {}
        for row in rows:
            bucket = ledger.setdefault(row.character_ref_id, {})
            bucket[row.key] = row.value
        return ledger

    async def upsert_entries(
        self,
        player_token: str,
        ledger: Dict[str, Dict[str, Any]],
        source_project_id: Optional[UUID] = None,
    ) -> None:
        """批量写入账本（合并更新）。"""
        for char_ref, entries in ledger.items():
            for key, value in entries.items():
                existing = (
                    await self.db.execute(
                        select(PlayerCodexEntry).where(
                            PlayerCodexEntry.player_token == player_token,
                            PlayerCodexEntry.character_ref_id == char_ref,
                            PlayerCodexEntry.key == key,
                        )
                    )
                ).scalar_one_or_none()
                if existing:
                    existing.value = value
                    if source_project_id:
                        existing.source_project_id = source_project_id
                else:
                    self.db.add(
                        PlayerCodexEntry(
                            player_token=player_token,
                            character_ref_id=char_ref,
                            key=key,
                            value=value,
                            source_project_id=source_project_id,
                        )
                    )
        await self.db.commit()
