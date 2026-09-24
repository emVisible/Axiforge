/**
 * HttpStorageProvider 的四个新增域实现（道具 / 场景 / 存档 / 成就）。
 *
 * 独立成模块只为守住 G1 行数预算——httpStorageProvider 本体已有工程与角色两域，
 * 再塞四个域会重新长出巨石。语义仍是「L4 契约的 HTTP 实现」，与主文件同一裁决。
 *
 * 范围语义与桌面端一致：「我的 ∪ 公开」两次请求按 id 合并去重，
 * 由 editor-core 的 filterByVisibility 单点裁决，不在此处各写一遍 if。
 */

import { itemApi, sceneAssetApi } from "@/shared/api/editor";
import { playerApi, type SaveSlotResponse } from "@/shared/api/player";
import { ginkgoApi, type AchievementDef, type PlayerAchievement } from "@/shared/api/ginkgo";
import type { AssetItemResponse, AssetSceneResponse } from "@/shared/types/asset";
import type {
  LocalSaveSlot,
  SaveSlotInput,
  StoredAchievement,
  StoredAssetItem,
  StoredAssetScene,
  StorageResult,
  UnlockedAchievement,
  VisibilityScope,
} from "@axiforge/editor-core";
import { err, filterByVisibility, ok } from "@axiforge/editor-core";

function fail<T>(e: unknown, entity: string, id: string): StorageResult<T> {
  const status = (e as { status?: number })?.status;
  if (status === 404) return err({ code: "not_found", entity, id });
  return err({
    code: "io",
    detail: `${entity} 请求失败${status ? ` (HTTP ${status})` : ""}`,
    cause: e,
  });
}

const toStoredItem = (r: AssetItemResponse): StoredAssetItem => ({
  id: String(r.id),
  name: r.name,
  description: r.description ?? "",
  category: r.category,
  rarity: r.rarity,
  mechanismTags: r.mechanism_tags ?? [],
  effects: r.effects ?? [],
  imagePath: r.image_path ?? null,
  isPublic: r.is_public ?? false,
  authorId: r.author_id ?? null,
  updatedAt: r.updated_at,
});

const itemBody = (i: StoredAssetItem, creatorId: string) => ({
  name: i.name,
  description: i.description,
  category: i.category,
  rarity: i.rarity,
  mechanism_tags: [...i.mechanismTags],
  effects: [...i.effects],
  image_path: i.imagePath,
  is_public: i.isPublic,
  author_id: i.authorId ?? creatorId,
});

const toStoredScene = (r: AssetSceneResponse): StoredAssetScene => ({
  id: String(r.id),
  name: r.name,
  description: r.description ?? "",
  location: r.location ?? null,
  atmosphere: r.atmosphere ?? null,
  era: r.era ?? null,
  worldSetting: r.world_setting ?? null,
  rules: r.rules ?? null,
  tags: r.tags ?? [],
  nodeTemplates: r.node_templates ?? [],
  imagePath: r.image_path ?? null,
  isPublic: r.is_public ?? false,
  authorId: r.author_id ?? null,
  updatedAt: r.updated_at,
});

const sceneBody = (s: StoredAssetScene, creatorId: string) => ({
  name: s.name,
  description: s.description,
  location: s.location,
  atmosphere: s.atmosphere,
  era: s.era,
  world_setting: s.worldSetting,
  rules: s.rules,
  tags: [...s.tags],
  node_templates: [...s.nodeTemplates],
  image_path: s.imagePath,
  is_public: s.isPublic,
  author_id: s.authorId ?? creatorId,
});

const toSaveSlot = (r: SaveSlotResponse): LocalSaveSlot => ({
  slot: r.slot,
  state: (r.state ?? {}) as unknown as Record<string, unknown>,
  summary: r.summary ?? null,
  beatId: r.beat_id ?? null,
  thumbRef: r.thumb_path ?? null,
  updatedAt: r.updated_at ?? "",
});

/** 「我的 ∪ 公开」：两次请求按 id 合并，再交给单点范围裁决 */
async function fetchPool<T>(
  scope: VisibilityScope | undefined,
  mine: () => Promise<T[]>,
  shared: () => Promise<T[]>,
): Promise<T[]> {
  const authorId = scope?.authorId ?? null;
  const includePublic = scope?.includePublic ?? authorId === null;
  const merged = new Map<string, T>();
  if (authorId !== null) for (const r of await mine()) merged.set(String((r as { id: string | number }).id), r);
  if (includePublic) for (const r of await shared()) merged.set(String((r as { id: string | number }).id), r);
  return [...merged.values()];
}

export async function httpListItems(
  scope: VisibilityScope | undefined,
): Promise<StorageResult<StoredAssetItem[]>> {
  try {
    const rows = await fetchPool(
      scope,
      () => itemApi.list({ author_id: scope?.authorId ?? undefined, search: scope?.search }),
      () => itemApi.list({ search: scope?.search }),
    );
    return ok(filterByVisibility(rows.map(toStoredItem), scope));
  } catch (e) {
    return fail(e, "items", scope?.authorId ?? "public");
  }
}

export async function httpSaveItem(
  item: StoredAssetItem,
  creatorId: string,
): Promise<StorageResult<{ id: string }>> {
  try {
    if (item.id) {
      await itemApi.update(item.id, itemBody(item, creatorId) as never);
      return ok({ id: item.id });
    }
    const created = await itemApi.create(itemBody(item, creatorId) as never);
    return ok({ id: String(created.id) });
  } catch (e) {
    return fail(e, "item", item.id || "(new)");
  }
}

export async function httpDeleteItem(id: string): Promise<StorageResult<void>> {
  try {
    await itemApi.delete(id);
    return ok(undefined);
  } catch (e) {
    return fail(e, "item", id);
  }
}

export async function httpListScenes(
  scope: VisibilityScope | undefined,
): Promise<StorageResult<StoredAssetScene[]>> {
  try {
    const rows = await fetchPool(
      scope,
      () => sceneAssetApi.list({ author_id: scope?.authorId ?? undefined, search: scope?.search }),
      () => sceneAssetApi.list({ search: scope?.search }),
    );
    return ok(filterByVisibility(rows.map(toStoredScene), scope));
  } catch (e) {
    return fail(e, "scenes", scope?.authorId ?? "public");
  }
}

export async function httpSaveScene(
  scene: StoredAssetScene,
  creatorId: string,
): Promise<StorageResult<{ id: string }>> {
  try {
    if (scene.id) {
      await sceneAssetApi.update(scene.id, sceneBody(scene, creatorId) as never);
      return ok({ id: scene.id });
    }
    const created = await sceneAssetApi.create(sceneBody(scene, creatorId) as never);
    return ok({ id: String(created.id) });
  } catch (e) {
    return fail(e, "scene", scene.id || "(new)");
  }
}

export async function httpDeleteScene(id: string): Promise<StorageResult<void>> {
  try {
    await sceneAssetApi.delete(id);
    return ok(undefined);
  } catch (e) {
    return fail(e, "scene", id);
  }
}

export async function httpListSaves(
  projectId: string,
  playerToken: string,
): Promise<StorageResult<LocalSaveSlot[]>> {
  try {
    const rows = await playerApi.listSaves(projectId, playerToken);
    return ok(rows.map(toSaveSlot));
  } catch (e) {
    return fail(e, "save_slots", projectId);
  }
}

export async function httpGetSave(
  projectId: string,
  playerToken: string,
  slot = 0,
): Promise<StorageResult<LocalSaveSlot>> {
  try {
    return ok(toSaveSlot(await playerApi.getSave(projectId, playerToken, slot)));
  } catch (e) {
    return fail(e, "save_slot", `${projectId}/${slot}`);
  }
}

export async function httpWriteSave(
  projectId: string,
  playerToken: string,
  input: SaveSlotInput,
): Promise<StorageResult<LocalSaveSlot>> {
  try {
    const r = await playerApi.putSave(projectId, {
      player_token: playerToken,
      state: input.state as never,
      summary: input.summary,
      beat_id: input.beatId,
      thumb_path: input.thumbRef,
      slot: input.slot ?? 0,
    });
    return ok(toSaveSlot(r));
  } catch (e) {
    return fail(e, "save_slot", `${projectId}/${input.slot ?? 0}`);
  }
}

export async function httpClearSave(
  projectId: string,
  playerToken: string,
  slot = 0,
): Promise<StorageResult<void>> {
  try {
    await playerApi.clearSave(projectId, playerToken, slot);
    return ok(undefined);
  } catch (e) {
    return fail(e, "save_slot", `${projectId}/${slot}`);
  }
}

const toAchievement = (d: AchievementDef): StoredAchievement => ({
  id: String(d.id),
  key: d.key,
  title: d.title,
  description: d.description ?? "",
  icon: d.icon ?? "star",
  condition: d.condition ?? {},
});

const unlockedKey = (p: PlayerAchievement): string =>
  p.achievement?.key ?? p.achievement_id;

export async function httpListAchievements(
  projectId: string,
): Promise<StorageResult<StoredAchievement[]>> {
  try {
    const page = await ginkgoApi.list(projectId);
    return ok((page.items ?? []).map(toAchievement));
  } catch (e) {
    return fail(e, "achievements", projectId);
  }
}

export async function httpSaveAchievement(
  projectId: string,
  achievement: StoredAchievement,
): Promise<StorageResult<StoredAchievement>> {
  try {
    const body = {
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      condition: achievement.condition,
    };
    const r = achievement.id
      ? await ginkgoApi.update(achievement.id, body as never)
      : await ginkgoApi.create(projectId, body as never);
    return ok(toAchievement(r));
  } catch (e) {
    return fail(e, "achievement", achievement.id || achievement.key);
  }
}

export async function httpDeleteAchievement(
  _projectId: string,
  id: string,
): Promise<StorageResult<void>> {
  try {
    await ginkgoApi.remove(id);
    return ok(undefined);
  } catch (e) {
    return fail(e, "achievement", id);
  }
}

export async function httpUnlockAchievement(
  projectId: string,
  playerToken: string,
  key: string,
): Promise<StorageResult<void>> {
  try {
    await ginkgoApi.unlock(projectId, playerToken, key);
    return ok(undefined);
  } catch (e) {
    return fail(e, "achievement", `${projectId}/${key}`);
  }
}

export async function httpListUnlocked(
  projectId: string,
  playerToken: string,
): Promise<StorageResult<UnlockedAchievement[]>> {
  try {
    const rows = await ginkgoApi.playerList(projectId, playerToken);
    return ok(
      rows.map((r) => ({ key: unlockedKey(r), unlockedAt: r.unlocked_at })),
    );
  } catch (e) {
    return fail(e, "player_achievements", projectId);
  }
}
