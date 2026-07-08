
// ============================================================
// Requests
// ============================================================

export interface StartSessionRequest {
  project_id: string;
  player_name?: string | null;
}

export interface CompleteNodeRequest {
  node_id: string;
  choice_label?: string | null;
}

// ============================================================
// Player View
// ============================================================

export interface PlayerChoice {
  label: string;
  target_node_id: string | null;
  disabled: boolean;
  disabled_reason: string | null;
}

export interface PlayerCharacterSnapshot {
  character_id: string;
  name: string;
  current_expression: string;
  current_position: string;
  outfit: string | null;
  image_path?: string | null;
}

export interface PlayerNode {
  node_id: string;
  scene_title: string;
  scene_location: string | null;
  speaker_name: string | null;
  dialogue: string | null;
  narration: string | null;
  background_description: string | null;
  background_image: string | null;
  atmosphere: string | null;
  characters_on_stage: PlayerCharacterSnapshot[];
  choices: PlayerChoice[];
  auto_advance: boolean;
  auto_delay_ms: number | null;
  is_anchor: boolean;
  is_ending: boolean;
}

export interface PlayerDrawResponse {
  session_id: string;
  session_status: 'active' | 'paused' | 'completed';
  available_nodes: PlayerNode[];
  current_memories_count: number;
  current_flags_count: number;
}

// ============================================================
// Session
// ============================================================

export interface SessionResponse {
  id: string;
  project_id: string;
  status: 'active' | 'paused' | 'completed';
  current_node_id: string | null;
  player_name: string | null;
  started_at: string;
  updated_at: string;
}

// ============================================================
// Memories / Flags / CharacterStates
// ============================================================

export interface SessionMemoryResponse {
  id: string;
  session_id: string;
  node_id: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
}

export interface SessionFlagResponse {
  id: string;
  session_id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface CharacterRuntimeStateResponse {
  id: string;
  session_id: string;
  character_id: string;
  character_name: string;
  image_path?: string | null;
  current_expression: string;
  current_position: string;
  current_pose: string;
  outfit: string | null;
  mood: string;
  affection: number;
  relationship_tags: string[];
  location: string | null;
  custom_state: Record<string, unknown>;
  updated_at: string;
}