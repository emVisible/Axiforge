import type { ProjectSceneResponse } from "@/shared/types/project";

import { STAGE_PALETTE, stageColorIndex } from "./stageColors";

interface StageLegendProps {
  scenes: ProjectSceneResponse[];
  activeStageId: string | null;
  filteredStageId: string | null;
  nodeCounts: Record<string, number>;
  onSelectStage: (stageId: string) => void;
  onFocusStage: (stageId: string) => void;
  onToggleFilter: (stageId: string) => void;
}

export default function StageLegend({
  scenes,
  activeStageId,
  filteredStageId,
  nodeCounts,
  onSelectStage,
  onFocusStage,
  onToggleFilter,
}: StageLegendProps) {
  if (!scenes.length) return null;

  const stageIds = scenes.map((s) => s.id);

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-2.5 shadow-sm">
      <p className="px-0.5 text-3xs font-medium text-ink-muted">舞台泳道</p>
      <div className="space-y-1">
        {scenes.map((scene) => {
          const idx = stageColorIndex(scene.id, stageIds);
          const palette = STAGE_PALETTE[idx];
          const active = activeStageId === scene.id;
          const filtered = filteredStageId === scene.id;
          const count = nodeCounts[scene.id] ?? 0;

          return (
            <div
              key={scene.id}
              className={`flex items-center gap-1 rounded-lg border px-1.5 py-1 transition-colors ${
                filtered
                  ? "border-brand bg-brand/5"
                  : active
                    ? "border-border bg-canvas"
                    : "border-transparent hover:border-border/60"
              }`}
            >
              <button
                type="button"
                title="设为新建节点默认舞台"
                onClick={() => onSelectStage(scene.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: palette.dot }}
                />
                <span className="truncate text-3xs text-ink">{scene.title}</span>
                <span className="ml-auto shrink-0 text-[9px] tabular-nums text-ink-muted">
                  {count}
                </span>
              </button>
              <button
                type="button"
                title="聚焦到此舞台"
                disabled={count === 0}
                onClick={() => onFocusStage(scene.id)}
                className="shrink-0 rounded px-1 text-[9px] text-ink-muted hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                聚焦
              </button>
              <button
                type="button"
                title={filtered ? "取消筛选" : "仅显示此舞台"}
                disabled={count === 0}
                onClick={() => onToggleFilter(scene.id)}
                className={`shrink-0 rounded px-1 text-[9px] ${
                  filtered
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                } disabled:opacity-30`}
              >
                {filtered ? "取消" : "筛选"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="px-0.5 text-[9px] leading-relaxed text-ink-muted/80">
        点击圆点设默认舞台；聚焦缩放；筛选高亮泳道
      </p>
    </div>
  );
}
