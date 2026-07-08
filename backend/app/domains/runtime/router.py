# --- from routes/player.py ---

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.story_cache import story_cache
from app.domains.narrative.models import Project
from app.domains.platform.events import record_event
from app.domains.runtime.schemas import (
    StartSessionRequest,
    CompleteNodeRequest,
    SessionResponse,
    PlayerDrawResponse,
    SessionMemoryResponse,
    SessionFlagResponse,
    CharacterRuntimeStateResponse,
)
from app.domains.narrative.ir import StoryPackage
from app.domains.runtime.schemas import SaveSlotUpsert, SaveSlotResponse
from app.domains.runtime.service import PlayerService
from app.domains.narrative.compiler import StoryCompiler
from app.domains.runtime.save_service import SaveService
from app.domains.narrative.service import ProjectService
from app.domains.runtime.schemas import CodexUpsert, CodexResponse
from app.domains.runtime.codex_service import CodexService

player_router = APIRouter(prefix="/api/v1/play", tags=["player"])


# ================================================================
# Story Package（编译 IR，ADR-008）
# ================================================================


@player_router.get("/story/{project_id}", response_model=StoryPackage)
async def get_story_package(
    project_id: UUID,
    response: Response,
    author_id: Optional[str] = None,
    if_none_match: Optional[str] = Header(None, alias="If-None-Match"),
    db: AsyncSession = Depends(get_db),
):
    """把剧本编译为可移植的 StoryPackage IR，供 @axiforge/core 引擎本地播放。"""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    etag = story_cache.etag_for(str(project_id), project.updated_at)
    if if_none_match and etag in if_none_match.strip('"'):
        return Response(status_code=304, headers={"ETag": f'"{etag}"'})

    cached = story_cache.get(str(project_id), etag)
    if cached:
        response.headers["ETag"] = f'"{etag}"'
        await ProjectService(db).increment_play_count(project_id, actor_token=author_id)
        await record_event(
            db,
            "story_play",
            subject_type="project",
            subject_id=str(project_id),
            actor_token=author_id,
        )
        await db.commit()
        return StoryPackage.model_validate(cached)

    try:
        pkg = await StoryCompiler(db).compile(project_id, author_id=author_id)
        story_cache.set(str(project_id), etag, pkg.model_dump(mode="json"))
        response.headers["ETag"] = f'"{etag}"'
        await ProjectService(db).increment_play_count(project_id, actor_token=author_id)
        await record_event(
            db,
            "story_play",
            subject_type="project",
            subject_id=str(project_id),
            actor_token=author_id,
        )
        await db.commit()
        return pkg
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except ValueError as e:
        raise HTTPException(404, str(e))


# ================================================================
# 存档槽（桥4 第二层·持久记忆，ADR-011）
# ================================================================


@player_router.get("/save/{project_id}/list", response_model=List[SaveSlotResponse])
async def list_saves(
    project_id: UUID,
    player_token: str,
    db: AsyncSession = Depends(get_db),
):
    """列出玩家在某作品下的全部存档槽。"""
    return await SaveService(db).list_saves(project_id, player_token)


@player_router.put("/save/{project_id}", response_model=SaveSlotResponse)
async def upsert_save(
    project_id: UUID,
    data: SaveSlotUpsert,
    db: AsyncSession = Depends(get_db),
):
    """写入/覆盖存档槽（单槽自动存档）。存整份 RuntimeState，跨会话存活。"""
    try:
        return await SaveService(db).upsert(project_id, data)
    except ValueError as e:
        raise HTTPException(404, str(e))


@player_router.get("/save/{project_id}", response_model=SaveSlotResponse)
async def get_save(
    project_id: UUID,
    player_token: str,
    slot: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """读取存档槽；无存档返回 404。"""
    save = await SaveService(db).get(project_id, player_token, slot)
    if not save:
        raise HTTPException(404, "No save found")
    return save


@player_router.delete("/save/{project_id}", status_code=204)
async def clear_save(
    project_id: UUID,
    player_token: str,
    slot: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """删除存档槽（从头开始时清档）。"""
    await SaveService(db).clear(project_id, player_token, slot)
    return Response(status_code=204)


# ================================================================
# 跨作品 IP 账本（桥4 第三层，ADR-011 v1.6）
# ================================================================


@player_router.get("/codex", response_model=CodexResponse)
async def get_codex(
    player_token: str,
    character_ids: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """读取玩家跨作品角色记忆账本。character_ids 逗号分隔，可选过滤。"""
    ids = (
        [x.strip() for x in character_ids.split(",") if x.strip()]
        if character_ids
        else None
    )
    ledger = await CodexService(db).get_ledger(player_token, ids)
    return CodexResponse(ledger=ledger)


@player_router.put("/codex", response_model=CodexResponse)
async def upsert_codex(
    data: CodexUpsert,
    db: AsyncSession = Depends(get_db),
):
    """合并写入跨作品记忆（仅提交变更的 character/key 桶）。"""
    await CodexService(db).upsert_entries(
        data.player_token,
        data.ledger,
        data.source_project_id,
    )
    ledger = await CodexService(db).get_ledger(data.player_token)
    return CodexResponse(ledger=ledger)


# ================================================================
# 会话
# ================================================================


@player_router.post("/sessions", response_model=SessionResponse, status_code=201)
async def start_session(
    data: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """开始一次新的游玩会话"""
    try:
        return await PlayerService(db).start_session(data.project_id, data.player_name)
    except ValueError as e:
        raise HTTPException(404, str(e))


@player_router.get("/sessions/{session_id}", response_model=SessionResponse)
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


@player_router.get("/sessions/{session_id}/draw", response_model=PlayerDrawResponse)
async def draw(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """拉取当前可用的叙事节点——VN Player 的核心轮询/触发端点"""
    try:
        return await PlayerService(db).draw(session_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@player_router.post("/sessions/{session_id}/complete", response_model=PlayerDrawResponse)
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


@player_router.get(
    "/sessions/{session_id}/memories", response_model=List[SessionMemoryResponse]
)
async def get_memories(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """获取会话的所有记忆"""
    return await PlayerService(db).get_memories(session_id)


@player_router.get("/sessions/{session_id}/flags", response_model=List[SessionFlagResponse])
async def get_flags(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """获取会话的所有全局标志"""
    return await PlayerService(db).get_flags(session_id)


@player_router.get(
    "/sessions/{session_id}/characters",
    response_model=List[CharacterRuntimeStateResponse],
)
async def get_character_states(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """获取会话中所有角色的运行时状态"""
    return await PlayerService(db).get_character_states(session_id)

routers = [player_router]
