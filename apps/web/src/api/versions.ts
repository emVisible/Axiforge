import { apiClient } from './client';
import type { Character } from '@/types/character';

export interface VersionItem {
  id: string;
  character_id: string;
  version_number: number;
  name: string;
  tags: string[];
  change_summary?: string;
  created_at: string;
}

export interface VersionDetail extends VersionItem {
  character_data: any;
}

export const versionApi = {
  list: (characterId: string) =>
    apiClient.get<VersionItem[]>(`/characters/${characterId}/versions`),

  get: (characterId: string, versionId: string) =>
    apiClient.get<VersionDetail>(`/characters/${characterId}/versions/${versionId}`),

  rollback: (characterId: string, versionId: string) =>
    apiClient.post<Character>(`/characters/${characterId}/versions/${versionId}/rollback`),
};