import type { NexusNote } from "@/services/api";

const STOP = new Set([
  "的",
  "了",
  "是",
  "在",
  "和",
  "与",
  "或",
  "一个",
  "我们",
  "他们",
  "这个",
  "那个",
  "可以",
  "已经",
  "没有",
  "不是",
  "the",
  "a",
  "an",
  "to",
  "of",
  "in",
  "for",
  "and",
  "or",
  "is",
  "it",
  "that",
  "this",
]);

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const en = text.match(/[a-zA-Z][a-zA-Z0-9_-]*/g) ?? [];
  tokens.push(...en.map((w) => w.toLowerCase()));
  const zh = text.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  tokens.push(...zh);
  return tokens.filter((t) => t.length >= 2 && !STOP.has(t));
}

/** 本地 TF-IDF 关键词（无 AI 依赖） */
export function extractKeywords(notes: NexusNote[], limit = 6): string[] {
  if (!notes.length) return [];
  const df = new Map<string, number>();
  const tfPerDoc: Map<string, number>[] = [];

  for (const note of notes) {
    const text = `${note.title}\n${note.body}`;
    const counts = new Map<string, number>();
    for (const tok of tokenize(text)) {
      counts.set(tok, (counts.get(tok) ?? 0) + 1);
    }
    tfPerDoc.push(counts);
    for (const tok of counts.keys()) {
      df.set(tok, (df.get(tok) ?? 0) + 1);
    }
  }

  const n = notes.length;
  const scores = new Map<string, number>();
  tfPerDoc.forEach((counts) => {
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    for (const [tok, c] of counts) {
      const tf = c / total;
      const idf = Math.log((n + 1) / ((df.get(tok) ?? 0) + 1)) + 1;
      scores.set(tok, (scores.get(tok) ?? 0) + tf * idf);
    }
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

export interface TagThemeSummary {
  tag: string;
  noteCount: number;
  keywords: string[];
  recentTitles: string[];
  lastActiveAt: string | null;
}

export function summarizeTagCluster(notes: NexusNote[], tag: string): TagThemeSummary {
  const matched = notes.filter((n) => n.tags?.includes(tag));
  const sorted = [...matched].sort(
    (a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0),
  );
  return {
    tag,
    noteCount: matched.length,
    keywords: extractKeywords(matched),
    recentTitles: sorted.slice(0, 3).map((n) => n.title || "无标题"),
    lastActiveAt: sorted[0]?.updated_at ?? null,
  };
}

/** 标签簇活跃度 → Orbit 节点透明度（时间维） */
export function tagRecencyOpacity(lastUpdatedIso: string | null): number {
  if (!lastUpdatedIso) return 0.35;
  const ageMs = Date.now() - Date.parse(lastUpdatedIso);
  const week = 7 * 24 * 60 * 60 * 1000;
  const month = 30 * 24 * 60 * 60 * 1000;
  if (ageMs <= week) return 1;
  if (ageMs <= month) return 0.65;
  return 0.38;
}

export function tagLastUpdated(notes: NexusNote[], tag: string): string | null {
  let best = 0;
  let iso: string | null = null;
  for (const n of notes) {
    if (!n.tags?.includes(tag)) continue;
    const ts = Date.parse(n.updated_at) || 0;
    if (ts > best) {
      best = ts;
      iso = n.updated_at;
    }
  }
  return iso;
}
