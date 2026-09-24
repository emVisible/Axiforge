/**
 * 运行时状态（存档 / 成就）的 SQLite 落地——桌面断网可存可读（宪章 Phase 7）。
 *
 * 键语义与 backend 对齐：存档按 (project, player_token, slot) 唯一；
 * 解锁记录按 **key** 而非 id 关联，因为重新导入工程会产生新 id，
 * key 才是玩家已达成这一事实的稳定标识。
 */

import type {
  LocalSaveSlot,
  SaveSlotInput,
  StoredAchievement,
  StorageResult,
  UnlockedAchievement,
} from "../types";
import { err, ok } from "../types";
import type { SqlBackend } from "./backend";
import { nowIso, parseJson, projectExists, uuid } from "./rows";

interface SaveRow {
  slot: number;
  state: string;
  summary: string | null;
  beat_id: string | null;
  thumb_ref: string | null;
  updated_at: string;
}

const SAVE_COLS = `slot, state, summary, beat_id, thumb_ref, updated_at`;

function toSaveSlot(r: SaveRow, projectId: string): StorageResult<LocalSaveSlot> {
  const state = parseJson<Record<string, unknown>>(r.state, "save_slot.state", `${projectId}/${r.slot}`, {});
  if (!state.ok) return state;
  return ok({
    slot: r.slot,
    state: state.data,
    summary: r.summary,
    beatId: r.beat_id,
    thumbRef: r.thumb_ref,
    updatedAt: r.updated_at,
  });
}

export async function listSaves(
  backend: SqlBackend,
  projectId: string,
  playerToken: string,
): Promise<StorageResult<LocalSaveSlot[]>> {
  try {
    const rows = await backend.select<SaveRow>(
      `SELECT ${SAVE_COLS} FROM save_slots WHERE project_id = ? AND player_token = ? ORDER BY slot`,
      [projectId, playerToken],
    );
    const out: LocalSaveSlot[] = [];
    for (const r of rows) {
      const mapped = toSaveSlot(r, projectId);
      if (!mapped.ok) return mapped;
      out.push(mapped.data);
    }
    return ok(out);
  } catch (cause) {
    return err({ code: "io", detail: "listSaves 查询失败", cause });
  }
}

export async function getSave(
  backend: SqlBackend,
  projectId: string,
  playerToken: string,
  slot = 0,
): Promise<StorageResult<LocalSaveSlot>> {
  try {
    const rows = await backend.select<SaveRow>(
      `SELECT ${SAVE_COLS} FROM save_slots WHERE project_id = ? AND player_token = ? AND slot = ?`,
      [projectId, playerToken, slot],
    );
    if (!rows.length) {
      return err({ code: "not_found", entity: "save_slot", id: `${projectId}/${slot}` });
    }
    return toSaveSlot(rows[0]!, projectId);
  } catch (cause) {
    return err({ code: "io", detail: "getSave 查询失败", cause });
  }
}

export async function writeSave(
  backend: SqlBackend,
  projectId: string,
  playerToken: string,
  input: SaveSlotInput,
): Promise<StorageResult<LocalSaveSlot>> {
  const slot = input.slot ?? 0;
  const now = nowIso();
  try {
    if (!(await projectExists(backend, projectId))) {
      return err({ code: "not_found", entity: "project", id: projectId });
    }
    const exists = await backend.select(
      `SELECT slot FROM save_slots WHERE project_id = ? AND player_token = ? AND slot = ?`,
      [projectId, playerToken, slot],
    );
    const values = [
      JSON.stringify(input.state),
      input.summary ?? null,
      input.beatId ?? null,
      input.thumbRef ?? null,
      now,
    ];
    if (exists.length) {
      await backend.execute(
        `UPDATE save_slots SET state=?, summary=?, beat_id=?, thumb_ref=?, updated_at=?
         WHERE project_id=? AND player_token=? AND slot=?`,
        [...values, projectId, playerToken, slot],
      );
    } else {
      await backend.execute(
        `INSERT INTO save_slots (project_id, player_token, slot, state, summary, beat_id,
         thumb_ref, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, playerToken, slot, ...values.slice(0, 4), now, now],
      );
    }
    return ok({
      slot,
      state: input.state,
      summary: input.summary ?? null,
      beatId: input.beatId ?? null,
      thumbRef: input.thumbRef ?? null,
      updatedAt: now,
    });
  } catch (cause) {
    return err({ code: "io", detail: "writeSave 失败", cause });
  }
}

export async function clearSave(
  backend: SqlBackend,
  projectId: string,
  playerToken: string,
  slot = 0,
): Promise<StorageResult<void>> {
  try {
    const r = await backend.execute(
      `DELETE FROM save_slots WHERE project_id = ? AND player_token = ? AND slot = ?`,
      [projectId, playerToken, slot],
    );
    return r.rowsAffected > 0
      ? ok(undefined)
      : err({ code: "not_found", entity: "save_slot", id: `${projectId}/${slot}` });
  } catch (cause) {
    return err({ code: "io", detail: "clearSave 失败", cause });
  }
}

interface AchievementRow {
  id: string;
  akey: string;
  title: string;
  description: string;
  icon: string;
  condition_json: string;
}

export async function listAchievements(
  backend: SqlBackend,
  projectId: string,
): Promise<StorageResult<StoredAchievement[]>> {
  try {
    const rows = await backend.select<AchievementRow>(
      `SELECT id, akey, title, description, icon, condition_json
       FROM achievements WHERE project_id = ? ORDER BY rowid`,
      [projectId],
    );
    const out: StoredAchievement[] = [];
    for (const r of rows) {
      const cond = parseJson<Record<string, unknown>>(r.condition_json, "achievement.condition", r.id, {});
      if (!cond.ok) return cond;
      out.push({
        id: r.id,
        key: r.akey,
        title: r.title,
        description: r.description,
        icon: r.icon,
        condition: cond.data,
      });
    }
    return ok(out);
  } catch (cause) {
    return err({ code: "io", detail: "listAchievements 查询失败", cause });
  }
}

export async function saveAchievement(
  backend: SqlBackend,
  projectId: string,
  achievement: StoredAchievement,
): Promise<StorageResult<StoredAchievement>> {
  const id = achievement.id || uuid();
  const row: StoredAchievement = { ...achievement, id };
  try {
    if (!(await projectExists(backend, projectId))) {
      return err({ code: "not_found", entity: "project", id: projectId });
    }
    const exists = await backend.select(`SELECT id FROM achievements WHERE id = ?`, [id]);
    const params = [
      projectId,
      row.key,
      row.title,
      row.description,
      row.icon,
      JSON.stringify(row.condition),
    ];
    if (exists.length) {
      await backend.execute(
        `UPDATE achievements SET project_id=?, akey=?, title=?, description=?, icon=?, condition_json=?
         WHERE id=?`,
        [...params, id],
      );
    } else {
      await backend.execute(
        `INSERT INTO achievements (id, project_id, akey, title, description, icon, condition_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, ...params],
      );
    }
    return ok(row);
  } catch (cause) {
    return err({ code: "io", detail: "saveAchievement 失败", cause });
  }
}

export async function deleteAchievement(
  backend: SqlBackend,
  projectId: string,
  id: string,
): Promise<StorageResult<void>> {
  try {
    const r = await backend.execute(
      `DELETE FROM achievements WHERE project_id = ? AND id = ?`,
      [projectId, id],
    );
    return r.rowsAffected > 0
      ? ok(undefined)
      : err({ code: "not_found", entity: "achievement", id });
  } catch (cause) {
    return err({ code: "io", detail: "deleteAchievement 失败", cause });
  }
}

export async function unlockAchievement(
  backend: SqlBackend,
  projectId: string,
  playerToken: string,
  key: string,
): Promise<StorageResult<void>> {
  try {
    const def = await backend.select(
      `SELECT id FROM achievements WHERE project_id = ? AND akey = ?`,
      [projectId, key],
    );
    if (!def.length) {
      return err({ code: "not_found", entity: "achievement", id: `${projectId}/${key}` });
    }
    const already = await backend.select(
      `SELECT player_token FROM player_achievements
       WHERE project_id = ? AND player_token = ? AND achievement_key = ?`,
      [projectId, playerToken, key],
    );
    if (already.length) return ok(undefined); // 幂等：不写第二条、不改 unlockedAt
    await backend.execute(
      `INSERT INTO player_achievements (project_id, player_token, achievement_key, unlocked_at)
       VALUES (?, ?, ?, ?)`,
      [projectId, playerToken, key, nowIso()],
    );
    return ok(undefined);
  } catch (cause) {
    return err({ code: "io", detail: "unlockAchievement 失败", cause });
  }
}

export async function listUnlocked(
  backend: SqlBackend,
  projectId: string,
  playerToken: string,
): Promise<StorageResult<UnlockedAchievement[]>> {
  try {
    const rows = await backend.select<{ achievement_key: string; unlocked_at: string }>(
      `SELECT achievement_key, unlocked_at FROM player_achievements
       WHERE project_id = ? AND player_token = ? ORDER BY unlocked_at`,
      [projectId, playerToken],
    );
    return ok(
      rows.map((r) => ({ key: r.achievement_key, unlockedAt: r.unlocked_at })),
    );
  } catch (cause) {
    return err({ code: "io", detail: "listUnlocked 查询失败", cause });
  }
}
