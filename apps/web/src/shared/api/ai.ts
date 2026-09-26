import type { Instruction } from "@axiforge/core";
import { parseAxs } from "@axiforge/axs";
import { apiClient } from "./client";
import type { CharacterData } from "@/shared/types/character";

export type DraftMode = "replace" | "append";

export interface ProseToScriptResult {
  script: Instruction[];
  source: string;
  /** canonical AXS 文本；模型路径下它是唯一产物 */
  axs: string;
  needs_parse: boolean;
}

/**
 * AI 草稿响应 → 下一版指令序列。放在端点旁边，是为了让契约改动不可能忘掉解码器。
 *
 * 规则路径直接给 IR；模型路径只给 canonical 文本，由本端 `parseAxs` 解析（ADR-027）——
 * Python 没有 canonical AXS 解析器，原先在服务端把文本读回 IR 的做法是第二套解析器，已废除。
 * 解析不出指令时必须抛错：AXS 的兜底是「认不出的行当旁白」，静默接受会把脚本灌成一堆
 * 读给玩家听的 `【背景 …】` 文本，且 diagnostics 为空、不会报警。
 */
export function applyDraft(
  res: ProseToScriptResult,
  current: Instruction[],
  mode: DraftMode,
): Instruction[] {
  const doc = res.needs_parse ? parseAxs(res.axs) : null;
  const next = doc ? doc.beats.flatMap((b) => b.script) : res.script;

  if (!next.length) {
    const bad = doc?.diagnostics.find((d) => d.severity !== "info");
    throw new Error(bad ? `第 ${bad.line} 行：${bad.message}` : "生成文本未解析出任何指令");
  }

  return mode === "replace" ? next : [...current, ...next];
}

export const aiApi = {
  proseToScript: (body: { prose: string; role_names?: string[]; author_id?: string }) =>
    apiClient.post<ProseToScriptResult>("/editor/ai/prose-to-script", body),

  proseToAxs: (body: {
    prose: string;
    title?: string;
    role_names?: string[];
    default_speaker?: string;
    author_id?: string;
  }) =>
    apiClient.post<{ axs: string; source: string }>(
      "/editor/ai/prose-to-axs",
      body,
    ),

  suggestCharacter: (body: {
    name: string;
    essence?: string;
    tags?: string[];
    author_id?: string;
  }) =>
    apiClient.post<{ layers: Partial<CharacterData>; source: string }>(
      "/editor/ai/suggest-character",
      body,
    ),
};
