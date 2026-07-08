import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { characterApi } from '@/shared/api/characters';
import { getPlayerToken } from '@/shared/lib/playerToken';
import type { CharacterCreate, CharacterUpdate, ForkRequest } from '@/shared/types/character';

export const CHARACTER_KEYS = {
  all: ['characters'] as const,
  public: (params?: Record<string, any>) => ['characters', 'public', params] as const,
  detail: (id: string) => ['characters', 'detail', id] as const,
  user: (authorId: string) => ['characters', 'user', authorId] as const,
  forkChain: (id: string) => ['characters', 'forkChain', id] as const,
};

export const usePublicCharacters = (params?: {
  skip?: number; limit?: number; search?: string; tags?: string; sort?: string;
}) => {
  return useQuery({
    queryKey: CHARACTER_KEYS.public(params),
    queryFn: () => characterApi.listPublic(params),
  });
};

export const useUserCharacters = (authorId: string) => {
  return useQuery({
    queryKey: CHARACTER_KEYS.user(authorId),
    queryFn: () => characterApi.listUser(authorId),
    enabled: !!authorId,
  });
};

export const useCharacter = (id: string, options?: { bumpView?: boolean }) => {
  return useQuery({
    queryKey: [...CHARACTER_KEYS.detail(id), options?.bumpView ?? false],
    queryFn: () =>
      characterApi.get(id, {
        bump_view: options?.bumpView,
        viewer_token: options?.bumpView ? getPlayerToken() : undefined,
      }),
    enabled: !!id,
  });
};

export const useCreateCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CharacterCreate) => characterApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.all });
      if (variables.author_id) {
        queryClient.invalidateQueries({
          queryKey: CHARACTER_KEYS.user(variables.author_id),
        });
      }
    },
  });
};

export const useUpdateCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CharacterUpdate }) =>
      characterApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['characters', 'public'] });
    },
  });
};

export const useDeleteCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => characterApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.all });
    },
  });
};

export const useForkCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, forkRequest }: { id: string; forkRequest?: ForkRequest }) =>
      characterApi.fork(id, forkRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.all });
    },
  });
};

export const useForkChain = (id: string) => {
  return useQuery({
    queryKey: CHARACTER_KEYS.forkChain(id),
    queryFn: () => characterApi.getForkChain(id),
    enabled: !!id,
  });
};