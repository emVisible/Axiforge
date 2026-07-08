# --- from routes/user.py ---
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.platform.schemas import (
    AuthorPublicResponse,
    UserProfileResponse,
    UserProfileUpdate,
    UserResolveResponse,
    UserSessionRequest,
    UserDataExportRequest,
    UserDataExportResponse,
    UserAccountDeleteRequest,
)
from app.domains.platform.service import UserService

user_router = APIRouter(prefix="/api/v1/users", tags=["users"])


@user_router.post("/session", response_model=UserProfileResponse)
async def user_session(data: UserSessionRequest, db: AsyncSession = Depends(get_db)):
    """客户端启动时上报 creator_id + player_token，获取/创建统一用户档案。"""
    return await UserService(db).get_or_create_session(data)


@user_router.get("/session", response_model=UserProfileResponse)
async def get_user_session(
    creator_id: str = Query(..., min_length=8),
    player_token: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    profile = await UserService(db).get_or_create_session(
        UserSessionRequest(creator_id=creator_id, player_token=player_token)
    )
    return profile


@user_router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    data: UserProfileUpdate, db: AsyncSession = Depends(get_db)
):
    return await UserService(db).update_profile(data)


@user_router.get("/resolve", response_model=UserResolveResponse)
async def resolve_user_by_email(
    email: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db),
):
    profiles = await UserService(db).resolve_by_email(email)
    return UserResolveResponse(email=email.lower(), profiles=profiles)


@user_router.get("/author/{creator_id}", response_model=AuthorPublicResponse)
async def get_author_public(creator_id: str, db: AsyncSession = Depends(get_db)):
    return await UserService(db).get_author_public(creator_id)


@user_router.post("/export", response_model=UserDataExportResponse)
async def export_user_data(
    data: UserDataExportRequest, db: AsyncSession = Depends(get_db)
):
    """GDPR 风格数据导出（需 creator_id + player_token 双因子）。"""
    bundle = await UserService(db).export_data(data.creator_id, data.player_token)
    if not bundle:
        from fastapi import HTTPException

        raise HTTPException(404, "User not found")
    return bundle


@user_router.delete("/account", status_code=204)
async def delete_user_account(
    data: UserAccountDeleteRequest, db: AsyncSession = Depends(get_db)
):
    """注销账号（删除档案与身份绑定，作品/角色保留）。"""
    from fastapi import HTTPException, Response

    if not await UserService(db).delete_account(data.creator_id, data.player_token):
        raise HTTPException(404, "User not found")
    return Response(status_code=204)

# --- from routes/identity.py ---
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.platform.schemas import (
    IdentityLinkResponse,
    LinkEmailRequest,
    ResolveEmailResponse,
)
from app.domains.platform.service import IdentityService

identity_router = APIRouter(prefix="/api/v1/identity", tags=["identity"])


@identity_router.post("/link-email", response_model=IdentityLinkResponse)
async def link_email(data: LinkEmailRequest, db: AsyncSession = Depends(get_db)):
    return await IdentityService(db).link_email(data)


@identity_router.get("/resolve", response_model=ResolveEmailResponse)
async def resolve_email(
    email: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db),
):
    links = await IdentityService(db).resolve_by_email(email)
    return ResolveEmailResponse(email=email.lower(), links=links)

# --- from routes/report.py ---
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domains.platform.schemas import ReportCreate, ReportResponse
from app.domains.platform.service import ReportService

report_router = APIRouter(prefix="/api/v1/report", tags=["report"])


@report_router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(data: ReportCreate, db: AsyncSession = Depends(get_db)):
    """公开内容举报占位（ADR-003）：记录入库，暂无审核流程。"""
    return await ReportService(db).create(data)

routers = [user_router, identity_router, report_router]

from app.domains.platform.creator_router import creator_router  # noqa: E402
from app.domains.platform.comment_router import comment_router  # noqa: E402

routers.append(creator_router)
routers.append(comment_router)
