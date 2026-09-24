import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createItem,
  createScene,
  readItem,
  readItems,
  readScene,
  readScenes,
  removeItem,
  removeScene,
  updateItem,
  updateScene,
} from "@/shared/storage/assetPoolSaves";
import { getCreatorId } from "@/shared/lib/creatorId";
import type {
  AssetSceneCreate, AssetSceneUpdate,
  AssetItemCreate, AssetItemUpdate,
} from "@/shared/types/asset";

/**
 * 道具 / 场景的数据入口。
 *
 * 平台分派与「写→回读」都在 assetPoolSaves，本文件只管 queryKey 与失效范围——
 * 与角色域同一分层：hook 不掺 if (isTauri)。
 */

export const SCENE_ASSET_KEYS = {
  all: ["sceneAssets"] as const,
  list: (filters?: Record<string, unknown>) => ["sceneAssets", "list", filters] as const,
  detail: (id: string) => ["sceneAssets", "detail", id] as const,
};

export const ITEM_KEYS = {
  all: ["items"] as const,
  list: (filters?: Record<string, unknown>) => ["items", "list", filters] as const,
  detail: (id: string) => ["items", "detail", id] as const,
};

export const useSceneAssets = (params?: { author_id?: string; search?: string }) =>
  useQuery({
    queryKey: SCENE_ASSET_KEYS.list(params),
    queryFn: () =>
      readScenes({ authorId: params?.author_id, search: params?.search }),
  });

export const useSceneAsset = (id: string) =>
  useQuery({
    queryKey: SCENE_ASSET_KEYS.detail(id),
    queryFn: () => readScene(id, getCreatorId()),
    enabled: !!id,
  });

export const useCreateSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetSceneCreate) => createScene(data, getCreatorId()),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useUpdateSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetSceneUpdate }) =>
      updateScene(id, data, getCreatorId()),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useDeleteSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeScene(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useItems = (params?: { author_id?: string; category?: string; search?: string }) =>
  useQuery({
    queryKey: ITEM_KEYS.list(params),
    queryFn: () =>
      readItems({
        authorId: params?.author_id,
        category: params?.category,
        search: params?.search,
      }),
  });

export const useItem = (id: string) =>
  useQuery({
    queryKey: ITEM_KEYS.detail(id),
    queryFn: () => readItem(id, getCreatorId()),
    enabled: !!id,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetItemCreate) => createItem(data, getCreatorId()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetItemUpdate }) =>
      updateItem(id, data, getCreatorId()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};
