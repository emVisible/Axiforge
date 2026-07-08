"""审计日志写入辅助。"""

from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.platform.models import AuditLog


async def write_audit_log(
    db: AsyncSession,
    *,
    action: str,
    actor: str = "admin",
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    detail: Optional[dict[str, Any]] = None,
) -> None:
    db.add(
        AuditLog(
            action=action,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
            detail=detail or {},
        )
    )
