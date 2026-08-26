import { apiClient } from './client';
import type {
  Character, CharacterCreate, CharacterUpdate,
  ForkRequest, ForkChain, CharacterSearchResult,
  ExportOptions,
  ExportResult,
} from '@/shared/types/character';

export const characterApi = {
  create: (data: CharacterCreate) =>
    apiClient.post<Character>('/characters/', data),

  update: (id: string, data: CharacterUpdate) =>
    apiClient.put<Character>(`/characters/${id}`, data),
  listPublic: (params?: {
    skip?: number; limit?: number; search?: string; tags?: string; sort?: string;
  }) =>
    apiClient.get<CharacterSearchResult>('/characters/public', params),

  listUser: (authorId: string) =>
    apiClient.get<Character[]>(`/characters/user/${authorId}`),

  get: (id: string, params?: { bump_view?: boolean; viewer_token?: string }) =>
    apiClient.get<Character>(`/characters/${id}`, params),
  /** 批量获取（工程目录装载，消除 N+1）；缺失 id 静默跳过 */
  getMany: (ids: string[]) =>
    apiClient.get<Character[]>(`/characters/batch`, { ids: ids.join(",") }),


  delete: (id: string) =>
    apiClient.delete<void>(`/characters/${id}`),

  fork: (id: string, forkRequest?: ForkRequest) =>
    apiClient.post<Character>(`/characters/${id}/fork`, forkRequest || {}),

  getForkChain: (id: string) =>
    apiClient.get<ForkChain>(`/characters/${id}/fork-chain`),

  export: (characterId: string, options: ExportOptions) =>
    apiClient.post<ExportResult>(`/characters/${characterId}/export`, options),
};