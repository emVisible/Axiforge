
import { apiClient } from './client';
import type { CodexLedger, RuntimeState, StoryPackage } from "@axiforge/core";
import type {
  StartSessionRequest,
  SessionResponse,
  PlayerDrawResponse,
  CompleteNodeRequest,
  SessionMemoryResponse,
  SessionFlagResponse,
  CharacterRuntimeStateResponse,
} from '@/shared/types';

export interface CodexResponse {
  ledger: CodexLedger;
}

export interface CodexUpsert {
  player_token: string;
  ledger: CodexLedger;
  source_project_id?: string;
}

/** 存档槽不持久化跨作品 Codex（由独立 API 同步） */
export function stateForSave(state: RuntimeState): RuntimeState {
  return { ...state, codex: {} };
}

// 存档槽（桥4 第二层·持久记忆，ADR-011）——后端返回 snake_case
export interface SaveSlotResponse {
  id: string;
  project_id: string;
  player_token: string;
  slot: number;
  state: RuntimeState;
  summary: string | null;
  beat_id: string | null;
  thumb_path: string | null;
  updated_at: string | null;
}

export interface SaveSlotUpsert {
  player_token: string;
  state: RuntimeState;
  summary?: string | null;
  beat_id?: string | null;
  thumb_path?: string | null;
  slot?: number;
}

export const playerApi = {
  // Story Package（编译 IR，ADR-008）——供 @axiforge/core 引擎本地播放
  getStory: (projectId: string, authorId?: string) =>
    apiClient.get<StoryPackage>(`/play/story/${projectId}`, {
      ...(authorId ? { author_id: authorId } : {}),
    }),

  // 存档：多槽读写
  listSaves: (projectId: string, playerToken: string) =>
    apiClient.get<SaveSlotResponse[]>(`/play/save/${projectId}/list`, {
      player_token: playerToken,
    }),

  getSave: (projectId: string, playerToken: string, slot = 0) =>
    apiClient.get<SaveSlotResponse>(`/play/save/${projectId}`, {
      player_token: playerToken,
      slot,
    }),

  putSave: (projectId: string, body: SaveSlotUpsert) =>
    apiClient.put<SaveSlotResponse>(`/play/save/${projectId}`, body),

  clearSave: (projectId: string, playerToken: string, slot = 0) =>
    apiClient.delete<void>(
      `/play/save/${projectId}?player_token=${encodeURIComponent(playerToken)}&slot=${slot}`,
    ),

  // 跨作品 IP 账本（v1.6）
  getCodex: (playerToken: string, characterIds?: string[]) =>
    apiClient.get<CodexResponse>("/play/codex", {
      player_token: playerToken,
      ...(characterIds?.length
        ? { character_ids: characterIds.join(",") }
        : {}),
    }),

  putCodex: (body: CodexUpsert) =>
    apiClient.put<CodexResponse>("/play/codex", body),

  // 会话
  startSession: (data: StartSessionRequest) =>
    apiClient.post<SessionResponse>('/play/sessions', data),

  getSession: (sessionId: string) =>
    apiClient.get<SessionResponse>(`/play/sessions/${sessionId}`),

  // 叙事推进
  draw: (sessionId: string) =>
    apiClient.get<PlayerDrawResponse>(`/play/sessions/${sessionId}/draw`),

  complete: (sessionId: string, data: CompleteNodeRequest) =>
    apiClient.post<PlayerDrawResponse>(`/play/sessions/${sessionId}/complete`, data),

  // 状态查询
  getMemories: (sessionId: string) =>
    apiClient.get<SessionMemoryResponse[]>(`/play/sessions/${sessionId}/memories`),

  getFlags: (sessionId: string) =>
    apiClient.get<SessionFlagResponse[]>(`/play/sessions/${sessionId}/flags`),

  getCharacterStates: (sessionId: string) =>
    apiClient.get<CharacterRuntimeStateResponse[]>(`/play/sessions/${sessionId}/characters`),
};