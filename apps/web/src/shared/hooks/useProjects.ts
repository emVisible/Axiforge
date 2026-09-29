
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/shared/api/editor';
import { getCreatorId } from '@/shared/lib/creatorId';
import { getStorageProvider, projectMetaToResponse } from '@/shared/storage';
import { createProject as dispatchCreate, deleteProject as dispatchDelete } from '@/shared/storage/projectSaves';
import { isTauriEnvironment } from '@/shared/storage/tauriSqlBackend';
import type { ProjectCreate } from '@/shared/types';

export const PROJECT_KEYS = {
  all: ['projects'] as const,
  list: (filters?: Record<string, unknown>) => ['projects', 'list', filters] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

/**
 * 工程清单：桌面走本地 Provider（断网可列出，实测此前列表查询直连 HTTP 导致首屏空），
 * 浏览器保持既有 API 路径逐字不变。
 */
export const useProjects = (params?: { author_id?: string }) =>
  useQuery({
    queryKey: PROJECT_KEYS.list(params),
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const r = await p.listProjects();
        if (!r.ok) throw new Error(`工程清单读取失败：${r.error.code}`);
        const authorId = params?.author_id ?? getCreatorId();
        return r.data.map((m) => projectMetaToResponse(m, authorId));
      }
      return projectApi.list(params);
    },
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreate) => dispatchCreate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dispatchDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  });
};
