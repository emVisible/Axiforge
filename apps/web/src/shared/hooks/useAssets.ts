import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sceneAssetApi, itemApi } from '@/shared/api/editor';
import { getStorageProvider } from '@/shared/storage';
import { isTauriEnvironment } from '@/shared/storage/tauriSqlBackend';
import { storedItemToResponse, storedSceneToResponse } from '@/shared/storage/assetRecords';
import { getCreatorId } from '@/shared/lib/creatorId';
import type {
  AssetSceneCreate, AssetSceneUpdate,
  AssetItemCreate, AssetItemUpdate,
} from '@/shared/types/asset';
import type {
  StoredAssetItem,
  StoredAssetScene,
  VisibilityScope,
} from '@axiforge/editor-core';

/**
 * 道具 / 场景读写的运行环境分派（v0.8 · 宪章 Phase 7）。
 *
 * 桌面走 StorageProvider（本地 SQLite），浏览器保持既有 API 路径逐字不变——
 * 与角色域同一裁决：不在页面上做 if，也不给 web 冻结线填假值。
 * 失败一律 throw，由 TanStack Query 的 error 态呈现，不得降级成空列表。
 */

export const SCENE_ASSET_KEYS = {
  all: ['sceneAssets'] as const,
  list: (filters?: Record<string, unknown>) => ['sceneAssets', 'list', filters] as const,
  detail: (id: string) => ['sceneAssets', 'detail', id] as const,
};

export const ITEM_KEYS = {
  all: ['items'] as const,
  list: (filters?: Record<string, unknown>) => ['items', 'list', filters] as const,
  detail: (id: string) => ['items', 'detail', id] as const,
};

function scopeOf(params?: { author_id?: string; category?: string; search?: string; tags?: string[] }): VisibilityScope {
  return {
    ...(params?.author_id ? { authorId: params.author_id } : {}),
    ...(params?.search ? { search: params.search } : {}),
  };
}

/** 本地无单条读口：按 id 在清单里取，取不到即 not_found（区别于「列表为空」） */
function pickLocal<T extends { id: string }>(rows: T[], id: string, entity: string): T {
  const hit = rows.find((r) => r.id === id);
  if (!hit) throw new Error(`${entity} 读取失败：not_found`);
  return hit;
}

const unwrap = <T>(r: { ok: true; data: T } | { ok: false; error: { code: string } }, what: string): T => {
  if (!r.ok) throw new Error(`${what}失败：${r.error.code}`);
  return r.data;
};

function toStoredItem(
  input: Partial<StoredAssetItem> & { name: string; authorId: string | null },
): StoredAssetItem {
  return {
    id: input.id ?? "",
    name: input.name,
    description: input.description ?? "",
    category: input.category ?? "日常",
    rarity: input.rarity ?? "普通",
    mechanismTags: input.mechanismTags ?? [],
    effects: input.effects ?? [],
    imagePath: input.imagePath ?? null,
    isPublic: input.isPublic ?? false,
    authorId: input.authorId,
    updatedAt: input.updatedAt ?? "",
  };
}

function toStoredScene(
  input: Partial<StoredAssetScene> & { name: string; authorId: string | null },
): StoredAssetScene {
  return {
    id: input.id ?? "",
    name: input.name,
    description: input.description ?? "",
    location: input.location ?? null,
    atmosphere: input.atmosphere ?? null,
    era: input.era ?? null,
    worldSetting: input.worldSetting ?? null,
    rules: input.rules ?? null,
    tags: input.tags ?? [],
    nodeTemplates: input.nodeTemplates ?? [],
    imagePath: input.imagePath ?? null,
    isPublic: input.isPublic ?? false,
    authorId: input.authorId,
    updatedAt: input.updatedAt ?? "",
  };
}

const itemFromBody = (data: AssetItemCreate, authorId: string): StoredAssetItem =>
  toStoredItem({
    name: data.name,
    description: data.description,
    category: data.category,
    rarity: data.rarity,
    mechanismTags: data.mechanism_tags,
    effects: data.effects,
    imagePath: data.image_path ?? null,
    isPublic: data.is_public,
    authorId: data.author_id ?? authorId,
  });

const sceneFromBody = (data: AssetSceneCreate, authorId: string): StoredAssetScene =>
  toStoredScene({
    name: data.name,
    description: data.description,
    location: data.location,
    atmosphere: data.atmosphere,
    era: data.era,
    worldSetting: data.world_setting,
    rules: data.rules,
    tags: data.tags,
    nodeTemplates: data.node_templates,
    imagePath: data.image_path ?? null,
    isPublic: data.is_public,
    authorId: data.author_id ?? authorId,
  });

// ============================================================
// Scene Assets
// ============================================================

export const useSceneAssets = (params?: { author_id?: string; search?: string }) =>
  useQuery({
    queryKey: SCENE_ASSET_KEYS.list(params),
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const rows = unwrap(await p.listScenes(scopeOf(params)), "场景清单读取");
        return rows.map(storedSceneToResponse);
      }
      return sceneAssetApi.list(params);
    },
  });

export const useSceneAsset = (id: string) =>
  useQuery({
    queryKey: SCENE_ASSET_KEYS.detail(id),
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const rows = unwrap(await p.listScenes({ authorId: getCreatorId(), includePublic: true }), "场景读取");
        return storedSceneToResponse(pickLocal(rows, id, "场景"));
      }
      return sceneAssetApi.get(id);
    },
    enabled: !!id,
  });

export const useCreateSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssetSceneCreate) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const authorId = data.author_id ?? getCreatorId();
        const savedId = unwrap(await p.saveScene(sceneFromBody(data, authorId)), "场景保存");
        const rows = unwrap(await p.listScenes({ authorId, includePublic: data.is_public }), "场景回读");
        return storedSceneToResponse(pickLocal(rows, savedId.id, "场景"));
      }
      return sceneAssetApi.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useUpdateSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssetSceneUpdate }) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const rows = unwrap(await p.listScenes({ authorId: getCreatorId(), includePublic: true }), "场景读取");
        const current = pickLocal(rows, id, "场景");
        const saved = unwrap(
          await p.saveScene(
            toStoredScene({
              ...current,
              name: data.name ?? current.name,
              description: data.description ?? current.description,
              location: data.location === undefined ? current.location : data.location,
              atmosphere: data.atmosphere === undefined ? current.atmosphere : data.atmosphere,
              era: data.era === undefined ? current.era : data.era,
              worldSetting: data.world_setting === undefined ? current.worldSetting : data.world_setting,
              rules: data.rules === undefined ? current.rules : data.rules,
              tags: data.tags ?? current.tags,
              nodeTemplates: data.node_templates ?? current.nodeTemplates,
              imagePath: data.image_path === undefined ? current.imagePath : data.image_path,
              isPublic: data.is_public ?? current.isPublic,
              authorId: current.authorId,
            }),
          ),
          "场景保存",
        );
        const owner = current.authorId ?? undefined;
        const after = unwrap(await p.listScenes({ authorId: owner, includePublic: true }), "场景回读");
        return storedSceneToResponse(pickLocal(after, saved.id, "场景"));
      }
      return sceneAssetApi.update(id, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

export const useDeleteSceneAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        unwrap(await p.deleteScene(id), "场景删除");
        return;
      }
      return sceneAssetApi.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all }),
  });
};

// ============================================================
// Items
// ============================================================

export const useItems = (params?: { author_id?: string; category?: string; search?: string }) =>
  useQuery({
    queryKey: ITEM_KEYS.list(params),
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const rows = unwrap(await p.listItems(scopeOf(params)), "道具清单读取");
        const scoped = params?.category
          ? rows.filter((i) => i.category === params.category)
          : rows;
        return scoped.map(storedItemToResponse);
      }
      return itemApi.list(params);
    },
  });

export const useItem = (id: string) =>
  useQuery({
    queryKey: ITEM_KEYS.detail(id),
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const rows = unwrap(await p.listItems({ authorId: getCreatorId(), includePublic: true }), "道具读取");
        return storedItemToResponse(pickLocal(rows, id, "道具"));
      }
      return itemApi.get(id);
    },
    enabled: !!id,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssetItemCreate) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const authorId = data.author_id ?? getCreatorId();
        const saved = unwrap(await p.saveItem(itemFromBody(data, authorId)), "道具保存");
        const rows = unwrap(await p.listItems({ authorId, includePublic: data.is_public }), "道具回读");
        return storedItemToResponse(pickLocal(rows, saved.id, "道具"));
      }
      return itemApi.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssetItemUpdate }) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const rows = unwrap(await p.listItems({ authorId: getCreatorId(), includePublic: true }), "道具读取");
        const current = pickLocal(rows, id, "道具");
        const saved = unwrap(
          await p.saveItem(
            toStoredItem({
              ...current,
              name: data.name ?? current.name,
              description: data.description ?? current.description,
              category: data.category ?? current.category,
              rarity: data.rarity ?? current.rarity,
              mechanismTags: data.mechanism_tags ?? current.mechanismTags,
              effects: data.effects ?? current.effects,
              imagePath: data.image_path === undefined ? current.imagePath : data.image_path,
              isPublic: data.is_public ?? current.isPublic,
              authorId: current.authorId,
            }),
          ),
          "道具保存",
        );
        const after = unwrap(await p.listItems({ authorId: current.authorId ?? undefined, includePublic: true }), "道具回读");
        return storedItemToResponse(pickLocal(after, saved.id, "道具"));
      }
      return itemApi.update(id, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        unwrap(await p.deleteItem(id), "道具删除");
        return;
      }
      return itemApi.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};
