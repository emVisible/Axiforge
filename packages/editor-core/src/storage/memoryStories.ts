/**
 * MemoryStorageProvider 的角色传记域，与 SQLite 侧 `sqlite/stories.ts` 对应。
 *
 * 刻意不塞进 `memoryPools`：那个模块的名字与文档说的是「资产池与运行时状态」，
 * 传记属于角色主数据——多塞进去会让模块描述变成谎话。
 */

import type { StorageResult, StoredStory } from "./types";
import { err, ok } from "./types";
import { storyWordCount } from "./records";

export class MemoryStories {
  constructor(private readonly nextId: (prefix: string) => string) {}

  private rows = new Map<string, StoredStory>();

  /** 归属即隔离：列表与单条读都带 characterId 条件，跨角色读不到也不报错 */
  async listStories(characterId: string): Promise<StorageResult<StoredStory[]>> {
    const list = [...this.rows.values()].filter((s) => s.characterId === characterId);
    list.sort(
      (a, b) => a.sortOrder - b.sortOrder || b.updatedAt.localeCompare(a.updatedAt),
    );
    return ok(list.map((s) => ({ ...s })));
  }

  async getStory(characterId: string, id: string): Promise<StorageResult<StoredStory>> {
    const row = this.rows.get(id);
    if (!row || row.characterId !== characterId) {
      return err({ code: "not_found", entity: "story", id });
    }
    return ok({ ...row });
  }

  /** upsert；wordCount 一律由 content 重算，入参值不采信（与 SQLite 侧同一裁决） */
  async saveStory(story: StoredStory): Promise<StorageResult<{ id: string }>> {
    const id = story.id || this.nextId("story");
    const existing = story.id ? this.rows.get(story.id) : undefined;
    if (story.id && (!existing || existing.characterId !== story.characterId)) {
      return err({ code: "not_found", entity: "story", id: story.id });
    }
    const content = story.content ?? "";
    this.rows.set(id, {
      id,
      characterId: story.characterId,
      title: story.title,
      content,
      wordCount: storyWordCount(content),
      sortOrder: story.sortOrder ?? 0,
      updatedAt: new Date().toISOString(),
    });
    return ok({ id });
  }

  async deleteStory(characterId: string, id: string): Promise<StorageResult<void>> {
    const row = this.rows.get(id);
    if (!row || row.characterId !== characterId) {
      return err({ code: "not_found", entity: "story", id });
    }
    this.rows.delete(id);
    return ok(undefined);
  }
}
