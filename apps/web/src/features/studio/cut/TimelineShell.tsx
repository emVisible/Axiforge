import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Instruction } from "@axiforge/core";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/shared/components/ui";
import {
  CUT_TRACKS,
  TIMELINE_PAD,
  clipColor,
  clipDurationMs,
  clipLabel,
  clipLeft,
  clipPositions,
  clipWidth,
  formatNarrativeTime,
  indexAtPixel,
  totalDurationMs,
  totalTimelineWidth,
  trackForOp,
  type CutTrackId,
} from "./timelineUtils";

export type TimelineShellHandle = {
  scrollToClip: (index: number) => void;
};

interface TimelineShellProps {
  script: Instruction[];
  selectedIndex: number;
  cursorIndex: number;
  zoom: number;
  onZoomChange: (z: number) => void;
  onSelectClip: (index: number) => void;
  onScrub: (index: number) => void;
  onReorder?: (from: number, to: number) => void;
}

const TRACK_H = 36;
const HEADER_W = 88;
const RULER_H = 22;

const TimelineShell = forwardRef<TimelineShellHandle, TimelineShellProps>(
  function TimelineShell(
    {
      script,
      selectedIndex,
      cursorIndex,
      zoom,
      onZoomChange,
      onSelectClip,
      onScrub,
      onReorder,
    },
    ref,
  ) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const width = totalTimelineWidth(script, zoom);
    const positions = clipPositions(script, zoom);
    const totalMs = totalDurationMs(script);
    const safeCursor =
      script.length > 0
        ? Math.max(0, Math.min(cursorIndex, script.length - 1))
        : 0;
    const safeSelected =
      script.length > 0
        ? Math.max(0, Math.min(selectedIndex, script.length - 1))
        : 0;

    const [dragFrom, setDragFrom] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const dragFromRef = useRef<number | null>(null);
    const dropIndexRef = useRef<number | null>(null);

    dragFromRef.current = dragFrom;
    dropIndexRef.current = dropIndex;

    const scrollToClip = useCallback(
      (index: number) => {
        const el = scrollRef.current;
        if (!el || !script.length) return;
        const clamped = Math.max(0, Math.min(index, script.length - 1));
        const left = clipLeft(script, clamped, zoom);
        const clipW = clipWidth(script[clamped], zoom);
        const target = left + clipW / 2 - el.clientWidth / 2;
        el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
      },
      [script, zoom],
    );

    useImperativeHandle(ref, () => ({ scrollToClip }), [scrollToClip]);

    const finishDrag = useCallback(() => {
      const from = dragFromRef.current;
      const to = dropIndexRef.current ?? from;
      setDragFrom(null);
      setDropIndex(null);
      if (from != null && to != null && from !== to && onReorder) {
        onReorder(from, to);
      }
    }, [onReorder]);

    useEffect(() => {
      if (dragFrom == null) return;

      const onMove = (e: PointerEvent) => {
        const el = scrollRef.current;
        if (!el || !script.length) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left + el.scrollLeft - TIMELINE_PAD;
        const idx = indexAtPixel(script, x, zoom);
        dropIndexRef.current = idx;
        setDropIndex(idx);
        onScrub(idx);
      };

      const onUp = () => finishDrag();

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, [dragFrom, script, zoom, onScrub, finishDrag]);

    const playheadLeft =
      script.length > 0 && script[safeCursor]
        ? TIMELINE_PAD +
          (positions[safeCursor] ?? 0) +
          clipWidth(script[safeCursor], zoom) / 2
        : TIMELINE_PAD;

    const dropMarkerLeft =
      dropIndex != null && script[dropIndex]
        ? TIMELINE_PAD +
          positions[dropIndex] +
          clipWidth(script[dropIndex], zoom) / 2
        : null;

    const handleTrackClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (dragFrom != null) return;
        const el = scrollRef.current;
        if (!el || !script.length) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left + el.scrollLeft - TIMELINE_PAD;
        onSelectClip(indexAtPixel(script, x, zoom));
      },
      [script, zoom, onSelectClip, dragFrom],
    );

    const handleRulerClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el || !script.length || totalMs <= 0) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left + el.scrollLeft - TIMELINE_PAD;
        const ratio = Math.max(0, Math.min(1, x / Math.max(1, width - TIMELINE_PAD * 2)));
        const targetMs = ratio * totalMs;
        let acc = 0;
        for (let i = 0; i < script.length; i++) {
          acc += clipDurationMs(script[i]);
          if (acc >= targetMs) {
            onScrub(i);
            return;
          }
        }
        onScrub(script.length - 1);
      },
      [script, width, totalMs, onScrub],
    );

    const ticks = (() => {
      if (!script.length || totalMs <= 0) return [];
      const count = Math.min(20, Math.max(4, Math.ceil(totalMs / 2000)));
      const step = totalMs / count;
      const innerW = width - TIMELINE_PAD * 2;
      return Array.from({ length: count + 1 }, (_, i) => ({
        ms: Math.round(i * step),
        left: TIMELINE_PAD + (innerW * (i * step)) / totalMs,
      }));
    })();

    const clipsByTrack = CUT_TRACKS.map((track) => ({
      ...track,
      clips: script
        .map((inst, i) => ({ inst, i }))
        .filter(({ inst }) => trackForOp(inst.op) === track.id),
    }));

    return (
      <div className="flex h-full min-h-0 flex-col bg-panel">
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-surface-raised px-3">
          <span className="text-[11px] font-medium tracking-wide text-ink-muted">
            指令轨 · 当前 Beat
            {onReorder && (
              <span className="ml-2 text-[9px] font-normal text-ink-faint">
                拖拽片段排序
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-[10px] text-ink-faint">缩放</span>
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(0.5, zoom - 0.15))}
              className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-border hover:text-ink"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center font-mono text-[10px] text-ink-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(Math.min(2, zoom + 0.15))}
              className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-border hover:text-ink"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div
            className="flex shrink-0 flex-col border-r border-border bg-surface"
            style={{ width: HEADER_W }}
          >
            <div
              className="flex shrink-0 items-end border-b border-border px-2 pb-1"
              style={{ height: RULER_H }}
            >
              <span className="text-[9px] text-ink-faint">进度</span>
            </div>
            {CUT_TRACKS.map((track) => (
              <div
                key={track.id}
                className="flex shrink-0 items-center border-b border-border px-2"
                style={{ height: TRACK_H }}
              >
                <span className="font-mono text-[10px] font-semibold text-accent-soft">
                  {track.short}
                </span>
                <span className="ml-1.5 truncate text-[9px] text-ink-faint">
                  {track.label.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>

          <div
            ref={scrollRef}
            className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
            onClick={handleTrackClick}
          >
            <div className="relative" style={{ minWidth: width }}>
              <div
                className="sticky top-0 z-10 cursor-crosshair border-b border-border bg-panel"
                style={{ height: RULER_H }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRulerClick(e);
                }}
              >
                {ticks.map((t) => (
                  <div
                    key={t.ms}
                    className="absolute top-0 flex h-full flex-col justify-end"
                    style={{ left: t.left }}
                  >
                    <span className="mb-0.5 -translate-x-1/2 font-mono text-[9px] text-ink-faint">
                      {formatNarrativeTime(t.ms)}
                    </span>
                    <div className="h-1.5 w-px bg-border-strong" />
                  </div>
                ))}
              </div>

              {script.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-xs text-ink-faint">
                  在右侧检查器「演出」标签中添加指令
                </div>
              ) : (
                <>
                  {clipsByTrack.map((track) => (
                    <TrackRow
                      key={track.id}
                      trackId={track.id}
                      script={script}
                      positions={positions}
                      zoom={zoom}
                      selectedIndex={safeSelected}
                      dragFrom={dragFrom}
                      clipIndices={track.clips.map((c) => c.i)}
                      onSelectClip={onSelectClip}
                      onDragStart={onReorder ? setDragFrom : undefined}
                    />
                  ))}

                  {dropMarkerLeft != null && dragFrom != null && (
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 bg-brand"
                      style={{ left: dropMarkerLeft }}
                    />
                  )}

                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-accent-soft shadow-[0_0_12px_color-mix(in_srgb,var(--ax-accent-soft)_90%,transparent)]"
                    style={{ left: playheadLeft }}
                  >
                    <div className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-accent-soft" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default TimelineShell;

function TrackRow({
  trackId,
  script,
  positions,
  zoom,
  selectedIndex,
  dragFrom,
  clipIndices,
  onSelectClip,
  onDragStart,
}: {
  trackId: CutTrackId;
  script: Instruction[];
  positions: number[];
  zoom: number;
  selectedIndex: number;
  dragFrom: number | null;
  clipIndices: number[];
  onSelectClip: (index: number) => void;
  onDragStart?: (index: number) => void;
}) {
  const indexSet = new Set(clipIndices);

  return (
    <div
      className="relative border-b border-border"
      style={{ height: TRACK_H }}
    >
      {script.map((inst, i) => {
        if (!indexSet.has(i)) return null;
        const w = clipWidth(inst, zoom);
        const active = i === selectedIndex;
        const dragging = dragFrom === i;
        return (
          <button
            key={`${trackId}-${i}`}
            type="button"
            onPointerDown={(e) => {
              if (!onDragStart || e.button !== 0) return;
              e.stopPropagation();
              onDragStart(i);
              onSelectClip(i);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (dragFrom != null) return;
              onSelectClip(i);
            }}
            style={{ left: TIMELINE_PAD + positions[i], width: w, height: TRACK_H - 6 }}
            className={cn(
              "absolute top-[3px] cursor-grab overflow-hidden rounded-sm border px-1.5 text-left transition-shadow active:cursor-grabbing",
              clipColor(inst),
              active && "z-10 ring-2 ring-accent-soft ring-offset-1 ring-offset-panel",
              dragging && "z-20 opacity-60",
            )}
            title={clipLabel(inst)}
          >
            <span className="block truncate text-[9px] font-medium leading-tight opacity-90">
              {clipLabel(inst)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
