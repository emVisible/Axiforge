
// ============================================================
// 编辑器节点数据（画布坐标、尺寸等）
// ============================================================

export interface EditorNodeData {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  ports?: {
    input?: string;
    outputs?: { id: string; label: string }[];
  };
  [key: string]: unknown;
}

// ============================================================
// 叙事节点数据（运行时用）
// ============================================================

export interface NarrativeEffect {
  type: 'memory' | 'flag' | 'character_state';
  key: string;
  value: unknown;
  [key: string]: unknown;
}

export interface NarrativeCondition {
  type: 'memory' | 'flag' | 'character_state' | 'node_completed';
  key: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
  value: unknown;
  [key: string]: unknown;
}

export interface NarrativeChoice {
  label: string;
  target_node_id?: string | null;
  condition?: NarrativeCondition | null;
}

export interface NarrativeNodeData {
  title?: string;
  description?: string;
  is_anchor?: boolean;
  is_ending?: boolean;
  ending_label?: string | null;
  speaker?: string | null;
  dialogue?: string | null;
  narration?: string | null;
  trigger_condition?: NarrativeCondition | null;
  effects?: NarrativeEffect[];
  choices?: NarrativeChoice[];
  auto_advance?: boolean;
  auto_delay_ms?: number | null;
  [key: string]: unknown;
}

// ============================================================
// Project
// ============================================================

export interface ProjectCreate {
  title: string;
  description?: string;
  cover_image?: string | null;
  mechanism?: string | null;
  style_reference?: string | null;
  theme_tags?: string[];
  genre?: string | null;
  world_setting?: string | null;
  rules?: string | null;
  is_public?: boolean;
  is_meta?: boolean;
  author_id?: string;
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
  cover_image?: string | null;
  mechanism?: string | null;
  style_reference?: string | null;
  theme_tags?: string[];
  genre?: string | null;
  world_setting?: string | null;
  rules?: string | null;
  play_meta?: Record<string, unknown>;
  axs_source?: string;
  is_public?: boolean;
  is_meta?: boolean;
  allow_comments?: boolean;
  topic_slug?: string | null;
}

export interface ProjectResponse {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  mechanism: string | null;
  style_reference: string | null;
  theme_tags: string[];
  genre: string | null;
  world_setting: string | null;
  rules: string | null;
  play_meta?: Record<string, unknown>;
  is_public: boolean;
  is_meta: boolean;
  view_count: number;
  play_count?: number;
  author_id: string;
  fork_from?: string | null;
  allow_comments?: boolean;
  topic_slug?: string | null;
  scenes: ProjectSceneResponse[];
  roles: ProjectRoleResponse[];
  asset_refs: ProjectAssetRefResponse[];
  edges: ProjectEdgeResponse[];
  nodes?: ProjectNodeResponse[];
  axs_source?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ProjectScene
// ============================================================

export type SceneSource = 'reference' | 'locked' | 'inline';

export interface ProjectSceneCreate {
  source?: SceneSource;
  scene_ref_id?: string | null;
  title: string;
  parent_scene_id?: string | null;
  description?: string;
  location?: string | null;
  atmosphere?: string | null;
  sort_order?: number;
}

export interface ProjectSceneUpdate {
  source?: SceneSource;
  scene_ref_id?: string | null;
  scene_data?: Record<string, unknown>;
  title?: string;
  description?: string;
  parent_scene_id?: string | null;
  location?: string | null;
  atmosphere?: string | null;
  sort_order?: number;
}

export interface ProjectSceneResponse {
  id: string;
  project_id: string;
  source: SceneSource;
  scene_ref_id: string | null;
  title: string;
  description: string;
  parent_scene_id: string | null;
  location: string | null;
  atmosphere: string | null;
  sort_order: number;
  nodes: ProjectNodeResponse[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// ProjectNode
// ============================================================

export interface ProjectNodeCreate {
  editor_data?: EditorNodeData;
  narrative_data?: NarrativeNodeData;
  sort_order?: number;
  stage_id?: string | null;
  /** @deprecated 使用 stage_id */
  scene_id?: string | null;
}

export interface ProjectNodeUpdate {
  editor_data?: EditorNodeData;
  narrative_data?: NarrativeNodeData;
  sort_order?: number;
  stage_id?: string | null;
  /** @deprecated 使用 stage_id */
  scene_id?: string | null;
}

export interface ProjectNodeResponse {
  id: string;
  scene_id?: string | null;
  /** @deprecated 使用 stage_id */
  stage_id?: string | null;
  editor_data: EditorNodeData;
  narrative_data: NarrativeNodeData;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ProjectRole
// ============================================================

export interface ProjectRoleCreate {
  character_ref_id: string;
  importance?: number;
  role_description?: string | null;
}

export interface ProjectRoleUpdate {
  locked_version?: Record<string, unknown> | null;
  importance?: number;
  role_description?: string | null;
}

export interface ProjectRoleResponse {
  id: string;
  project_id: string;
  character_ref_id: string;
  locked_version: Record<string, unknown> | null;
  importance: number;
  role_description: string | null;
  created_at: string;
}

// ============================================================
// ProjectAssetRef
// ============================================================

export interface ProjectAssetRefCreate {
  asset_type: 'item';
  asset_id: string;
}

export interface ProjectAssetRefResponse {
  id: string;
  project_id: string;
  asset_type: 'item';
  asset_id: string;
  locked_version: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// ProjectEdge
// ============================================================

export interface ProjectEdgeCreate {
  source_node_id: string;
  target_node_id: string;
  source_port?: string;
  label?: string | null;
  condition?: Record<string, unknown> | null;
}

export interface ProjectEdgeResponse {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  source_port: string;
  label: string | null;
  condition: Record<string, unknown> | null;
  created_at: string;
}