"""管理中台 API 路由（Bearer ADMIN_TOKEN）。"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_auth import require_admin
from app.database import get_db
from app.domains.platform.admin_schemas import (
    AdminCharacterResponse,
    AdminProjectResponse,
    AdminReportResponse,
    AdminUserResponse,
    AdminViolationResponse,
    AuditLogResponse,
    ContentStatusUpdate,
    DashboardStatsResponse,
    ModerationContextResponse,
    PaginatedResponse,
    ReportResolveRequest,
    UserBanUpdate,
    UserStrikeUpdate,
)
from app.domains.platform.admin_service import AdminService

admin_router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@admin_router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def admin_dashboard_stats(db: AsyncSession = Depends(get_db)):
    return await AdminService(db).dashboard_stats()


@admin_router.get("/reports", response_model=List[AdminReportResponse])
async def admin_list_reports(
    status: str = Query("pending"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).list_reports(status=status, limit=limit)


@admin_router.post("/reports/{report_id}/resolve", response_model=AdminReportResponse)
async def admin_resolve_report(
    report_id: UUID,
    data: ReportResolveRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await AdminService(db).resolve_report(report_id, data)
    if not result:
        raise HTTPException(404, "Report not found")
    return result


@admin_router.get("/moderation/context", response_model=ModerationContextResponse)
async def admin_moderation_context(
    target_type: str = Query(..., min_length=1),
    target_id: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).get_moderation_context(
        target_type=target_type, target_id=target_id
    )


@admin_router.post("/comments/{comment_id}/hide", status_code=204)
async def admin_hide_comment(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    if not await AdminService(db).hide_comment(comment_id):
        raise HTTPException(404, "Comment not found")
    return None


@admin_router.get("/users", response_model=PaginatedResponse[AdminUserResponse])
async def admin_list_users(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    creator_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).list_users(
        limit=limit, offset=offset, creator_id=creator_id, q=q
    )


@admin_router.patch("/users/{user_id}/ban", response_model=AdminUserResponse)
async def admin_set_user_ban(
    user_id: UUID,
    data: UserBanUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await AdminService(db).set_user_ban(
        user_id, is_banned=data.is_banned, note=data.note
    )
    if not result:
        raise HTTPException(404, "User not found")
    return result


@admin_router.patch("/users/{user_id}/strikes", response_model=AdminUserResponse)
async def admin_set_user_strikes(
    user_id: UUID,
    data: UserStrikeUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await AdminService(db).set_user_strikes(
        user_id, strike_count=data.strike_count, note=data.note
    )
    if not result:
        raise HTTPException(404, "User not found")
    return result


@admin_router.get("/projects", response_model=PaginatedResponse[AdminProjectResponse])
async def admin_list_projects(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    content_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).list_projects(
        limit=limit, offset=offset, q=q, content_status=content_status
    )


@admin_router.patch("/projects/{project_id}/status", response_model=AdminProjectResponse)
async def admin_update_project_status(
    project_id: UUID,
    data: ContentStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await AdminService(db).update_project_status(
        project_id, data.content_status
    )
    if not result:
        raise HTTPException(404, "Project not found")
    return result


@admin_router.get("/characters", response_model=PaginatedResponse[AdminCharacterResponse])
async def admin_list_characters(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    content_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).list_characters(
        limit=limit, offset=offset, q=q, content_status=content_status
    )


@admin_router.patch(
    "/characters/{character_id}/status", response_model=AdminCharacterResponse
)
async def admin_update_character_status(
    character_id: UUID,
    data: ContentStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await AdminService(db).update_character_status(
        character_id, data.content_status
    )
    if not result:
        raise HTTPException(404, "Character not found")
    return result


@admin_router.get("/violations", response_model=PaginatedResponse[AdminViolationResponse])
async def admin_list_violations(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    creator_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).list_violations(
        limit=limit, offset=offset, creator_id=creator_id
    )


@admin_router.get("/audit-logs", response_model=PaginatedResponse[AuditLogResponse])
async def admin_list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None, min_length=1, max_length=80),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).list_audit_logs(limit=limit, offset=offset, action=action)
