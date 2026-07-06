import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storyApi } from '@/api/stories';
import type { StoryCreate, StoryUpdate } from '@/types/story';

export const STORY_KEYS = {
  all: (characterId: string) => ['stories', characterId] as const,
  detail: (characterId: string, storyId: string) => ['stories', characterId, storyId] as const,
};

export const useStories = (characterId: string) => {
  return useQuery({
    queryKey: STORY_KEYS.all(characterId),
    queryFn: () => storyApi.list(characterId),
    enabled: !!characterId,
  });
};

export const useStory = (characterId: string, storyId: string) => {
  return useQuery({
    queryKey: STORY_KEYS.detail(characterId, storyId),
    queryFn: () => storyApi.get(characterId, storyId),
    enabled: !!characterId && !!storyId,
  });
};

export const useCreateStory = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StoryCreate) => storyApi.create(characterId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORY_KEYS.all(characterId) }),
  });
};

export const useUpdateStory = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: StoryUpdate }) =>
      storyApi.update(characterId, storyId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORY_KEYS.all(characterId) }),
  });
};

export const useDeleteStory = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => storyApi.delete(characterId, storyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORY_KEYS.all(characterId) }),
  });
};