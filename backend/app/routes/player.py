
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.runtime import (
    StartSessionRequest,
    CompleteNodeRequest,
    SessionResponse,
    PlayerDrawResponse,
    SessionMemoryResponse,
    SessionFlagResponse,
    CharacterRuntimeStateResponse,
)
from app.services.player import PlayerService

router = APIRouter(prefix="/api/v1/play", tags=["player"])


# ================================================================
# 会话
# ================================================================


@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def start_session(
    data: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """开始一次新的游玩会话"""
    try:
        return await PlayerService(db).start_session(data.project_id, data.player_name)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    session = await PlayerService(db).get_session_response(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


# ================================================================
# 叙事推进
# ================================================================


@router.get("/sessions/{session_id}/draw", response_model=PlayerDrawResponse)
async def draw(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """拉取当前可用的叙事节点——VN Player 的核心轮询/触发端点"""
    try:
        return await PlayerService(db).draw(session_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/sessions/{session_id}/complete", response_model=PlayerDrawResponse)
async def complete_node(
    session_id: UUID,
    data: CompleteNodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    完成当前节点，应用效果，返回下一个可用节点。

    前端调用时机：
    - 玩家点击了分支选项（choice_label = 选项文本）
    - 玩家点击了"继续"（无分支的线性推进，choice_label = None）
    """
    try:
        return await PlayerService(db).complete(
            session_id, data.node_id, data.choice_label
        )
    except ValueError as e:
        raise HTTPException(404, str(e))


# ================================================================
# 状态查询（调试/存档面板用）
# ================================================================


@router.get(
    "/sessions/{session_id}/memories", response_model=List[SessionMemoryResponse]
)
async def get_memories(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """获取会话的所有记忆"""
    return await PlayerService(db).get_memories(session_id)


@router.get("/sessions/{session_id}/flags", response_model=List[SessionFlagResponse])
async def get_flags(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """获取会话的所有全局标志"""
    return await PlayerService(db).get_flags(session_id)


@router.get(
    "/sessions/{session_id}/characters",
    response_model=List[CharacterRuntimeStateResponse],
)
async def get_character_states(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """获取会话中所有角色的运行时状态"""
    return await PlayerService(db).get_character_states(session_id)
