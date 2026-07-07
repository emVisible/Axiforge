from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.identity import (
    IdentityLinkResponse,
    LinkEmailRequest,
    ResolveEmailResponse,
)
from app.services.identity import IdentityService

router = APIRouter(prefix="/api/v1/identity", tags=["identity"])


@router.post("/link-email", response_model=IdentityLinkResponse)
async def link_email(data: LinkEmailRequest, db: AsyncSession = Depends(get_db)):
    return await IdentityService(db).link_email(data)


@router.get("/resolve", response_model=ResolveEmailResponse)
async def resolve_email(
    email: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db),
):
    links = await IdentityService(db).resolve_by_email(email)
    return ResolveEmailResponse(email=email.lower(), links=links)
