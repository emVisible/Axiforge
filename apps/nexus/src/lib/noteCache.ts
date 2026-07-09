import type { NexusNote } from "@/services/api";

const DB_NAME = "axiforge-nexus";
const DB_VERSION = 1;
const STORE = "notes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function cacheKey(authorId: string) {
  return `notes:${authorId}`;
}

export async function readCachedNotes(authorId: string): Promise<NexusNote[] | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(cacheKey(authorId));
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve((req.result as NexusNote[] | undefined) ?? null);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function writeCachedNotes(authorId: string, notes: NexusNote[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(notes, cacheKey(authorId));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 离线缓存失败不阻断主流程
  }
}

/** Last-write-wins：按 updated_at 合并本地与服务端笔记列表。 */
export function mergeNotesLWW(local: NexusNote[], remote: NexusNote[]): NexusNote[] {
  const byId = new Map<string, NexusNote>();
  for (const note of local) byId.set(note.id, note);
  for (const note of remote) {
    const prev = byId.get(note.id);
    if (!prev) {
      byId.set(note.id, note);
      continue;
    }
    const prevTs = Date.parse(prev.updated_at) || 0;
    const nextTs = Date.parse(note.updated_at) || 0;
    byId.set(note.id, nextTs >= prevTs ? note : prev);
  }
  return [...byId.values()].sort(
    (a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0),
  );
}
