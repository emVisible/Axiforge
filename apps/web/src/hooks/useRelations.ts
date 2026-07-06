import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationApi } from '@/api/relations';
import type { RelationCreate } from '@/types/character';

export const RELATION_KEYS = {
  all: (characterId: string) => ['relations', characterId] as const,
  graph: (characterId: string) => ['relations', 'graph', characterId] as const,
  presets: ['relations', 'presets'] as const,
};

export const useRelations = (characterId: string) => {
  return useQuery({
    queryKey: RELATION_KEYS.all(characterId),
    queryFn: () => relationApi.list(characterId),
    enabled: !!characterId,
  });
};

export const useRelationGraph = (characterId: string) => {
  return useQuery({
    queryKey: RELATION_KEYS.graph(characterId),
    queryFn: () => relationApi.graph(characterId),
    enabled: !!characterId,
  });
};

export const useCreateRelation = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RelationCreate) => relationApi.create(characterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATION_KEYS.all(characterId) });
      queryClient.invalidateQueries({ queryKey: RELATION_KEYS.graph(characterId) });
    },
  });
};

export const useDeleteRelation = (characterId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (relationId: string) => relationApi.delete(characterId, relationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATION_KEYS.all(characterId) });
      queryClient.invalidateQueries({ queryKey: RELATION_KEYS.graph(characterId) });
    },
  });
};

export const useRelationPresets = () => {
  return useQuery({
    queryKey: RELATION_KEYS.presets,
    queryFn: () => relationApi.presets(),
    staleTime: Infinity,
  });
};