/** 舞台泳道配色（全剧本画布按 stage 着色） */
export const STAGE_PALETTE = [
  { border: "border-indigo-300", header: "bg-indigo-50", dot: "#6366f1", label: "indigo" },
  { border: "border-emerald-300", header: "bg-emerald-50", dot: "#10b981", label: "emerald" },
  { border: "border-amber-300", header: "bg-amber-50", dot: "#f59e0b", label: "amber" },
  { border: "border-rose-300", header: "bg-rose-50", dot: "#f43f5e", label: "rose" },
  { border: "border-cyan-300", header: "bg-cyan-50", dot: "#06b6d4", label: "cyan" },
  { border: "border-violet-300", header: "bg-violet-50", dot: "#8b5cf6", label: "violet" },
] as const;

export function stageColorIndex(stageId: string | null | undefined, stageIds: string[]): number {
  if (!stageId) return 0;
  const idx = stageIds.indexOf(stageId);
  return idx >= 0 ? idx % STAGE_PALETTE.length : 0;
}
