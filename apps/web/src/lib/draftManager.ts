import type { CharacterData } from '@/types/character';

const DRAFT_PREFIX = 'axiforge_draft_';
const DRAFT_INDEX_KEY = 'axiforge_draft_index';

interface DraftEntry {
  id: string;
  characterId?: string;
  name: string;
  updatedAt: number;
}

class DraftManager {
  save(draftId: string, data: CharacterData, meta?: { characterId?: string; name?: string }) {
    try {
      localStorage.setItem(DRAFT_PREFIX + draftId, JSON.stringify(data));
      const index = this.getIndex();
      const existing = index.find(e => e.id === draftId);
      const entry: DraftEntry = {
        id: draftId,
        characterId: meta?.characterId,
        name: meta?.name || data?.anchor?.name || data?.anchor?.essence || '未命名',
        updatedAt: Date.now(),
      };
      if (existing) Object.assign(existing, entry);
      else index.unshift(entry);

      const trimmed = index.slice(0, 10);
      localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(trimmed));

      const keptIds = new Set(trimmed.map(e => e.id));
      index.forEach(e => { if (!keptIds.has(e.id)) localStorage.removeItem(DRAFT_PREFIX + e.id); });
    } catch { /* 静默失败 */ }
  }

  load(draftId: string): CharacterData | null {
    try {
      const raw = localStorage.getItem(DRAFT_PREFIX + draftId);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  remove(draftId: string) {
    localStorage.removeItem(DRAFT_PREFIX + draftId);
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(this.getIndex().filter(e => e.id !== draftId)));
  }

  getIndex(): DraftEntry[] {
    try {
      const raw = localStorage.getItem(DRAFT_INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  getLatest(): DraftEntry | null {
    const idx = this.getIndex();
    return idx.length > 0 ? idx[0] : null;
  }

  clearAll() {
    this.getIndex().forEach(e => localStorage.removeItem(DRAFT_PREFIX + e.id));
    localStorage.removeItem(DRAFT_INDEX_KEY);
  }
}

export const draftManager = new DraftManager();
export const CREATE_DRAFT_ID = 'create_new';
export const editDraftId = (characterId: string) => `edit_${characterId}`;