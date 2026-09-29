/**
 * 角色设定的导出/复制正文（S13-2f）。
 *
 * 为什么原来桌面上这两个按钮点了没反应：正文其实一直在本地渲染
 * （`renderCharacterPrompt`），但传记与关系是从 `POST /characters/{id}/export` 取的，
 * 桌面上这一句 await 直接抛错，被 `catch {}` 吞掉——连**本地已有的正文**也一起导不出去。
 *
 * 分派裁决与 `storySaves.ts` 一致：本地支用已经分派好的传记读写口组装，
 * 远端支保持原来那一次请求不变（不在这里把 web 的 1 次请求变成 N+1 次）。
 * 桌面不含「关系」段不是丢数据：关系域在桌面上本就不存在（S13-3 判死清单），
 * 一台机器上没有的功能不该在产物里留一个空标题。
 */

import { characterApi } from "@/shared/api/characters";
import { renderCharacterPrompt } from "@/shared/lib/promptRenderer";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import { readStories, readStory } from "@/shared/storage/storySaves";
import type { Character, CharacterData } from "@/shared/types/character";

export interface ExportSections {
  stories: { title: string; content: string }[];
  relations: { relation_name?: string; target_name?: string }[];
}

export const characterExportDeps: {
  isLocal: () => boolean;
  apiExport: (id: string) => Promise<{ stories?: ExportSections["stories"]; relations?: unknown[] }>;
} = {
  isLocal: isTauriEnvironment,
  apiExport: (id) => characterApi.export(id, {
    format: "markdown",
    include_stories: true,
    include_relations: true,
  }),
};

/** 正文 + 传记 + 关系；空段落不占行 */
export function composeCharacterMarkdown(base: string, s: ExportSections): string {
  let md = base;
  if (s.stories.length) {
    md += "\n\n## 传记\n\n";
    for (const story of s.stories) md += `### ${story.title}\n\n${story.content}\n\n`;
  }
  const relations = s.relations.filter(
    (r): r is { relation_name: string; target_name: string } =>
      typeof r.relation_name === "string" && typeof r.target_name === "string",
  );
  if (relations.length) {
    md += "\n## 关系\n\n";
    for (const r of relations) md += `- ${r.relation_name}: ${r.target_name}\n`;
  }
  return md;
}

export async function buildCharacterExport(character: Character): Promise<string> {
  const base = renderCharacterPrompt(character.character_data as CharacterData, "markdown");
  if (!characterExportDeps.isLocal()) {
    const data = await characterExportDeps.apiExport(character.id);
    return composeCharacterMarkdown(base, {
      stories: data.stories ?? [],
      relations: (data.relations ?? []) as ExportSections["relations"],
    });
  }
  const items = await readStories(character.id);
  const stories = await Promise.all(
    items.map((item) => readStory(character.id, item.id)),
  );
  return composeCharacterMarkdown(base, {
    stories: stories.map((s) => ({ title: s.title, content: s.content })),
    relations: [],
  });
}
