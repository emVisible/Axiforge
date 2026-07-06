import { apiClient } from './client';
import type {
  RelationResponse, RelationCreate, RelationGraph, PresetCategory,
} from '@/types/character';

export const relationApi = {
  list: (characterId: string) =>
    apiClient.get<RelationResponse[]>(`/characters/${characterId}/relations`),

  create: (characterId: string, data: RelationCreate) =>
    apiClient.post<RelationResponse>(`/characters/${characterId}/relations`, data),

  graph: (characterId: string) =>
    apiClient.get<RelationGraph>(`/characters/${characterId}/relation-graph`),

  update: (characterId: string, relationId: string, data: Partial<RelationCreate>) =>
    apiClient.put(`/characters/${characterId}/relations/${relationId}`, data),

  delete: (characterId: string, relationId: string) =>
    apiClient.delete<void>(`/characters/${characterId}/relations/${relationId}`),

  presets: () =>
    apiClient.get<PresetCategory>('/relations/presets'),
};