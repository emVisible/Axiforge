
import { apiClient } from './client';
import type {
  StartSessionRequest,
  SessionResponse,
  PlayerDrawResponse,
  CompleteNodeRequest,
  SessionMemoryResponse,
  SessionFlagResponse,
  CharacterRuntimeStateResponse,
} from '@/types';

export const playerApi = {
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