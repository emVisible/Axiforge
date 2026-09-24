import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/components/ui";
import { formatNarrativeTime } from "./timelineUtils";

interface TransportBarProps {
  isPlaying: boolean;
  currentTimeMs: number;
  totalTimeMs: number;
  clipIndex: number;
  clipCount: number;
  onTogglePlay: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  beatTitle?: string;
  masterBeatCount?: number;
}

export default function TransportBar({
  isPlaying,
  currentTimeMs,
  totalTimeMs,
  clipIndex,
  clipCount,
  onTogglePlay,
  onStepPrev,
  onStepNext,
  onGoToStart,
  onGoToEnd,
  beatTitle,
  masterBeatCount,
}: TransportBarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-surface-raised px-3">
      <div className="flex items-center gap-0.5">
        <TransportBtn title="回到开头" onClick={onGoToStart}>
          <SkipBack className="h-3.5 w-3.5" />
        </TransportBtn>
        <TransportBtn title="上一条指令" onClick={onStepPrev}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </TransportBtn>
        <button
          type="button"
          title={isPlaying ? "暂停预览" : "连续预览"}
          onClick={onTogglePlay}
          className="mx-1 flex h-7 w-7 items-center justify-center rounded-md bg-border-strong text-ink transition-colors hover:bg-ink-faint"
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" fill="currentColor" />
          ) : (
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          )}
        </button>
        <TransportBtn title="下一条指令" onClick={onStepNext}>
          <ChevronRight className="h-3.5 w-3.5" />
        </TransportBtn>
        <TransportBtn title="跳到末尾" onClick={onGoToEnd}>
          <SkipForward className="h-3.5 w-3.5" />
        </TransportBtn>
      </div>

      <div className="font-mono text-2xs tabular-nums text-ink-muted">
        <span className="text-ink">
          指令 {clipCount === 0 ? 0 : clipIndex + 1}/{clipCount}
        </span>
        {clipCount > 0 && (
          <>
            <span className="mx-2 text-ink-faint">·</span>
            <span title="预估阅读时长">
              {formatNarrativeTime(currentTimeMs)} / {formatNarrativeTime(totalTimeMs)}
            </span>
          </>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      <span className="min-w-0 truncate text-2xs text-ink-muted">
        {beatTitle ? (
          <>
            <span className="text-ink-muted">Beat · </span>
            {beatTitle}
            {masterBeatCount != null && masterBeatCount > 1 && (
              <span className="ml-1.5 text-ink-faint">
                （全片 {masterBeatCount} Beat）
              </span>
            )}
          </>
        ) : (
          "从左侧选择 Beat"
        )}
      </span>
    </div>
  );
}

function TransportBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-ink-muted",
        "transition-colors hover:bg-border hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
