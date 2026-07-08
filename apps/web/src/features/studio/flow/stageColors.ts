/** 舞台泳道配色 — 低饱和，配合语义表面色，避免浅色头/亮黄锚点刺眼 */
export const STAGE_PALETTE = [
  { border: "border-indigo-400/40", header: "bg-indigo-500/10", dot: "#818cf8", label: "indigo" },
  { border: "border-emerald-400/40", header: "bg-emerald-500/10", dot: "#34d399", label: "emerald" },
  { border: "border-amber-400/40", header: "bg-amber-500/10", dot: "#fbbf24", label: "amber" },
  { border: "border-rose-400/40", header: "bg-rose-500/10", dot: "#fb7185", label: "rose" },
  { border: "border-cyan-400/40", header: "bg-cyan-500/10", dot: "#22d3ee", label: "cyan" },
  { border: "border-violet-400/40", header: "bg-violet-500/10", dot: "#a78bfa", label: "violet" },
] as const;

export function stageColorIndex(
  stageId: string | null | undefined,
  stageIds: string[],
): number {
  if (!stageId) return 0;
  const idx = stageIds.indexOf(stageId);
  return idx >= 0 ? idx % STAGE_PALETTE.length : 0;
}
