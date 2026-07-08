
import { apiClient } from './client';
// api/editor.ts 顶部
import type {
  Page,
  ProjectCreate, ProjectUpdate, ProjectResponse,
  ProjectSceneCreate, ProjectSceneUpdate, ProjectSceneResponse,
  ProjectNodeCreate, ProjectNodeUpdate, ProjectNodeResponse,
  ProjectRoleCreate, ProjectRoleUpdate, ProjectRoleResponse,
  ProjectEdgeCreate, ProjectEdgeResponse,
  ProjectAssetRefCreate, ProjectAssetRefResponse,
  AssetSceneCreate, AssetSceneUpdate, AssetSceneResponse,
  AssetItemCreate, AssetItemUpdate, AssetItemResponse,
} from '@/shared/types';

// ============================================================
// Project
// ============================================================

export const projectApi = {

  list: (params?: { skip?: number; limit?: number; author_id?: string }) =>
    apiClient.get<ProjectResponse[]>(
      params?.author_id
        ? `/editor/projects/user/${params.author_id}`
        : '/editor/projects/public',
      { skip: params?.skip, limit: params?.limit }
    ),
  get: (id: string, params?: { bump_view?: boolean; viewer_token?: string }) =>
    apiClient.get<ProjectResponse>(`/editor/projects/${id}`, params),

  recordView: (id: string, viewer_token?: string) => {
    const qs = viewer_token
      ? `?viewer_token=${encodeURIComponent(viewer_token)}`
      : "";
    return apiClient.post<void>(`/editor/projects/${id}/view${qs}`);
  },

  create: (data: ProjectCreate) =>
    apiClient.post<ProjectResponse>('/editor/projects/', data),

  update: (id: string, data: ProjectUpdate) =>
    apiClient.put<ProjectResponse>(`/editor/projects/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/editor/projects/${id}`),

  listTemplates: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<ProjectResponse[]>('/editor/projects/templates', params),

  /** 带搜索与总数的公开作品分页查询，供 Discover 多标签浏览使用。 */
  discover: (params?: { skip?: number; limit?: number; search?: string }) =>
    apiClient.get<Page<ProjectResponse>>('/editor/projects/discover', params),

  fork: (id: string, body: { author_id: string; new_title?: string }) =>
    apiClient.post<ProjectResponse>(`/editor/projects/${id}/fork`, body),

  seedShowcase: () =>
    apiClient.post<{ character_id: string; projects: { id: string; title: string; status: string }[] }>(
      "/editor/projects/seed/showcase",
    ),

  // Scene
  addScene: (projectId: string, data: ProjectSceneCreate) =>
    apiClient.post<ProjectSceneResponse>(`/editor/projects/${projectId}/scenes`, data),

  updateScene: (projectId: string, sceneId: string, data: ProjectSceneUpdate) =>
    apiClient.put<ProjectSceneResponse>(`/editor/projects/${projectId}/scenes/${sceneId}`, data),

  deleteScene: (projectId: string, sceneId: string) =>
    apiClient.delete<void>(`/editor/projects/${projectId}/scenes/${sceneId}`),

  // Node（项目级，ADR-017）
  addProjectNode: (projectId: string, data: ProjectNodeCreate) =>
    apiClient.post<ProjectNodeResponse>(`/editor/projects/${projectId}/nodes`, data),

  updateProjectNode: (projectId: string, nodeId: string, data: ProjectNodeUpdate) =>
    apiClient.put<ProjectNodeResponse>(`/editor/projects/${projectId}/nodes/${nodeId}`, data),

  syncNarrative: (projectId: string, data: NarrativeSyncRequest) =>
    apiClient.put<ProjectResponse>(`/editor/projects/${projectId}/narrative`, data),

  // Node（场景嵌套，兼容旧路由）
  addNode: (projectId: string, sceneId: string, data: ProjectNodeCreate) =>
    apiClient.post<ProjectNodeResponse>(`/editor/projects/${projectId}/scenes/${sceneId}/nodes`, data),

  updateNode: (projectId: string, sceneId: string, nodeId: string, data: ProjectNodeUpdate) =>
    apiClient.put<ProjectNodeResponse>(`/editor/projects/${projectId}/scenes/${sceneId}/nodes/${nodeId}`, data),

  deleteNode: (projectId: string, sceneId: string, nodeId: string) =>
    apiClient.delete<void>(`/editor/projects/${projectId}/scenes/${sceneId}/nodes/${nodeId}`),

  // Role
  addRole: (projectId: string, data: ProjectRoleCreate) =>
    apiClient.post<ProjectRoleResponse>(`/editor/projects/${projectId}/roles`, data),

  updateRole: (projectId: string, roleId: string, data: ProjectRoleUpdate) =>
    apiClient.put<ProjectRoleResponse>(`/editor/projects/${projectId}/roles/${roleId}`, data),

  removeRole: (projectId: string, roleId: string) =>
    apiClient.delete<void>(`/editor/projects/${projectId}/roles/${roleId}`),

  // AssetRef
  addAssetRef: (projectId: string, data: ProjectAssetRefCreate) =>
    apiClient.post<ProjectAssetRefResponse>(`/editor/projects/${projectId}/assets`, data),

  removeAssetRef: (projectId: string, refId: string) =>
    apiClient.delete<void>(`/editor/projects/${projectId}/assets/${refId}`),

  // Edge
  saveEdges: (projectId: string, edges: ProjectEdgeCreate[]) =>
    apiClient.post<ProjectEdgeResponse[]>(`/editor/projects/${projectId}/edges`, edges),
};

// ============================================================
// Asset — Scenes
// ============================================================

export const sceneAssetApi = {
  list: (params?: { author_id?: string; search?: string; tags?: string[] }) =>
    apiClient.get<AssetSceneResponse[]>(
      params?.author_id
        ? `/editor/assets/scenes/user/${params.author_id}`
        : '/editor/assets/scenes/public',
      params
    ),

  /** 带总数的场景模板分页查询，供 Discover 多标签浏览使用。 */
  discover: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }) => apiClient.get<Page<AssetSceneResponse>>('/editor/assets/scenes/discover', params),

  get: (id: string) =>
    apiClient.get<AssetSceneResponse>(`/editor/assets/scenes/${id}`),

  create: (data: AssetSceneCreate) =>
    apiClient.post<AssetSceneResponse>('/editor/assets/scenes', data),

  update: (id: string, data: AssetSceneUpdate) =>
    apiClient.put<AssetSceneResponse>(`/editor/assets/scenes/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/editor/assets/scenes/${id}`),
};

// ============================================================
// Asset — Items
// ============================================================

export const itemApi = {
  list: (params?: { author_id?: string; category?: string; search?: string }) =>
    apiClient.get<AssetItemResponse[]>(
      params?.author_id
        ? `/editor/assets/items/user/${params.author_id}`
        : '/editor/assets/items/public',
      params
    ),

  /** 带总数的道具分页查询，供 Discover 多标签浏览使用。 */
  discover: (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => apiClient.get<Page<AssetItemResponse>>('/editor/assets/items/discover', params),

  get: (id: string) =>
    apiClient.get<AssetItemResponse>(`/editor/assets/items/${id}`),

  create: (data: AssetItemCreate) =>
    apiClient.post<AssetItemResponse>('/editor/assets/items', data),

  update: (id: string, data: AssetItemUpdate) =>
    apiClient.put<AssetItemResponse>(`/editor/assets/items/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/editor/assets/items/${id}`),
};

// ============================================================
// Narrative sync (AXS)
// ============================================================

export interface NarrativeNodeSync {
  id?: string | null;
  stage_id?: string | null;
  scene_id?: string | null;
  editor_data?: Record<string, unknown>;
  narrative_data?: Record<string, unknown>;
  sort_order?: number;
}

export interface NarrativeSyncRequest {
  axs_source: string;
  nodes: NarrativeNodeSync[];
  edges: ProjectEdgeCreate[];
}
