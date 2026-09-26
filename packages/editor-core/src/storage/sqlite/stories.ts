/**
 * 角色传记的 SQLite 落地（Phase 13 S13-1）。
 *
 * 独立成模块与 `assetPool.ts` 同一理由：纯 CRUD 行编解码、与叙事图无耦合，
 * 且 `sqliteProvider` 受 G1 行数预算约束。
 *
 * 归属语义与后端不同处：本地表 `character_id` 是硬隔离边界——跨角色读写别人的
 * 传记 id 一律 not_found，而不是「知道 id 就能读」。后端靠鉴权做这件事，
 * 桌面单用户没有鉴权层，只能靠查询条件本身。
 */

import type { StorageResult, StoredStory } from "../types";
import { err, ok } from "../types";
import { storyWordCount } from "../records";
import type { SqlBackend } from "./backend";
import { nowIso, uuid } from "./rows";

interface StoryRow {
  id: string;
  character_id: string;
  title: string;
  content: string;
  sort_order: number;
  updated_at: string;
}

const STORY_COLS = `id, character_id, title, content, sort_order, updated_at`;

function toStory(r: StoryRow): StoredStory {
  return {
    id: r.id,
    characterId: r.character_id,
    title: r.title,
    content: r.content,
    wordCount: storyWordCount(r.content),
    sortOrder: Number(r.sort_order) || 0,
    updatedAt: r.updated_at,
  };
}

export async function listStories(
  backend: SqlBackend,
  characterId: string,
): Promise<StorageResult<StoredStory[]>> {
  try {
    const rows = await backend.select<StoryRow>(
      `SELECT ${STORY_COLS} FROM character_stories WHERE character_id = ?
       ORDER BY sort_order ASC, updated_at DESC`,
      [characterId],
    );
    return ok(rows.map(toStory));
  } catch (cause) {
    return err({ code: "io", detail: "listStories 失败", cause });
  }
}

export async function getStory(
  backend: SqlBackend,
  characterId: string,
  id: string,
): Promise<StorageResult<StoredStory>> {
  try {
    const rows = await backend.select<StoryRow>(
      `SELECT ${STORY_COLS} FROM character_stories WHERE id = ? AND character_id = ?`,
      [id, characterId],
    );
    if (!rows.length) return err({ code: "not_found", entity: "story", id });
    return ok(toStory(rows[0]!));
  } catch (cause) {
    return err({ code: "io", detail: "getStory 失败", cause });
  }
}

/** upsert。id 为空则新建；更新时只认 (id, character_id) 命中的那一行 */
export async function saveStory(
  backend: SqlBackend,
  story: StoredStory,
): Promise<StorageResult<{ id: string }>> {
  const updatedAt = nowIso();
  try {
    if (story.id) {
      const r = await backend.execute(
        `UPDATE character_stories
         SET title = ?, content = ?, sort_order = ?, updated_at = ?
         WHERE id = ? AND character_id = ?`,
        [story.title, story.content, story.sortOrder, updatedAt, story.id, story.characterId],
      );
      if (!r.rowsAffected) return err({ code: "not_found", entity: "story", id: story.id });
      return ok({ id: story.id });
    }

    const id = uuid();
    await backend.execute(
      `INSERT INTO character_stories
       (id, character_id, title, content, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, story.characterId, story.title, story.content, story.sortOrder, updatedAt],
    );
    return ok({ id });
  } catch (cause) {
    return err({ code: "io", detail: "saveStory 失败", cause });
  }
}

export async function deleteStory(
  backend: SqlBackend,
  characterId: string,
  id: string,
): Promise<StorageResult<void>> {
  try {
    const r = await backend.execute(
      `DELETE FROM character_stories WHERE id = ? AND character_id = ?`,
      [id, characterId],
    );
    return r.rowsAffected > 0
      ? ok(undefined)
      : err({ code: "not_found", entity: "story", id });
  } catch (cause) {
    return err({ code: "io", detail: "deleteStory 失败", cause });
  }
}
