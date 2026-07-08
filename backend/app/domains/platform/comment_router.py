"""Comment REST API."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.platform.comment_schemas import (
    CommentCreate,
    CommentListResponse,
    CommentReportRequest,
    CommentResponse,
)
from app.domains.platform.comment_service import CommentService
from app.domains.platform.schemas import ReportResponse

comment_router = APIRouter(prefix="/api/v1/comments", tags=["comments"])


@comment_router.get("", response_model=CommentListResponse)
async def list_comments(
    content_type: str = Query(..., pattern="^(project|character|item|scene)$"),
    content_id: str = Query(..., min_length=1, max_length=64),
    sort: str = Query("recent", pattern="^(recent|hot)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await CommentService(db).list_comments(
        content_type=content_type,
        content_id=content_id,
        sort=sort,
        skip=skip,
        limit=limit,
    )


@comment_router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(data: CommentCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await CommentService(db).create(data)
    except ValueError as exc:
        msg = str(exc)
        status = 429 if "频繁" in msg else 400
        raise HTTPException(status, msg) from exc


@comment_router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: UUID,
    author_id: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    if not await CommentService(db).delete(comment_id, author_id):
        raise HTTPException(404, "Comment not found or not authorized")
    return None


@comment_router.post("/{comment_id}/report", response_model=ReportResponse, status_code=201)
async def report_comment(
    comment_id: UUID,
    body: CommentReportRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        report = await CommentService(db).report(
            comment_id,
            reason=body.reason,
            reporter_token=body.reporter_token,
        )
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    return ReportResponse(
        id=report.id,
        target_type=report.target_type,
        target_id=report.target_id,
        reason=report.reason,
        created_at=report.created_at,
    )
