/**
 * 角色传记的 HTTP 实现（L4 契约的远端形态）。
 *
 * 独立成模块的原因与 httpDomains 一致：`httpStorageProvider` 已贴着 G1 的 400 行上限，
 * 新域的实现体不再往它本体堆，主文件只留一行转调。
 *
 * 传输态 ↔ 存储态的字段口径在此收住：`created_at` 在本地库不单独存在，
 * 故本地实现返回的 `createdAt` 等于 `updatedAt`；这里保留服务端真值。
 */

import { storyApi } from "@/shared/api/stories";
import type { StorageResult, StoredStory } from "@axiforge/editor-core";
import { err, ok } from "@axiforge/editor-core";
import type { Story } from "@/shared/types/story";

function toStored(s: Story): StoredStory {
  return {
    id: s.id,
    characterId: s.character_id,
    title: s.title,
    content: s.content,
    wordCount: s.word_count,
    sortOrder: s.sort_order,
    updatedAt: s.updated_at,
  };
}

export async function httpListStories(
  characterId: string,
): Promise<StorageResult<StoredStory[]>> {
  try {
    const rows = await storyApi.list(characterId);
    return ok(
      rows.map((r) => ({
        id: r.id,
        characterId,
        title: r.title,
        content: "",
        wordCount: r.word_count,
        sortOrder: r.sort_order,
        updatedAt: r.updated_at,
      })),
    );
  } catch (cause) {
    return err({ code: "io", detail: "listStories 失败", cause });
  }
}

/**
 * 清单端点不返回正文（服务端按列表裁剪字段），所以 `httpListStories` 的 content 是空串。
 * 需要正文必须走 `httpGetStory` 单条读——这一点与桌面实现**行为不同**，
 * 调用方不得把「清单里的正文」当权威。桌面侧列表是带正文的（本地库无此裁剪）。
 */
export async function httpGetStory(
  characterId: string,
  id: string,
): Promise<StorageResult<StoredStory>> {
  try {
    return ok(toStored(await storyApi.get(characterId, id)));
  } catch (cause) {
    const status = (cause as { status?: number })?.status;
    if (status === 404) return err({ code: "not_found", entity: "story", id });
    return err({ code: "io", detail: "getStory 失败", cause });
  }
}

export async function httpSaveStory(
  story: StoredStory,
): Promise<StorageResult<{ id: string }>> {
  try {
    const saved = story.id
      ? await storyApi.update(story.characterId, story.id, {
          title: story.title,
          content: story.content,
          sort_order: story.sortOrder,
        })
      : await storyApi.create(story.characterId, {
          title: story.title,
          content: story.content,
        });
    return ok({ id: saved.id });
  } catch (cause) {
    return err({ code: "io", detail: "saveStory 失败", cause });
  }
}

export async function httpDeleteStory(
  characterId: string,
  id: string,
): Promise<StorageResult<void>> {
  try {
    await storyApi.delete(characterId, id);
    return ok(undefined);
  } catch (cause) {
    const status = (cause as { status?: number })?.status;
    if (status === 404) return err({ code: "not_found", entity: "story", id });
    return err({ code: "io", detail: "deleteStory 失败", cause });
  }
}
