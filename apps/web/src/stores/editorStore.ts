import { create } from "zustand";
import type { CharacterData } from "@/types/character";
import { draftManager } from "@/lib/draftManager";

export const emptyCharacterData: CharacterData = {
  contour: {
    appearance: "",
    age_era: "",
    identity: "",
    first_impression: "",
  },
  demeanor: {
    speech_style: "",
    habits: "",
    typical_reaction: "",
    expressiveness: "",
  },
  psyche: { desire: "", fear: "", conflict: "", self_perception: "" },
  anchor: {
    summary: "",
    essence: "",
    name: "",
    tags: [],
    theme: "",
    core_belief: "",
  },
  trace: { background: "", key_events: [], turning_point: "" },
  bond: {
    attitude_to_others: "",
    intimate_pattern: "",
    hostile_pattern: "",
    group_role: "",
  },
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

interface EditorState {
  draft: CharacterData | null;
  isDirty: boolean;
  lastSavedAt: number | null;
  currentCharacterId: string | null;
  draftId: string | null;
  setDraft: (draft: CharacterData, characterId?: string) => void;
  updateField: (path: string, value: unknown) => void;
  markClean: () => void;
  reset: () => void;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  const newObj = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  let current: Record<string, unknown> = newObj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
  return newObj as unknown as CharacterData;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  draft: null,
  isDirty: false,
  lastSavedAt: null,
  currentCharacterId: null,
  draftId: null,

  setDraft: (draft, characterId) => {
    const draftId = characterId ? `edit_${characterId}` : "create_new";
    set({
      draft,
      isDirty: false,
      currentCharacterId: characterId ?? null,
      draftId,
      lastSavedAt: null,
    });
  },

  updateField: (path, value) => {
    const { draft, draftId, currentCharacterId } = get();
    if (!draft || !draftId) return;
    const newDraft = setNestedValue(
      draft as unknown as Record<string, unknown>,
      path,
      value,
    );
    set({ draft: newDraft, isDirty: true });

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const name = newDraft?.anchor?.name || newDraft?.anchor?.essence || "";
      draftManager.save(draftId, newDraft, {
        characterId: currentCharacterId || undefined,
        name,
      });
      set({ lastSavedAt: Date.now() });
    }, 800);
  },

  markClean: () => set({ isDirty: false }),

  reset: () => {
    const { draftId } = get();
    if (draftId) draftManager.remove(draftId);
    if (saveTimer) clearTimeout(saveTimer);
    set({
      draft: null,
      isDirty: false,
      lastSavedAt: null,
      currentCharacterId: null,
      draftId: null,
    });
  },
}));
