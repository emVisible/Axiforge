/** SQLite 实现内部共用的小工具与行编解码（供 sqliteProvider 与两个域模块共享） */

import { err, ok, type StorageResult } from "../types";

export const nowIso = () => new Date().toISOString();

export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** sql.js 返回 0/1，sqlx 可能返回 bool：布尔列一律经此归一，不散落在各处比较 */
export const asBool = (v: unknown): boolean => v === 1 || v === true;

export function parseJson<T>(
  text: unknown,
  entity: string,
  id: string,
  fallback: T,
): StorageResult<T> {
  if (typeof text !== "string") return ok(fallback);
  try {
    return ok(JSON.parse(text) as T);
  } catch (cause) {
    return err({ code: "corrupted", entity, id, detail: "JSON 解析失败", cause });
  }
}

/** 项目是否存在——多个域都需要这道前置检查 */
export async function projectExists(
  backend: { select: (sql: string, p?: unknown[]) => Promise<unknown[]> },
  id: string,
): Promise<boolean> {
  const rows = await backend.select(`SELECT id FROM projects WHERE id = ?`, [id]);
  return rows.length > 0;
}
