/**
 * 道具 / 场景全局资产池的宿主侧读写分派（v0.8 · 宪章 Phase 7）。
 *
 * 与 playerSaves / achievementDefs 同一形状：分派与「写→回读」收在一处，
 * hook 层只负责 queryKey 与失效，不掺平台判断。
 * 之所以要有注入点：node 测试环境下没有 `window`，本地支若不可注入就等于永不被执行。
 *
 * 失败一律 throw——空列表必须真的意味着「没有条目」，不能意味着「我没读到」。
 */

import type {
  AssetItemCreate,
  AssetItemResponse,
  AssetItemUpdate,
  AssetSceneCreate,
  AssetSceneResponse,
  AssetSceneUpdate,
} from "@/shared/types/asset";
import { itemApi, sceneAssetApi } from "@/shared/api/editor";
import { getStorageProvider } from "@/shared/storage";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import { storedItemToResponse, storedSceneToResponse } from "@/shared/storage/assetRecords";
import type {
  StorageProvider,
  StoredAssetItem,
  StoredAssetScene,
  VisibilityScope,
} from "@axiforge/editor-core";

export const assetPoolDeps: {
  isLocal: () => boolean;
  provider: () => Promise<StorageProvider>;
} = {
  isLocal: isTauriEnvironment,
  provider: getStorageProvider,
};

export interface PoolFilters {
  authorId?: string;
  search?: string;
  category?: string;
}

const unwrap = <T>(
  r: { ok: true; data: T } | { ok: false; error: { code: string } },
  what: string,
): T => {
  if (!r.ok) throw new Error(`${what}失败：${r.error.code}`);
  return r.data;
};

const scopeOf = (f: PoolFilters | undefined, includePublic = true): VisibilityScope => ({
  ...(f?.authorId ? { authorId: f.authorId } : {}),
  includePublic,
  ...(f?.search ? { search: f.search } : {}),
});

function pick<T extends { id: string }>(rows: T[], id: string, entity: string): T {
  const hit = rows.find((r) => r.id === id);
  if (!hit) throw new Error(`${entity}回读失败：not_found`);
  return hit;
}

// ---------- 道具 ----------

export async function readItems(filters?: PoolFilters): Promise<AssetItemResponse[]> {
  if (!assetPoolDeps.isLocal()) {
    return itemApi.list({
      ...(filters?.authorId ? { author_id: filters.authorId } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.search ? { search: filters.search } : {}),
    });
  }
  const p = await assetPoolDeps.provider();
  const rows = unwrap(await p.listItems(scopeOf(filters)), "道具清单读取");
  const scoped = filters?.category ? rows.filter((i) => i.category === filters.category) : rows;
  return scoped.map(storedItemToResponse);
}

export async function readItem(id: string, authorId: string): Promise<AssetItemResponse> {
  if (!assetPoolDeps.isLocal()) return itemApi.get(id);
  const p = await assetPoolDeps.provider();
  const rows = unwrap(await p.listItems({ authorId, includePublic: true }), "道具读取");
  return storedItemToResponse(pick(rows, id, "道具"));
}

const NEW_ITEM: Omit<StoredAssetItem, "name" | "authorId"> = {
  id: "",
  description: "",
  category: "日常",
  rarity: "普通",
  mechanismTags: [],
  effects: [],
  imagePath: null,
  isPublic: false,
  updatedAt: "",
};

export async function createItem(
  data: AssetItemCreate,
  authorId: string,
): Promise<AssetItemResponse> {
  if (!assetPoolDeps.isLocal()) return itemApi.create(data);
  const p = await assetPoolDeps.provider();
  const owner = data.author_id ?? authorId;
  const stored: StoredAssetItem = {
    ...NEW_ITEM,
    name: data.name,
    description: data.description ?? "",
    category: data.category ?? NEW_ITEM.category,
    rarity: data.rarity ?? NEW_ITEM.rarity,
    mechanismTags: data.mechanism_tags ?? [],
    effects: data.effects ?? [],
    imagePath: data.image_path ?? null,
    isPublic: data.is_public ?? false,
    authorId: owner,
  };
  const saved = unwrap(await p.saveItem(stored), "道具保存");
  const rows = unwrap(await p.listItems(scopeOf({ authorId: owner })), "道具回读");
  return storedItemToResponse(pick(rows, saved.id, "道具"));
}

export async function updateItem(
  id: string,
  data: AssetItemUpdate,
  authorId: string,
): Promise<AssetItemResponse> {
  if (!assetPoolDeps.isLocal()) return itemApi.update(id, data);
  const p = await assetPoolDeps.provider();
  const rows = unwrap(await p.listItems(scopeOf({ authorId }, true)), "道具读取");
  const current = pick(rows, id, "道具");
  const merged: StoredAssetItem = {
    ...current,
    name: data.name ?? current.name,
    description: data.description ?? current.description,
    category: data.category ?? current.category,
    rarity: data.rarity ?? current.rarity,
    mechanismTags: data.mechanism_tags ?? current.mechanismTags,
    effects: data.effects ?? current.effects,
    imagePath: data.image_path === undefined ? current.imagePath : data.image_path,
    isPublic: data.is_public ?? current.isPublic,
  };
  const saved = unwrap(await p.saveItem(merged), "道具保存");
  const after = unwrap(await p.listItems(scopeOf({ authorId: current.authorId ?? authorId })), "道具回读");
  return storedItemToResponse(pick(after, saved.id, "道具"));
}

export async function removeItem(id: string): Promise<void> {
  if (!assetPoolDeps.isLocal()) {
    await itemApi.delete(id);
    return;
  }
  const p = await assetPoolDeps.provider();
  unwrap(await p.deleteItem(id), "道具删除");
}

// ---------- 场景 ----------

export async function readScenes(filters?: PoolFilters): Promise<AssetSceneResponse[]> {
  if (!assetPoolDeps.isLocal()) {
    return sceneAssetApi.list({
      ...(filters?.authorId ? { author_id: filters.authorId } : {}),
      ...(filters?.search ? { search: filters.search } : {}),
    });
  }
  const p = await assetPoolDeps.provider();
  const rows = unwrap(await p.listScenes(scopeOf(filters)), "场景清单读取");
  return rows.map(storedSceneToResponse);
}

export async function readScene(id: string, authorId: string): Promise<AssetSceneResponse> {
  if (!assetPoolDeps.isLocal()) return sceneAssetApi.get(id);
  const p = await assetPoolDeps.provider();
  const rows = unwrap(await p.listScenes({ authorId, includePublic: true }), "场景读取");
  return storedSceneToResponse(pick(rows, id, "场景"));
}

const NEW_SCENE: Omit<StoredAssetScene, "name" | "authorId"> = {
  id: "",
  description: "",
  location: null,
  atmosphere: null,
  era: null,
  worldSetting: null,
  rules: null,
  tags: [],
  nodeTemplates: [],
  imagePath: null,
  isPublic: false,
  updatedAt: "",
};

export async function createScene(
  data: AssetSceneCreate,
  authorId: string,
): Promise<AssetSceneResponse> {
  if (!assetPoolDeps.isLocal()) return sceneAssetApi.create(data);
  const p = await assetPoolDeps.provider();
  const owner = data.author_id ?? authorId;
  const stored: StoredAssetScene = {
    ...NEW_SCENE,
    name: data.name,
    description: data.description ?? "",
    location: data.location ?? null,
    atmosphere: data.atmosphere ?? null,
    era: data.era ?? null,
    worldSetting: data.world_setting ?? null,
    rules: data.rules ?? null,
    tags: data.tags ?? [],
    nodeTemplates: data.node_templates ?? [],
    imagePath: data.image_path ?? null,
    isPublic: data.is_public ?? false,
    authorId: owner,
  };
  const saved = unwrap(await p.saveScene(stored), "场景保存");
  const rows = unwrap(await p.listScenes(scopeOf({ authorId: owner })), "场景回读");
  return storedSceneToResponse(pick(rows, saved.id, "场景"));
}

export async function updateScene(
  id: string,
  data: AssetSceneUpdate,
  authorId: string,
): Promise<AssetSceneResponse> {
  if (!assetPoolDeps.isLocal()) return sceneAssetApi.update(id, data);
  const p = await assetPoolDeps.provider();
  const rows = unwrap(await p.listScenes(scopeOf({ authorId })), "场景读取");
  const current = pick(rows, id, "场景");
  const merged: StoredAssetScene = {
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
  };
  const saved = unwrap(await p.saveScene(merged), "场景保存");
  const after = unwrap(await p.listScenes(scopeOf({ authorId: current.authorId ?? authorId })), "场景回读");
  return storedSceneToResponse(pick(after, saved.id, "场景"));
}

export async function removeScene(id: string): Promise<void> {
  if (!assetPoolDeps.isLocal()) {
    await sceneAssetApi.delete(id);
    return;
  }
  const p = await assetPoolDeps.provider();
  unwrap(await p.deleteScene(id), "场景删除");
}
