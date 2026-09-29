# --- from routes/editor/project.py ---

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import Page
from app.database import get_db
from app.domains.narrative.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectForkRequest,
    ProjectSceneCreate,
    ProjectSceneUpdate,
    ProjectSceneResponse,
    ProjectNodeCreate,
    ProjectNodeUpdate,
    ProjectNodeResponse,
    ProjectRoleCreate,
    ProjectRoleUpdate,
    ProjectRoleResponse,
    ProjectEdgeCreate,
    ProjectEdgeResponse,
    NarrativeSyncRequest,
    ProjectAssetRefCreate,
    ProjectAssetRefResponse,
)
from app.domains.narrative.service import ProjectService

editor_project_router = APIRouter(prefix="/api/v1/editor/projects", tags=["editor-projects"])


# ================================================================
# Project
# ================================================================


@editor_project_router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    return await ProjectService(db).create(data)


@editor_project_router.get("/templates", response_model=List[ProjectResponse])
async def list_templates(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """公开示范作 / 元剧本列表（从模板创建）"""
    return await ProjectService(db).list_templates(skip, limit)


@editor_project_router.post("/seed/showcase")
async def seed_showcase(db: AsyncSession = Depends(get_db)):
    """创建官方 3 部示范作（幂等）"""
    from app.domains.narrative.seed_showcase import seed_all_showcases

    return await seed_all_showcases(db)


@editor_project_router.post("/{project_id}/fork", response_model=ProjectResponse, status_code=201)
async def fork_project(
    project_id: UUID,
    data: ProjectForkRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        forked = await ProjectService(db).fork_project(
            project_id, data.author_id, data.new_title
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not forked:
        raise HTTPException(404, "Project not found")
    return forked


@editor_project_router.get("/public", response_model=List[ProjectResponse])
async def list_public(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).list_public(skip, limit)


@editor_project_router.get("/discover", response_model=Page[ProjectResponse])
async def discover_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """带搜索与总数的公开作品分页查询，供 Discover 多标签浏览使用。"""
    return await ProjectService(db).search_public(skip=skip, limit=limit, search=search)


@editor_project_router.get("/user/{author_id}", response_model=List[ProjectResponse])
async def list_user(author_id: str, db: AsyncSession = Depends(get_db)):
    return await ProjectService(db).list_user(author_id)


@editor_project_router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    bump_view: bool = Query(False),
    viewer_token: Optional[str] = Query(None, max_length=128),
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService(db).get(
        project_id, bump_view=bump_view, viewer_token=viewer_token
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@editor_project_router.post("/{project_id}/view", status_code=204)
async def record_project_view(
    project_id: UUID,
    viewer_token: Optional[str] = Query(None, max_length=128),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import Response

    if not await ProjectService(db).record_view(project_id, viewer_token=viewer_token):
        raise HTTPException(404, "Project not found or not public")
    return Response(status_code=204)


@editor_project_router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        project = await ProjectService(db).update(project_id, data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@editor_project_router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await ProjectService(db).delete(project_id):
        raise HTTPException(404, "Project not found")


@editor_project_router.put("/{project_id}/narrative", response_model=ProjectResponse)
async def sync_narrative(
    project_id: UUID,
    data: NarrativeSyncRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await ProjectService(db).sync_narrative(project_id, data)
    if not result:
        raise HTTPException(404, "Project not found")
    return result


# ================================================================
# Scene
# ================================================================


@editor_project_router.post(
    "/{project_id}/scenes", response_model=ProjectSceneResponse, status_code=201
)
async def add_scene(
    project_id: UUID,
    data: ProjectSceneCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_scene(project_id, data)


@editor_project_router.put("/{project_id}/scenes/{scene_id}", response_model=ProjectSceneResponse)
async def update_scene(
    project_id: UUID,
    scene_id: UUID,
    data: ProjectSceneUpdate,
    db: AsyncSession = Depends(get_db),
):
    scene = await ProjectService(db).update_scene(scene_id, data)
    if not scene:
        raise HTTPException(404, "Scene not found")
    return scene


@editor_project_router.delete("/{project_id}/scenes/{scene_id}", status_code=204)
async def delete_scene(
    project_id: UUID,
    scene_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    if not await ProjectService(db).delete_scene(scene_id):
        raise HTTPException(404, "Scene not found")


# ================================================================
# Node
# ================================================================


@editor_project_router.post(
    "/{project_id}/scenes/{scene_id}/nodes",
    response_model=ProjectNodeResponse,
    status_code=201,
)
async def add_node(
    project_id: UUID,
    scene_id: UUID,
    data: ProjectNodeCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_node_to_stage(scene_id, data)


@editor_project_router.post(
    "/{project_id}/nodes",
    response_model=ProjectNodeResponse,
    status_code=201,
)
async def add_project_node(
    project_id: UUID,
    data: ProjectNodeCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_node(project_id, data)


@editor_project_router.put(
    "/{project_id}/scenes/{scene_id}/nodes/{node_id}",
    response_model=ProjectNodeResponse,
)
async def update_node(
    project_id: UUID,
    scene_id: UUID,
    node_id: UUID,
    data: ProjectNodeUpdate,
    db: AsyncSession = Depends(get_db),
):
    node = await ProjectService(db).update_node(node_id, data)
    if not node:
        raise HTTPException(404, "Node not found")
    return node


@editor_project_router.delete("/{project_id}/scenes/{scene_id}/nodes/{node_id}", status_code=204)
async def delete_node(
    project_id: UUID,
    scene_id: UUID,
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    if not await ProjectService(db).delete_node(node_id):
        raise HTTPException(404, "Node not found")


# ================================================================
# Role
# ================================================================


@editor_project_router.post("/{project_id}/roles", response_model=ProjectRoleResponse, status_code=201)
async def add_role(
    project_id: UUID,
    data: ProjectRoleCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_role(project_id, data)


@editor_project_router.put("/{project_id}/roles/{role_id}", response_model=ProjectRoleResponse)
async def update_role(
    project_id: UUID,
    role_id: UUID,
    data: ProjectRoleUpdate,
    db: AsyncSession = Depends(get_db),
):
    role = await ProjectService(db).update_role(role_id, data)
    if not role:
        raise HTTPException(404, "Role not found")
    return role


@editor_project_router.delete("/{project_id}/roles/{role_id}", status_code=204)
async def remove_role(
    project_id: UUID,
    role_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    if not await ProjectService(db).remove_role(role_id):
        raise HTTPException(404, "Role not found")


# ================================================================
# AssetRef
# ================================================================


@editor_project_router.post(
    "/{project_id}/assets", response_model=ProjectAssetRefResponse, status_code=201
)
async def add_asset_ref(
    project_id: UUID,
    data: ProjectAssetRefCreate,
    db: AsyncSession = Depends(get_db),
):
    created = await ProjectService(db).add_asset_ref(project_id, data)
    if created is None:
        raise HTTPException(404, "Project not found")
    return created


@editor_project_router.delete("/{project_id}/assets/{ref_id}", status_code=204)
async def remove_asset_ref(
    project_id: UUID,
    ref_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    if not await ProjectService(db).remove_asset_ref(project_id, ref_id):
        raise HTTPException(404, "AssetRef not found")


# ================================================================
# Edge
# ================================================================


@editor_project_router.post("/{project_id}/edges", response_model=List[ProjectEdgeResponse])
async def save_edges(
    project_id: UUID,
    edges: List[ProjectEdgeCreate],
    db: AsyncSession = Depends(get_db),
):
    """批量保存连线（替换旧连线）"""
    return await ProjectService(db).update_edges_batch(project_id, edges)

# --- from routes/editor/ai.py ---
from fastapi import APIRouter, HTTPException

from app.domains.llm import service as llm_service
from app.domains.narrative.schemas import (
    CharacterSuggestRequest,
    CharacterSuggestResponse,
    ProseToAxsRequest,
    ProseToAxsResponse,
    ProseToScriptRequest,
    ProseToScriptResponse,
)

editor_ai_router = APIRouter(prefix="/api/v1/editor/ai", tags=["editor-ai"])


@editor_ai_router.post("/prose-to-script", response_model=ProseToScriptResponse)
async def ai_prose_to_script(body: ProseToScriptRequest):
    try:
        result = await llm_service.prose_to_script_with_source(
            prose=body.prose,
            role_names=body.role_names,
            author_id=body.author_id,
        )
    except ValueError as exc:
        raise HTTPException(429, str(exc)) from exc
    return ProseToScriptResponse(**result)


@editor_ai_router.post("/prose-to-axs", response_model=ProseToAxsResponse)
async def ai_prose_to_axs(body: ProseToAxsRequest):
    try:
        result = await llm_service.prose_to_axs_with_source(
            prose=body.prose,
            title=body.title,
            role_names=body.role_names,
            default_speaker=body.default_speaker,
            author_id=body.author_id,
        )
    except ValueError as exc:
        raise HTTPException(429, str(exc)) from exc
    return ProseToAxsResponse(**result)


@editor_ai_router.post("/suggest-character", response_model=CharacterSuggestResponse)
async def ai_suggest_character(body: CharacterSuggestRequest):
    try:
        result = await llm_service.suggest_character(
            name=body.name,
            essence=body.essence,
            tags=body.tags,
            author_id=body.author_id,
        )
    except ValueError as exc:
        raise HTTPException(429, str(exc)) from exc
    return CharacterSuggestResponse(**result)

routers = [editor_project_router, editor_ai_router]
