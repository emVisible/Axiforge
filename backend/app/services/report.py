from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import ContentReport
from app.schemas.report import ReportCreate, ReportResponse


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ReportCreate) -> ReportResponse:
        row = ContentReport(
            target_type=data.target_type,
            target_id=data.target_id,
            reason=data.reason.strip(),
            reporter_token=data.reporter_token,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return ReportResponse.model_validate(row)
