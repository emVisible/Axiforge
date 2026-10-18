/**
 * 角色域的 HTTP 实现（L4 契约的远端形态）。
 *
 * 与 `httpProjectScenes` / `httpAssetRefs` 同一拆分理由：`httpStorageProvider`
 * 贴着 G1 的 400 行棘轮，域实现体不再往主文件堆。
 */

import { characterApi } from "@/shared/api/characters";
import type { StorageResult, StoredCharacter, VisibilityScope } from "@axiforge/editor-core";
import { filterByVisibility, ok } from "@axiforge/editor-core";
import { fail, toStoredCharacter } from "./httpDomains";

/**
 * 范围取数：我的走 listUser，公开走 listPublic（带 search），
 * 两者都取时按 id 合并去重——与桌面实现共用同一「我的 ∪ 公开」语义。
 */
export async function httpListCharacters(
  scope: VisibilityScope | undefined,
  creatorId: string,
): Promise<StorageResult<StoredCharacter[]>> {
  try {
    const authorId = scope?.authorId ?? null;
    const includePublic = scope?.includePublic ?? authorId === null;
    const merged = new Map<string, StoredCharacter>();

    if (authorId !== null) {
      const mine = await characterApi.listUser(authorId);
      for (const c of mine) merged.set(String(c.id), toStoredCharacter(c));
    }
    if (includePublic) {
      const page = await characterApi.listPublic({
        limit: 200,
        ...(scope?.search ? { search: scope.search } : {}),
      });
      for (const c of page.items ?? []) {
        const key = String(c.id);
        if (!merged.has(key)) merged.set(key, toStoredCharacter(c));
      }
    }
    return ok(filterByVisibility([...merged.values()], scope));
  } catch (e) {
    return fail(e, "characters", scope?.authorId ?? creatorId);
  }
}

export async function httpGetCharacter(id: string): Promise<StorageResult<StoredCharacter>> {
  try {
    return ok(toStoredCharacter(await characterApi.get(id)));
  } catch (e) {
    return fail(e, "character", id);
  }
}

/** id 命中则更新；否则创建并回传服务端分配的 id（客户端指定的 id 在这端不生效） */
export async function httpSaveCharacter(
  character: StoredCharacter,
  creatorId: string,
): Promise<StorageResult<{ id: string }>> {
  try {
    if (character.id) {
      await characterApi.update(character.id, {
        character_data: character.characterData as never,
        image_path: character.imagePath === null ? undefined : character.imagePath,
      } as never);
      return ok({ id: character.id });
    }
    const created = await characterApi.create({
      character_data: character.characterData as never,
      image_path: character.imagePath ?? undefined,
      author_id: character.authorId ?? creatorId,
      is_public: character.isPublic,
    } as never);
    return ok({ id: String(created.id) });
  } catch (e) {
    return fail(e, "character", character.id || "(new)");
  }
}
