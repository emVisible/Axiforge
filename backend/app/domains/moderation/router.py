"""审核队列 API（ADR-028）。挂在既有 admin 鉴权之下：`/api/v1/admin/moderation/*`。"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_auth import require_admin
from app.database import get_db
from app.domains.moderation.schemas import CaseResponse, ResolveRequest, StatsResponse
from app.domains.moderation.service import ModerationService

moderation_router = APIRouter(
    prefix="/api/v1/admin/moderation",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


#: 处置主体标签。ADMIN_TOKEN 是共享令牌、不是身份，所以这里不能记"谁"，
#: 只能记"以管理员角色"——把它写成 token 会把密钥复制进每一行案件。
ADMIN_PRINCIPAL = "admin-role"


def _svc(db: AsyncSession) -> ModerationService:
    return ModerationService(db)


@moderation_router.get("/queue", response_model=List[CaseResponse])
async def moderation_queue(
    state: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    order: str = Query(default="risk", pattern="^(risk|new)$"),
    db: AsyncSession = Depends(get_db),
):
    return await _svc(db).queue(state=state, limit=limit, order=order)


@moderation_router.get("/stats", response_model=StatsResponse)
async def moderation_stats(db: AsyncSession = Depends(get_db)):
    return await _svc(db).stats()


@moderation_router.get("/cases/{case_id}", response_model=CaseResponse)
async def moderation_case(case_id: UUID, db: AsyncSession = Depends(get_db)):
    case = await _svc(db).get(case_id)
    if not case:
        raise HTTPException(404, "案件不存在")
    return case


@moderation_router.post("/cases/{case_id}/resolve", response_model=CaseResponse)
async def moderation_resolve(
    case_id: UUID,
    body: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    """处置人记为角色标签，不记 token 本身。

    两个方向都要避开：① 不接受请求体自报 actor——参照实现让客户端传且默认 "admin"，
    任何调用方都能冒充管理员结案；② 也不能把 `require_admin` 的返回值写进库，
    它返回的就是 Bearer token 原文，落库等于把 ADMIN_TOKEN 复制进每一行案件。
    ADR-018 的正式 RBAC 还没做，这里先记角色；等 user_accounts.role 生效时换成主体 id。
    """
    case = await _svc(db).resolve(
        case_id, outcome=body.outcome, actor=ADMIN_PRINCIPAL, note=body.note
    )
    if not case:
        raise HTTPException(404, "案件不存在")
    return case


@moderation_router.post("/cases/{case_id}/reopen", response_model=CaseResponse)
async def moderation_reopen(
    case_id: UUID,
    note: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    case = await _svc(db).reopen(case_id, actor=ADMIN_PRINCIPAL, note=note)
    if not case:
        raise HTTPException(404, "案件不存在")
    return case
