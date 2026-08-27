import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import type { Instruction } from "@axiforge/core";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/shared/components/ui";
import {
  CUT_TRACKS,
  TIMELINE_PAD,
  canResizeClipDuration,
  clipColor,
  clipDurationMs,
  clipLabel,
  clipLeft,
  clipPositions,
  clipWidth,
  formatNarrativeTime,
  indexAtPixel,
  msFromClipWidth,
  totalDurationMs,
  totalTimelineWidth,
  trackForOp,
  type CutTrackId,
  indicesOnTrack,
  localIndexAtPixelForIndices,
  characterTrackGroups,
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
  characterLabels?: Record<string, string>;
  onReorderTrack?: (
    trackId: string,
    fromLocal: number,
    toLocal: number,
  ) => void;
  onDeleteClip?: (index: number) => void;
  onDurationChange?: (index: number, ms: number) => void;
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
      onReorderTrack,
      characterLabels = {},
      onDeleteClip,
      onDurationChange,
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

    // 轨道键：cut:<CutTrackId> 固定轨 | char:<characterId> 角色轨（F2）
    const [dragFrom, setDragFrom] = useState<{
      trackId: string;
      localIndex: number;
      globalIndex: number;
    } | null>(null);
    const [dropTarget, setDropTarget] = useState<{
      trackId: string;
      localIndex: number;
    } | null>(null);
    const dragFromRef = useRef<typeof dragFrom>(null);
    const dropTargetRef = useRef<typeof dropTarget>(null);

    dragFromRef.current = dragFrom;
    dropTargetRef.current = dropTarget;

    const charGroups = useMemo(
      () => characterTrackGroups(script),
      [script],
    );
    const [collapsedChars, setCollapsedChars] = useState<Set<string>>(
      () => new Set(),
    );
    const toggleCharTrack = useCallback((cid: string) => {
      setCollapsedChars((prev) => {
        const next = new Set(prev);
        if (next.has(cid)) next.delete(cid);
        else next.add(cid);
        return next;
      });
    }, []);

    /** 角色轨占用的全局下标（这些指令从固定轨 V2 分离） */
    const charOpIndices = useMemo(
      () => new Set(charGroups.flatMap((g) => g.indices)),
      [charGroups],
    );

    const trackIndexOf = useCallback(
      (key: string): number[] => {
        if (key.startsWith("char:")) {
          return charGroups.find((g) => `char:${g.characterId}` === key)?.indices ?? [];
        }
        return indicesOnTrack(script, key.slice(4) as CutTrackId);
      },
      [script, charGroups],
    );


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
      const to = dropTargetRef.current;
      setDragFrom(null);
      setDropTarget(null);
      if (!from || !to || from.trackId !== to.trackId) return;
      if (from.localIndex === to.localIndex) return;
      if (onReorderTrack) {
        onReorderTrack(from.trackId, from.localIndex, to.localIndex);
        return;
      }
      if (onReorder) {
        const indices = trackIndexOf(from.trackId);
        const fromGlobal = indices[from.localIndex];
        const toGlobal = indices[to.localIndex];
        if (fromGlobal != null && toGlobal != null) {
          onReorder(fromGlobal, toGlobal);
        }
      }
    }, [onReorder, onReorderTrack, script]);

    useEffect(() => {
      if (dragFrom == null) return;

      const onMove = (e: PointerEvent) => {
        const el = scrollRef.current;
        if (!el || !script.length || !dragFrom) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left + el.scrollLeft - TIMELINE_PAD;
        const indices = trackIndexOf(dragFrom.trackId);
        const local = localIndexAtPixelForIndices(indices, script, x, zoom);
        const target = { trackId: dragFrom.trackId, localIndex: local };
        dropTargetRef.current = target;
        setDropTarget(target);
        const globalIdx = indices[local];
        if (globalIdx != null) onScrub(globalIdx);
      };

      const onUp = () => finishDrag();

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, [dragFrom, script, zoom, onScrub, finishDrag, trackIndexOf]);

    const playheadLeft =
      script.length > 0 && script[safeCursor]
        ? TIMELINE_PAD +
          (positions[safeCursor] ?? 0) +
          clipWidth(script[safeCursor], zoom) / 2
        : TIMELINE_PAD;

    const dropMarkerLeft =
      dropTarget != null &&
      dragFrom != null &&
      dropTarget.trackId === dragFrom.trackId
        ? (() => {
            const indices = trackIndexOf(dropTarget.trackId);
            const globalIdx = indices[dropTarget.localIndex];
            if (globalIdx == null) return null;
            return (
              TIMELINE_PAD +
              (positions[globalIdx] ?? 0) +
              clipWidth(script[globalIdx], zoom) / 2
            );
          })()
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
        .filter(
          ({ inst, i }) =>
            trackForOp(inst.op) === track.id &&
            !(track.id === "visual" && charOpIndices.has(i)),
        ),
    }));

    return (
      <div className="flex h-full min-h-0 flex-col bg-panel">
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-surface-raised px-3">
          <span className="text-[11px] font-medium tracking-wide text-ink-muted">
            指令轨 · 当前 Beat
            {onReorderTrack && (
              <span className="ml-2 text-[9px] font-normal text-ink-faint">
                分轨内拖拽排序 · 右缘拖拽改时长
              </span>
            )}
            {!onReorderTrack && onReorder && (
              <span className="ml-2 text-[9px] font-normal text-ink-faint">
                拖拽片段排序 · 右缘拖拽改时长
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
                  {charGroups.map((group) => {
                    const key = `char:${group.characterId}`;
                    const collapsed = collapsedChars.has(group.characterId);
                    const label =
                      characterLabels[group.characterId] ??
                      `角色 ${group.characterId.slice(0, 8)}`;
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => toggleCharTrack(group.characterId)}
                          className="flex h-6 w-full items-center gap-1.5 border-b border-border bg-surface-raised px-3 text-left transition-colors hover:bg-panel"
                        >
                          <span
                            className={`text-[9px] text-ink-faint transition-transform ${collapsed ? "" : "rotate-90"}`}
                          >
                            ▶
                          </span>
                          <span className="truncate text-[10px] font-medium text-ink-muted">
                            {label}
                          </span>
                          <span className="font-mono text-[9px] text-ink-faint">
                            角色 · {group.indices.length}
                          </span>
                        </button>
                        {!collapsed && (
                          <TrackRow
                            trackId={key}
                            script={script}
                            positions={positions}
                            zoom={zoom}
                            zoomLevel={zoom}
                            selectedIndex={safeSelected}
                            dragFrom={
                              dragFrom?.trackId === key ? dragFrom.localIndex : null
                            }
                            clipIndices={group.indices}
                            onSelectClip={onSelectClip}
                            onDragStartLocal={
                              onReorderTrack
                                ? (
                                    localIndex: number,
                                    globalIndex: number,
                                  ) =>
                                    setDragFrom({
                                      trackId: key,
                                      localIndex,
                                      globalIndex,
                                    })
                                : undefined
                            }
                            onDeleteClip={onDeleteClip}
                          />
                        )}
                      </div>
                    );
                  })}

                  {clipsByTrack.map((track) => (
                    <TrackRow
                      key={track.id}
                      trackId={track.id}
                      script={script}
                      positions={positions}
                      zoom={zoom}
                      selectedIndex={safeSelected}
                      dragFrom={
                        dragFrom?.trackId === track.id ? dragFrom.localIndex : null
                      }
                      clipIndices={track.clips.map((c) => c.i)}
                      onSelectClip={onSelectClip}
                      onDragStartLocal={
                        onReorderTrack || onReorder
                          ? (localIndex, globalIndex) =>
                              setDragFrom({
                                trackId: track.id,
                                localIndex,
                                globalIndex,
                              })
                          : undefined
                      }
                      onDeleteClip={onDeleteClip}
                      onDurationChange={onDurationChange}
                      zoomLevel={zoom}
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
  zoomLevel,
  selectedIndex,
  dragFrom,
  clipIndices,
  onSelectClip,
  onDragStartLocal,
  onDeleteClip,
  onDurationChange,
}: {
  trackId: string;
  script: Instruction[];
  positions: number[];
  zoom: number;
  zoomLevel: number;
  selectedIndex: number;
  dragFrom: number | null;
  clipIndices: number[];
  onSelectClip: (index: number) => void;
  onDragStartLocal?: (localIndex: number, globalIndex: number) => void;
  onDeleteClip?: (index: number) => void;
  onDurationChange?: (index: number, ms: number) => void;
}) {
  const localIndexByGlobal = new Map(
    clipIndices.map((globalIdx, localIdx) => [globalIdx, localIdx]),
  );
  const [resizeFrom, setResizeFrom] = useState<{
    index: number;
    startX: number;
    startW: number;
  } | null>(null);

  useEffect(() => {
    if (!resizeFrom || !onDurationChange) return;
    const inst = script[resizeFrom.index];
    if (!inst || !canResizeClipDuration(inst)) return;

    const onMove = (e: PointerEvent) => {
      const delta = e.clientX - resizeFrom.startX;
      const nextW = Math.max(32, resizeFrom.startW + delta);
      const ms = msFromClipWidth(inst, nextW, zoomLevel);
      onDurationChange(resizeFrom.index, ms);
    };
    const onUp = () => setResizeFrom(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizeFrom, script, zoomLevel, onDurationChange]);

  return (
    <div
      className="relative border-b border-border"
      style={{ height: TRACK_H }}
    >
      {clipIndices.map((globalIdx) => {
        const inst = script[globalIdx];
        if (!inst) return null;
        const localIdx = localIndexByGlobal.get(globalIdx) ?? 0;
        const w = clipWidth(inst, zoom);
        const active = globalIdx === selectedIndex;
        const dragging = dragFrom === localIdx;
        return (
          <div
            key={`${trackId}-${globalIdx}`}
            style={{
              left: TIMELINE_PAD + positions[globalIdx],
              width: w,
              height: TRACK_H - 6,
            }}
            className={cn(
              "absolute top-[3px]",
              active && "z-10",
              dragging && "z-20",
            )}
          >
            <button
              type="button"
              onPointerDown={(e) => {
                if (!onDragStartLocal || e.button !== 0) return;
                e.stopPropagation();
                onDragStartLocal(localIdx, globalIdx);
                onSelectClip(globalIdx);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (dragFrom != null) return;
                onSelectClip(globalIdx);
              }}
              style={{ width: w, height: TRACK_H - 6 }}
              className={cn(
                "cursor-grab overflow-hidden rounded-sm border px-1.5 text-left transition-shadow active:cursor-grabbing",
                clipColor(inst),
                active && "ring-2 ring-accent-soft ring-offset-1 ring-offset-panel",
                dragging && "opacity-60",
              )}
              title={clipLabel(inst)}
            >
              <span className="block truncate text-[9px] font-medium leading-tight opacity-90">
                {clipLabel(inst)}
              </span>
            </button>
            {active && onDeleteClip && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClip(globalIdx);
                }}
                className="absolute right-0.5 top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded bg-black/50 text-ink hover:bg-danger hover:text-ink"
                title="删除此片段"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            {active && onDurationChange && canResizeClipDuration(inst) && (
              <div
                role="separator"
                aria-label="调整片段时长"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  e.preventDefault();
                  setResizeFrom({ index: globalIdx, startX: e.clientX, startW: w });
                }}
                className="absolute bottom-0 right-0 top-0 z-30 w-2 cursor-ew-resize rounded-r-sm bg-accent-soft/40 hover:bg-accent-soft/70"
                title="拖拽调整时长"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
