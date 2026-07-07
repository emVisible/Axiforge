/** 已读行追踪（v1.4 跳过已读）——按作品存 localStorage */

const KEY = (projectId: string) => `axiforge:player-read:${projectId}`;

export function lineKey(beatId: string | null, cursor: number): string {
  return `${beatId ?? "?"}:${cursor}`;
}

export function loadReadLines(projectId: string): Set<string> {
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markLineRead(projectId: string, key: string): void {
  const set = loadReadLines(projectId);
  if (set.has(key)) return;
  set.add(key);
  localStorage.setItem(KEY(projectId), JSON.stringify([...set]));
}

export function isLineRead(projectId: string, key: string): boolean {
  return loadReadLines(projectId).has(key);
}
