
import copy
from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.models.project import (
    Project,
    ProjectScene,
    ProjectNode,
    ProjectRole,
    ProjectAssetRef,
    ProjectEdge,
)
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


class ProjectService:
    """剧本编辑器服务——CRUD + 结构化查询"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ================================================================
    # Project CRUD
    # ================================================================

    async def _load_project(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes).selectinload(ProjectScene.nodes),
                selectinload(Project.roles),
                selectinload(Project.asset_refs),
                selectinload(Project.edges),
            )
            .where(Project.id == project_id)
        )
        return result.scalars().first()

    async def create(self, data: ProjectCreate) -> ProjectResponse:
        project = Project(**data.model_dump())
        self.db.add(project)
        await self.db.flush()
        await self._bootstrap_default_scene(project.id, title="主场景")
        await self.db.commit()
        loaded = await self._load_project(project.id)
        if not loaded:
            raise RuntimeError("Failed to load project after create")
        return await self._to_response(loaded)

    async def list_public(
        self, skip: int = 0, limit: int = 20
    ) -> List[ProjectResponse]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes).selectinload(ProjectScene.nodes),
                selectinload(Project.roles),
                selectinload(Project.asset_refs),
                selectinload(Project.edges),
            )
            .where(Project.is_public == True)
            .order_by(Project.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        projects = result.scalars().all()
        return [await self._to_response(p) for p in projects]

    async def list_user(self, author_id: str) -> List[ProjectResponse]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes).selectinload(ProjectScene.nodes),
                selectinload(Project.roles),
                selectinload(Project.asset_refs),
                selectinload(Project.edges),
            )
            .where(Project.author_id == author_id)
            .order_by(Project.updated_at.desc())
        )
        projects = result.scalars().all()
        return [await self._to_response(p) for p in projects]

    async def get(self, project_id: UUID, *, bump_view: bool = False) -> Optional[ProjectResponse]:
        project = await self._load_project(project_id)
        if not project:
            return None
        if bump_view:
            project.view_count = (project.view_count or 0) + 1
            await self.db.commit()
            await self.db.refresh(project)
        return await self._to_response(project)

    async def increment_play_count(self, project_id: UUID) -> None:
        project = await self.db.get(Project, project_id)
        if project:
            project.play_count = (project.play_count or 0) + 1
            await self.db.commit()

    async def list_templates(
        self, skip: int = 0, limit: int = 20
    ) -> List[ProjectResponse]:
        """公开示范作 / 元剧本（is_meta），供「从模板创建」"""
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.scenes).selectinload(ProjectScene.nodes),
                selectinload(Project.roles),
                selectinload(Project.asset_refs),
                selectinload(Project.edges),
            )
            .where(Project.is_meta == True, Project.is_public == True)
            .order_by(Project.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return [await self._to_response(p) for p in result.scalars().all()]

    async def fork_project(
        self,
        project_id: UUID,
        new_author_id: str,
        new_title: Optional[str] = None,
    ) -> Optional[ProjectResponse]:
        source = await self._load_project(project_id)
        if not source:
            return None
        if not source.is_public and not source.is_meta:
            raise ValueError("Only public or template projects can be forked")

        forked = Project(
            title=new_title or f"{source.title} (Fork)",
            description=source.description or "",
            cover_image=source.cover_image,
            mechanism=source.mechanism,
            style_reference=source.style_reference,
            theme_tags=list(source.theme_tags or []),
            genre=source.genre,
            world_setting=source.world_setting,
            rules=source.rules,
            play_meta=copy.deepcopy(source.play_meta or {}),
            is_public=False,
            is_meta=False,
            fork_from=source.id,
            author_id=new_author_id,
        )
        self.db.add(forked)
        await self.db.flush()

        node_id_map: dict = {}
        for scene in source.scenes or []:
            new_scene = ProjectScene(
                project_id=forked.id,
                source=scene.source,
                scene_ref_id=scene.scene_ref_id,
                scene_data=copy.deepcopy(scene.scene_data) if scene.scene_data else None,
                title=scene.title,
                description=scene.description or "",
                parent_scene_id=scene.parent_scene_id,
                location=scene.location,
                atmosphere=scene.atmosphere,
                sort_order=scene.sort_order,
            )
            self.db.add(new_scene)
            await self.db.flush()
            for node in scene.nodes or []:
                new_node = ProjectNode(
                    scene_id=new_scene.id,
                    editor_data=copy.deepcopy(node.editor_data or {}),
                    narrative_data=copy.deepcopy(node.narrative_data or {}),
                    sort_order=node.sort_order,
                )
                self.db.add(new_node)
                await self.db.flush()
                node_id_map[node.id] = new_node.id

        for edge in source.edges or []:
            src = node_id_map.get(edge.source_node_id)
            tgt = node_id_map.get(edge.target_node_id)
            if not src or not tgt:
                continue
            self.db.add(
                ProjectEdge(
                    project_id=forked.id,
                    source_node_id=src,
                    target_node_id=tgt,
                    source_port=edge.source_port,
                    label=edge.label,
                    condition=copy.deepcopy(edge.condition) if edge.condition else None,
                )
            )

        for role in source.roles or []:
            self.db.add(
                ProjectRole(
                    project_id=forked.id,
                    character_ref_id=role.character_ref_id,
                    locked_version=copy.deepcopy(role.locked_version)
                    if role.locked_version
                    else None,
                    importance=role.importance,
                    role_description=role.role_description,
                )
            )

        for ref in source.asset_refs or []:
            self.db.add(
                ProjectAssetRef(
                    project_id=forked.id,
                    asset_type=ref.asset_type,
                    asset_id=ref.asset_id,
                    locked_version=copy.deepcopy(ref.locked_version)
                    if ref.locked_version
                    else None,
                )
            )

        await self.db.commit()
        loaded = await self._load_project(forked.id)
        if not loaded:
            return None
        return await self._to_response(loaded)

    # ================================================================
    # update — 只返回基本字段，不加载关联
    # ================================================================

    async def update(
        self, project_id: UUID, data: ProjectUpdate
    ) -> Optional[ProjectResponse]:
        project = await self.db.get(Project, project_id)
        if not project:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
        await self.db.commit()
        await self.db.refresh(project)
        # 直接构建响应，不访问未加载的关联
        return ProjectResponse(
            id=project.id,
            title=project.title,
            description=project.description or "",
            cover_image=project.cover_image,
            mechanism=project.mechanism,
            style_reference=project.style_reference,
            theme_tags=project.theme_tags or [],
            genre=project.genre,
            world_setting=project.world_setting,
            rules=project.rules,
            play_meta=project.play_meta or {},
            is_public=project.is_public,
            is_meta=project.is_meta,
            view_count=project.view_count,
            play_count=getattr(project, "play_count", 0) or 0,
            author_id=project.author_id,
            fork_from=getattr(project, "fork_from", None),
            scenes=[],
            roles=[],
            asset_refs=[],
            edges=[],
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    async def delete(self, project_id: UUID) -> bool:
        project = await self.db.get(Project, project_id)
        if not project:
            return False
        await self.db.delete(project)
        await self.db.commit()
        return True

    # ================================================================
    # Scene CRUD
    # ================================================================

    async def add_scene(
        self, project_id: UUID, data: ProjectSceneCreate
    ) -> ProjectSceneResponse:
        scene, start_node, end_node = await self._bootstrap_default_scene(
            project_id, title=data.title, scene_data=data
        )

        await self.db.commit()
        await self.db.refresh(scene)
        await self.db.refresh(start_node)
        await self.db.refresh(end_node)

        return ProjectSceneResponse(
            id=scene.id,
            project_id=scene.project_id,
            source=scene.source,
            scene_ref_id=scene.scene_ref_id,
            title=scene.title,
            description=scene.description or "",
            location=scene.location,
            atmosphere=scene.atmosphere,
            sort_order=scene.sort_order,
            nodes=[
                ProjectNodeResponse.model_validate(start_node),
                ProjectNodeResponse.model_validate(end_node),
            ],
            created_at=scene.created_at,
            updated_at=scene.updated_at,
        )

    async def _bootstrap_default_scene(
        self,
        project_id: UUID,
        *,
        title: str,
        scene_data: Optional[ProjectSceneCreate] = None,
    ) -> tuple[ProjectScene, ProjectNode, ProjectNode]:
        if scene_data:
            scene = ProjectScene(project_id=project_id, **scene_data.model_dump())
        else:
            scene = ProjectScene(
                project_id=project_id,
                title=title,
                description="",
                source="inline",
            )
        self.db.add(scene)
        await self.db.flush()

        start_node = ProjectNode(
            scene_id=scene.id,
            sort_order=0,
            editor_data={"position": {"x": 100, "y": 100}},
            narrative_data={
                "title": "开始",
                "description": "剧本起始节点",
                "is_anchor": True,
                "speaker": None,
                "dialogue": None,
                "narration": "故事从这里开始...",
                "trigger_condition": None,
                "effects": [],
                "choices": [],
            },
        )
        self.db.add(start_node)

        end_node = ProjectNode(
            scene_id=scene.id,
            sort_order=1,
            editor_data={"position": {"x": 800, "y": 100}},
            narrative_data={
                "title": "结束",
                "description": "剧本结束节点",
                "is_anchor": True,
                "speaker": None,
                "dialogue": None,
                "narration": "故事暂告一段落...",
                "trigger_condition": None,
                "effects": [],
                "choices": [],
            },
        )
        self.db.add(end_node)
        await self.db.flush()

        default_edge = ProjectEdge(
            project_id=project_id,
            source_node_id=start_node.id,
            target_node_id=end_node.id,
            source_port="true",
            label="开始",
        )
        self.db.add(default_edge)

        return scene, start_node, end_node

    async def update_scene(
        self, scene_id: UUID, data: ProjectSceneUpdate
    ) -> Optional[ProjectSceneResponse]:
        scene = await self.db.get(ProjectScene, scene_id)
        if not scene:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(scene, key, value)
        await self.db.commit()
        await self.db.refresh(scene)
        return ProjectSceneResponse(
            id=scene.id,
            project_id=scene.project_id,
            source=scene.source,
            scene_ref_id=scene.scene_ref_id,
            title=scene.title,
            description=scene.description or "",
            location=scene.location,
            atmosphere=scene.atmosphere,
            sort_order=scene.sort_order,
            nodes=[],
            created_at=scene.created_at,
            updated_at=scene.updated_at,
        )

    async def delete_scene(self, scene_id: UUID) -> bool:
        scene = await self.db.get(ProjectScene, scene_id)
        if not scene:
            return False
        await self.db.delete(scene)
        await self.db.commit()
        return True

    # ================================================================
    # Node CRUD
    # ================================================================

    async def add_node(
        self, scene_id: UUID, data: ProjectNodeCreate
    ) -> ProjectNodeResponse:
        node = ProjectNode(scene_id=scene_id, **data.model_dump())
        self.db.add(node)
        await self.db.commit()
        await self.db.refresh(node)
        return ProjectNodeResponse.model_validate(node)

    async def update_node(
        self, node_id: UUID, data: ProjectNodeUpdate
    ) -> Optional[ProjectNodeResponse]:
        node = await self.db.get(ProjectNode, node_id)
        if not node:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(node, key, value)
        await self.db.commit()
        await self.db.refresh(node)
        return ProjectNodeResponse.model_validate(node)

    async def delete_node(self, node_id: UUID) -> bool:
        node = await self.db.get(ProjectNode, node_id)
        if not node:
            return False
        await self.db.delete(node)
        await self.db.commit()
        return True

    async def get_node(self, node_id: UUID) -> Optional[ProjectNodeResponse]:
        node = await self.db.get(ProjectNode, node_id)
        if not node:
            return None
        return ProjectNodeResponse.model_validate(node)

    # ================================================================
    # Role CRUD
    # ================================================================

    async def add_role(
        self, project_id: UUID, data: ProjectRoleCreate
    ) -> ProjectRoleResponse:
        role = ProjectRole(project_id=project_id, **data.model_dump())
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return ProjectRoleResponse.model_validate(role)

    async def update_role(
        self, role_id: UUID, data: ProjectRoleUpdate
    ) -> Optional[ProjectRoleResponse]:
        role = await self.db.get(ProjectRole, role_id)
        if not role:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(role, key, value)
        await self.db.commit()
        await self.db.refresh(role)
        return ProjectRoleResponse.model_validate(role)

    async def remove_role(self, role_id: UUID) -> bool:
        role = await self.db.get(ProjectRole, role_id)
        if not role:
            return False
        await self.db.delete(role)
        await self.db.commit()
        return True

    # ================================================================
    # AssetRef CRUD
    # ================================================================

    async def add_asset_ref(
        self, project_id: UUID, data: ProjectAssetRefCreate
    ) -> ProjectAssetRefResponse:
        ref = ProjectAssetRef(project_id=project_id, **data.model_dump())
        self.db.add(ref)
        await self.db.commit()
        await self.db.refresh(ref)
        return ProjectAssetRefResponse.model_validate(ref)

    async def remove_asset_ref(self, ref_id: UUID) -> bool:
        ref = await self.db.get(ProjectAssetRef, ref_id)
        if not ref:
            return False
        await self.db.delete(ref)
        await self.db.commit()
        return True

    # ================================================================
    # Edge CRUD
    # ================================================================

    async def add_edge(
        self, project_id: UUID, data: ProjectEdgeCreate
    ) -> ProjectEdgeResponse:
        edge = ProjectEdge(project_id=project_id, **data.model_dump())
        self.db.add(edge)
        await self.db.commit()
        await self.db.refresh(edge)
        return ProjectEdgeResponse.model_validate(edge)

    async def delete_edge(self, edge_id: UUID) -> bool:
        edge = await self.db.get(ProjectEdge, edge_id)
        if not edge:
            return False
        await self.db.delete(edge)
        await self.db.commit()
        return True

    async def update_edges_batch(
        self, project_id: UUID, edges: List[ProjectEdgeCreate]
    ) -> List[ProjectEdgeResponse]:
        """批量替换连线——编辑器保存时使用"""
        # 删除旧连线
        await self.db.execute(
            delete(ProjectEdge).where(ProjectEdge.project_id == project_id)
        )
        # 创建新连线
        new_edges = []
        for edge_data in edges:
            edge = ProjectEdge(project_id=project_id, **edge_data.model_dump())
            self.db.add(edge)
            new_edges.append(edge)
        await self.db.commit()
        for e in new_edges:
            await self.db.refresh(e)
        return [ProjectEdgeResponse.model_validate(e) for e in new_edges]

    # ================================================================
    # 内部
    # ================================================================

    async def _to_response(self, project: Project) -> ProjectResponse:
        """将 ORM 对象转换为 Response，确保嵌套关系正确加载"""
        return ProjectResponse(
            id=project.id,
            title=project.title,
            description=project.description or "",
            cover_image=project.cover_image,
            mechanism=project.mechanism,
            style_reference=project.style_reference,
            theme_tags=project.theme_tags or [],
            genre=project.genre,
            world_setting=project.world_setting,
            rules=project.rules,
            play_meta=project.play_meta or {},
            is_public=project.is_public,
            is_meta=project.is_meta,
            view_count=project.view_count,
            play_count=getattr(project, "play_count", 0) or 0,
            author_id=project.author_id,
            fork_from=getattr(project, "fork_from", None),
            scenes=[
                ProjectSceneResponse(
                    id=s.id,
                    project_id=s.project_id,
                    source=s.source,
                    scene_ref_id=s.scene_ref_id,
                    title=s.title,
                    description=s.description or "",
                    location=s.location,
                    atmosphere=s.atmosphere,
                    sort_order=s.sort_order,
                    nodes=[
                        ProjectNodeResponse(
                            id=n.id,
                            scene_id=n.scene_id,
                            editor_data=n.editor_data or {},
                            narrative_data=n.narrative_data or {},
                            sort_order=n.sort_order,
                            created_at=n.created_at,
                            updated_at=n.updated_at,
                        )
                        for n in (s.nodes or [])
                    ],
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                )
                for s in (project.scenes or [])
            ],
            roles=[
                ProjectRoleResponse(
                    id=r.id,
                    project_id=r.project_id,
                    character_ref_id=r.character_ref_id,
                    locked_version=r.locked_version,
                    importance=r.importance,
                    role_description=r.role_description,
                    created_at=r.created_at,
                )
                for r in (project.roles or [])
            ],
            asset_refs=[
                ProjectAssetRefResponse(
                    id=a.id,
                    project_id=a.project_id,
                    asset_type=a.asset_type,
                    asset_id=a.asset_id,
                    locked_version=a.locked_version,
                    created_at=a.created_at,
                )
                for a in (project.asset_refs or [])
            ],
            edges=[
                ProjectEdgeResponse(
                    id=e.id,
                    project_id=e.project_id,
                    source_node_id=e.source_node_id,
                    target_node_id=e.target_node_id,
                    source_port=e.source_port,
                    label=e.label,
                    condition=e.condition,
                    created_at=e.created_at,
                )
                for e in (project.edges or [])
            ],
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
