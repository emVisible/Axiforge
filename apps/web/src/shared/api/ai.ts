import type { Instruction } from "@axiforge/core";
import { apiClient } from "./client";
import type { CharacterData } from "@/shared/types/character";

export interface ProseToScriptResult {
  script: Instruction[];
  source: string;
  /** canonical AXS 文本；模型路径下它是唯一产物 */
  axs: string;
  needs_parse: boolean;
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
