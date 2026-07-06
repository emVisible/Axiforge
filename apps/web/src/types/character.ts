export interface Demeanor {
  speech_style?: string;
  habits?: string;
  typical_reaction?: string;
  expressiveness?: string;
}

export interface Psyche {
  desire?: string;
  fear?: string;
  conflict?: string;
  self_perception?: string;
}
export interface Contour {
  appearance?: string;
  age_era?: string;
  identity?: string;
  first_impression?: string;
}

export interface Anchor {
  essence: string;
  name: string;
  tags: string[];
  theme?: string;
  core_belief?: string;
  summary?: string;
}


export interface Trace {
  background?: string;
  key_events: string[];
  turning_point?: string;
}

export interface Bond {
  attitude_to_others?: string;
  intimate_pattern?: string;
  hostile_pattern?: string;
  group_role?: string;
}

export interface CharacterData {
  contour: Contour;
  demeanor: Demeanor;
  psyche: Psyche;
  anchor: Anchor;
  trace: Trace;
  bond: Bond;
}


export interface ForkRequest {
  new_name?: string;
  author_id?: string;
}

export interface ForkChainItem {
  id: string;
  name: string;
  author_id: string;
  created_at: string;
  is_current: boolean;
}

export interface ForkChain {
  original_id: string;
  original_name: string;
  total_forks: number;
  chain: ForkChainItem[];
}


export interface Tag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface Character {
  id: string;
  name: string;
  author_id: string;
  character_data: CharacterData;
  is_public: boolean;
  tags: Tag[];
  image_path?: string;
  fork_from: string | null;
  created_at: string;
  updated_at: string;
  view_count?: number;
}

export interface CharacterCreate {
  character_data: CharacterData;
  is_public: boolean;
  image_path?: string;
}

export interface CharacterUpdate {
  character_data?: CharacterData;
  is_public?: boolean;
  image_path?: string;
}
export interface CharacterSearchResult {
  items: Character[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================
// 关系系统
// ============================================

export interface RelationResponse {
  id: string;
  source_id: string;
  target_id: string;
  target_name: string;
  target_essence?: string;
  relation_name: string;
  relation_type: string;
  description?: string;
  is_mutual: boolean;
  created_at: string;
  direction?: "in" | "out";
}

export interface RelationCreate {
  target_id: string;
  relation_name: string;
  relation_type: string;
  description?: string;
  is_mutual: boolean;
}

export interface RelationGraphNode {
  id: string;
  name: string;
  essence?: string;
  is_center: boolean;
}

export interface RelationGraphLink {
  source: string;
  target: string;
  relation_name: string;
  is_mutual: boolean;
}

export interface RelationGraph {
  nodes: RelationGraphNode[];
  links: RelationGraphLink[];
}

export interface PresetCategory {
  [category: string]: PresetRelation[];
}

export interface PresetRelation {
  name: string;
  category: string;
  mutual: boolean;
}
export interface ExportOptions {
  format: "system" | "plain" | "markdown" | "json";
  include_stories: boolean;
  include_relations: boolean;
}

export interface ExportResult {
  character_data: CharacterData;
  name: string;
  tags: string[];
  stories?: { title: string; content: string; word_count: number }[];
  relations?: any[];
}