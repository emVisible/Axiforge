
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
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
    ProjectAssetRefCreate,
    ProjectAssetRefResponse,
)
from ...services.project import ProjectService

router = APIRouter(prefix="/api/v1/editor/projects", tags=["editor-projects"])


# ================================================================
# Project
# ================================================================


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    return await ProjectService(db).create(data)


@router.get("/public", response_model=List[ProjectResponse])
async def list_public(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).list_public(skip, limit)


@router.get("/user/{author_id}", response_model=List[ProjectResponse])
async def list_user(author_id: str, db: AsyncSession = Depends(get_db)):
    return await ProjectService(db).list_user(author_id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    project = await ProjectService(db).get(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService(db).update(project_id, data)
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    if not await ProjectService(db).delete(project_id):
        raise HTTPException(404, "Project not found")


# ================================================================
# Scene
# ================================================================


@router.post(
    "/{project_id}/scenes", response_model=ProjectSceneResponse, status_code=201
)
async def add_scene(
    project_id: UUID,
    data: ProjectSceneCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_scene(project_id, data)


@router.put("/{project_id}/scenes/{scene_id}", response_model=ProjectSceneResponse)
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


@router.delete("/{project_id}/scenes/{scene_id}", status_code=204)
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


@router.post(
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
    return await ProjectService(db).add_node(scene_id, data)


@router.put(
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


@router.delete("/{project_id}/scenes/{scene_id}/nodes/{node_id}", status_code=204)
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


@router.post("/{project_id}/roles", response_model=ProjectRoleResponse, status_code=201)
async def add_role(
    project_id: UUID,
    data: ProjectRoleCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_role(project_id, data)


@router.put("/{project_id}/roles/{role_id}", response_model=ProjectRoleResponse)
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


@router.delete("/{project_id}/roles/{role_id}", status_code=204)
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


@router.post(
    "/{project_id}/assets", response_model=ProjectAssetRefResponse, status_code=201
)
async def add_asset_ref(
    project_id: UUID,
    data: ProjectAssetRefCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_asset_ref(project_id, data)


@router.delete("/{project_id}/assets/{ref_id}", status_code=204)
async def remove_asset_ref(
    project_id: UUID,
    ref_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    if not await ProjectService(db).remove_asset_ref(ref_id):
        raise HTTPException(404, "AssetRef not found")


# ================================================================
# Edge
# ================================================================


@router.post("/{project_id}/edges", response_model=List[ProjectEdgeResponse])
async def save_edges(
    project_id: UUID,
    edges: List[ProjectEdgeCreate],
    db: AsyncSession = Depends(get_db),
):
    """批量保存连线（替换旧连线）"""
    return await ProjectService(db).update_edges_batch(project_id, edges)
