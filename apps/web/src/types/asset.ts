
// ============================================================
// AssetScene
// ============================================================

export interface AssetSceneCreate {
  name: string;
  description?: string;
  location?: string | null;
  atmosphere?: string | null;
  era?: string | null;
  world_setting?: string | null;
  rules?: string | null;
  tags?: string[];
  node_templates?: Record<string, unknown>[];
  image_path?: string | null;
  author_id?: string;
  is_public?: boolean;
}

export interface AssetSceneUpdate {
  name?: string;
  description?: string;
  location?: string | null;
  atmosphere?: string | null;
  era?: string | null;
  world_setting?: string | null;
  rules?: string | null;
  tags?: string[];
  node_templates?: Record<string, unknown>[];
  image_path?: string | null;
  is_public?: boolean;
}

export interface AssetSceneResponse {
  id: string;
  name: string;
  description: string;
  location: string | null;
  atmosphere: string | null;
  era: string | null;
  world_setting: string | null;
  rules: string | null;
  tags: string[];
  node_templates: Record<string, unknown>[];
  image_path: string | null;
  author_id: string;
  is_public: boolean;
  view_count: number;
  fork_from_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// AssetItem
// ============================================================

export interface AssetItemCreate {
  name: string;
  description?: string;
  category?: string;
  rarity?: string;
  mechanism_tags?: string[];
  personality?: Record<string, number>;
  effects?: string[];
  image_path?: string | null;
  author_id?: string;
  is_public?: boolean;
}

export interface AssetItemUpdate {
  name?: string;
  description?: string;
  category?: string;
  rarity?: string;
  personality?: Record<string, number>;
  mechanism_tags?: string[];
  effects?: string[];
  image_path?: string | null;
  is_public?: boolean;
}

export interface AssetItemResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  effects: string[];
  mechanism_tags: string[];
  image_path: string | null;
  personality: Record<string, number>;
  author_id: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}
