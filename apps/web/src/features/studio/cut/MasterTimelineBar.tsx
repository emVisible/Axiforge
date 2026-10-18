import { useCallback, useRef } from "react";
import { cn } from "@/shared/components/ui";
import { STAGE_PALETTE } from "../flow/stageColors";
import { formatNarrativeTime } from "./timelineUtils";
import type { MasterTimeline } from "./masterTimelineUtils";

interface MasterTimelineBarProps {
  master: MasterTimeline;
  activeBeatId: string | null;
  globalMs: number;
  onSelectBeat: (beatId: string) => void;
  onScrubGlobal: (globalMs: number) => void;
}

export default function MasterTimelineBar({
  master,
  activeBeatId,
  globalMs,
  onSelectBeat,
  onScrubGlobal,
}: MasterTimelineBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || master.totalMs <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onScrubGlobal(ratio * master.totalMs);
    },
    [master.totalMs, onScrubGlobal],
  );

  const playheadPct =
    master.totalMs > 0 ? (globalMs / master.totalMs) * 100 : 0;

  return (
    <div className="shrink-0 border-b border-border bg-surface">
      <div className="flex h-7 items-center justify-between px-3">
        <span className="text-3xs font-medium text-ink-muted">
          主时间轴 · 全片
        </span>
        <span className="font-mono text-3xs tabular-nums text-ink-faint">
          {formatNarrativeTime(globalMs)} / {formatNarrativeTime(master.totalMs)}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative mx-3 mb-2 h-8 cursor-crosshair overflow-hidden rounded-md border border-border bg-panel"
        onClick={(e) => handlePointer(e.clientX)}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          handlePointer(e.clientX);
          const onMove = (ev: PointerEvent) => handlePointer(ev.clientX);
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
        role="slider"
        aria-label="全片主时间轴"
        aria-valuemin={0}
        aria-valuemax={master.totalMs}
        aria-valuenow={Math.round(globalMs)}
      >
        <div className="absolute inset-0 flex">
          {master.beats.map((beat, i) => {
            const widthPct =
              master.totalMs > 0
                ? (beat.durationMs / master.totalMs) * 100
                : 100 / master.beats.length;
            const palette = STAGE_PALETTE[i % STAGE_PALETTE.length];
            const active = beat.beatId === activeBeatId;
            return (
              <button
                key={beat.beatId}
                type="button"
                style={{ width: `${widthPct}%` }}
                className={cn(
                  "relative h-full min-w-[2px] border-r border-border/60 text-left transition-opacity last:border-r-0",
                  palette.header,
                  active ? "opacity-100 ring-1 ring-inset ring-accent-soft/60" : "opacity-80 hover:opacity-100",
                )}
                title={`${beat.title} · ${formatNarrativeTime(beat.durationMs)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBeat(beat.beatId);
                }}
              >
                {widthPct > 8 && (
                  <span className="absolute inset-x-1 top-1 truncate text-3xs font-medium text-ink-muted">
                    {beat.title}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-accent-soft shadow-[0_0_8px_color-mix(in_srgb,var(--ax-accent-soft)_80%,transparent)]"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-accent-soft" />
        </div>
      </div>
    </div>
  );
}
