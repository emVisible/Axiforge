import type { Instruction } from "@axiforge/core";
import { apiClient } from "./client";
import type { CharacterData } from "@/types/character";

export const aiApi = {
  proseToScript: (body: { prose: string; role_names?: string[] }) =>
    apiClient.post<{ script: Instruction[]; source: string }>(
      "/editor/ai/prose-to-script",
      body,
    ),

  suggestCharacter: (body: { name: string; essence?: string; tags?: string[] }) =>
    apiClient.post<{ layers: Partial<CharacterData>; source: string }>(
      "/editor/ai/suggest-character",
      body,
    ),
};
