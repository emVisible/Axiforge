/**
 * 角色清单的范围语义——一处定义，Memory / SQLite / HTTP 三实现共用。
 *
 * 「我的 ∪ 公开」是产品里唯一需要的两种可见性组合；把它写成数据而不是散落在
 * 各实现的 if 分支里，跨端才不会出现「浏览器搜得到、桌面搜不到」这类漂移。
 */

import type { CharacterScope, StoredCharacter } from "./types";

export function filterCharacters(
  all: readonly StoredCharacter[],
  scope?: CharacterScope,
): StoredCharacter[] {
  const authorId = scope?.authorId ?? null;
  const includePublic = scope?.includePublic ?? authorId === null;
  const needle = scope?.search?.trim().toLowerCase() ?? "";

  const visible = all.filter((c) => {
    const mine = authorId !== null && c.authorId === authorId;
    const shared = includePublic && c.isPublic;
    if (!mine && !shared) return false;
    if (needle === "") return true;
    return (
      c.name.toLowerCase().includes(needle) ||
      c.id.toLowerCase().includes(needle)
    );
  });
  return visible;
}
