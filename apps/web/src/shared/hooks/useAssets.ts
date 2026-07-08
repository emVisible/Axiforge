import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sceneAssetApi, itemApi } from '@/shared/api/editor';
import type {
  AssetSceneCreate, AssetSceneUpdate,
  AssetItemCreate, AssetItemUpdate,
} from '@/shared/types/asset';

// ============================================================
// Scene Assets
// ============================================================

export const SCENE_ASSET_KEYS = {
  all: ['sceneAssets'] as const,
  list: (filters?: Record<string, unknown>) => ['sceneAssets', 'list', filters] as const,
  detail: (id: string) => ['sceneAssets', 'detail', id] as const,
};

export const useSceneAssets = (params?: { author_id?: string }) =>
  useQuery({
    queryKey: SCENE_ASSET_KEYS.list(params),
    queryFn: () => sceneAssetApi.list(params),
  });

export const useSceneAsset = (id: string) =>
  useQuery({
    queryKey: SCENE_ASSET_KEYS.detail(id),
    queryFn: () => sceneAssetApi.get(id),
    enabled: !!id,
  });

export const useCreateSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetSceneCreate) => sceneAssetApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useUpdateSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetSceneUpdate }) =>
      sceneAssetApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useDeleteSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sceneAssetApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

// ============================================================
// Items
// ============================================================

export const ITEM_KEYS = {
  all: ['items'] as const,
  list: (filters?: Record<string, unknown>) => ['items', 'list', filters] as const,
  detail: (id: string) => ['items', 'detail', id] as const,
};

export const useItems = (params?: { author_id?: string; category?: string }) =>
  useQuery({
    queryKey: ITEM_KEYS.list(params),
    queryFn: () => itemApi.list(params),
  });

export const useItem = (id: string) =>
  useQuery({
    queryKey: ITEM_KEYS.detail(id),
    queryFn: () => itemApi.get(id),
    enabled: !!id,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetItemCreate) => itemApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetItemUpdate }) =>
      itemApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};
