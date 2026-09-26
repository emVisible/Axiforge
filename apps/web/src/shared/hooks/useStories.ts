import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createStory,
  readStories,
  readStory,
  removeStory,
  updateStory,
} from '@/shared/storage/storySaves';
import type { StoryCreate, StoryUpdate } from '@/shared/types/story';

export const STORY_KEYS = {
  all: (characterId: string) => ['stories', characterId] as const,
  detail: (characterId: string, storyId: string) => ['stories', characterId, storyId] as const,
};

export const useStories = (characterId: string) => {
  return useQuery({
    queryKey: STORY_KEYS.all(characterId),
    queryFn: () => readStories(characterId),
    enabled: !!characterId,
  });
};

export const useStory = (characterId: string, storyId: string) => {
  return useQuery({
    queryKey: STORY_KEYS.detail(characterId, storyId),
    queryFn: () => readStory(characterId, storyId),
    enabled: !!characterId && !!storyId,
  });
};

export const useCreateStory = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StoryCreate) => createStory(characterId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORY_KEYS.all(characterId) }),
  });
};

export const useUpdateStory = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: StoryUpdate }) =>
      updateStory(characterId, storyId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORY_KEYS.all(characterId) }),
  });
};

export const useDeleteStory = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => removeStory(characterId, storyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORY_KEYS.all(characterId) }),
  });
};