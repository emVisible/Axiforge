import { apiClient } from './client';
import type { StoryListItem, Story, StoryCreate, StoryUpdate } from '@/types/story';

export const storyApi = {
  list: (characterId: string) =>
    apiClient.get<StoryListItem[]>(`/characters/${characterId}/stories`),

  get: (characterId: string, storyId: string) =>
    apiClient.get<Story>(`/characters/${characterId}/stories/${storyId}`),

  create: (characterId: string, data: StoryCreate) =>
    apiClient.post<Story>(`/characters/${characterId}/stories`, data),

  update: (characterId: string, storyId: string, data: StoryUpdate) =>
    apiClient.put<Story>(`/characters/${characterId}/stories/${storyId}`, data),

  delete: (characterId: string, storyId: string) =>
    apiClient.delete<void>(`/characters/${characterId}/stories/${storyId}`),
};