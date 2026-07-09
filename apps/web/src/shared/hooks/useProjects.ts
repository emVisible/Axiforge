
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/shared/api/editor';
import type { ProjectCreate, ProjectUpdate } from '@/shared/types';

export const PROJECT_KEYS = {
  all: ['projects'] as const,
  list: (filters?: Record<string, unknown>) => ['projects', 'list', filters] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export const useProjects = (params?: { author_id?: string }) =>
  useQuery({
    queryKey: PROJECT_KEYS.list(params),
    queryFn: () => projectApi.list(params),
  });

export const useProject = (id: string) =>
  useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => projectApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreate) => projectApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  });
};
