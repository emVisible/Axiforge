from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report import ReportService

router = APIRouter(prefix="/api/v1/report", tags=["report"])


@router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(data: ReportCreate, db: AsyncSession = Depends(get_db)):
    """公开内容举报占位（ADR-003）：记录入库，暂无审核流程。"""
    return await ReportService(db).create(data)
