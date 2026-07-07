from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import (
    UserProfileResponse,
    UserProfileUpdate,
    UserResolveResponse,
    UserSessionRequest,
)
from app.services.user import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/session", response_model=UserProfileResponse)
async def user_session(data: UserSessionRequest, db: AsyncSession = Depends(get_db)):
    """客户端启动时上报 creator_id + player_token，获取/创建统一用户档案。"""
    return await UserService(db).get_or_create_session(data)


@router.get("/session", response_model=UserProfileResponse)
async def get_user_session(
    creator_id: str = Query(..., min_length=8),
    player_token: str = Query(..., min_length=8),
    db: AsyncSession = Depends(get_db),
):
    profile = await UserService(db).get_or_create_session(
        UserSessionRequest(creator_id=creator_id, player_token=player_token)
    )
    return profile


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    data: UserProfileUpdate, db: AsyncSession = Depends(get_db)
):
    return await UserService(db).update_profile(data)


@router.get("/resolve", response_model=UserResolveResponse)
async def resolve_user_by_email(
    email: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db),
):
    profiles = await UserService(db).resolve_by_email(email)
    return UserResolveResponse(email=email.lower(), profiles=profiles)
