/**
 * 角色传记读写的宿主侧分派（Phase 13 S13-1）。
 *
 * 与 `assetPoolSaves` / `playerSaves` 同一形状：分派与「写→回读」收在一处，
 * hook 层只管 queryKey 与失效，不掺平台判断；注入点存在是因为 node 测试里没有 `window`，
 * 本地支若不可注入就等于永不被执行。
 *
 * 浏览器支逐字保持原样直连 `storyApi`（web 冻结线不因本地化而改行为）；
 * 桌面支走 L4 契约 + 本地 SQLite——后端退场后传记仍是创作主数据，不能消失。
 * 失败一律 throw：空清单必须真的意味着「这个角色还没传记」。
 */

import type { Story, StoryCreate, StoryListItem, StoryUpdate } from "@/shared/types/story";
import { storyApi } from "@/shared/api/stories";
import { getStorageProvider } from "@/shared/storage";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import type { StorageProvider, StorageResult, StoredStory } from "@axiforge/editor-core";

export const storyDeps: {
  isLocal: () => boolean;
  provider: () => Promise<StorageProvider>;
} = {
  isLocal: isTauriEnvironment,
  provider: getStorageProvider,
};

function unwrap<T>(r: StorageResult<T>, detail: string): T {
  if (!r.ok) throw new Error(`${detail}：${r.error.code}`);
  return r.data;
}

/** 本地库不单独存 created_at；两页均未展示该字段，故等于 updated_at 而非编造一个时间 */
function toStory(s: StoredStory): Story {
  return {
    id: s.id,
    character_id: s.characterId,
    title: s.title,
    content: s.content,
    word_count: s.wordCount,
    sort_order: s.sortOrder,
    created_at: s.updatedAt,
    updated_at: s.updatedAt,
  };
}

function toListItem(s: StoredStory): StoryListItem {
  return {
    id: s.id,
    title: s.title,
    word_count: s.wordCount,
    sort_order: s.sortOrder,
    updated_at: s.updatedAt,
  };
}

export async function readStories(characterId: string): Promise<StoryListItem[]> {
  if (!storyDeps.isLocal()) return storyApi.list(characterId);
  const p = await storyDeps.provider();
  return unwrap(await p.listStories(characterId), "传记清单读取").map(toListItem);
}

export async function readStory(characterId: string, storyId: string): Promise<Story> {
  if (!storyDeps.isLocal()) return storyApi.get(characterId, storyId);
  const p = await storyDeps.provider();
  return toStory(unwrap(await p.getStory(characterId, storyId), "传记读取"));
}

/** 写后回读：本地 saveStory 返回权威 id，页面要的是一条完整记录，不让客户端猜 */
async function reread(characterId: string, id: string): Promise<Story> {
  const p = await storyDeps.provider();
  return toStory(unwrap(await p.getStory(characterId, id), "传记回读"));
}

export async function createStory(characterId: string, data: StoryCreate): Promise<Story> {
  if (!storyDeps.isLocal()) return storyApi.create(characterId, data);
  const p = await storyDeps.provider();
  const saved = unwrap(
    await p.saveStory({
      id: "",
      characterId,
      title: data.title,
      content: data.content ?? "",
      wordCount: 0,
      sortOrder: 0,
      updatedAt: "",
    }),
    "传记创建",
  );
  return reread(characterId, saved.id);
}

export async function updateStory(
  characterId: string,
  storyId: string,
  data: StoryUpdate,
): Promise<Story> {
  if (!storyDeps.isLocal()) return storyApi.update(characterId, storyId, data);
  const p = await storyDeps.provider();
  const current = unwrap(await p.getStory(characterId, storyId), "传记读取");
  unwrap(
    await p.saveStory({
      ...current,
      title: data.title ?? current.title,
      content: data.content ?? current.content,
      sortOrder: data.sort_order ?? current.sortOrder,
    }),
    "传记更新",
  );
  return reread(characterId, storyId);
}

export async function removeStory(characterId: string, storyId: string): Promise<void> {
  if (!storyDeps.isLocal()) return storyApi.delete(characterId, storyId);
  const p = await storyDeps.provider();
  unwrap(await p.deleteStory(characterId, storyId), "传记删除");
}
