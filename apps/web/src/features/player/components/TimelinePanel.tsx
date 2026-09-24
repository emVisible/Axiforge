import type { StoryPackage } from "@axiforge/core";
import { Check, Circle } from "lucide-react";

interface TimelinePanelProps {
  pkg: StoryPackage;
  completedBeatIds: Set<string>;
  currentBeatId: string | null;
  onClose: () => void;
}

export default function TimelinePanel({
  pkg,
  completedBeatIds,
  currentBeatId,
  onClose,
}: TimelinePanelProps) {
  const beats = [...pkg.beats].sort((a, b) => {
    const sa = pkg.scenes.find((s) => s.id === a.sceneId)?.title || "";
    const sb = pkg.scenes.find((s) => s.id === b.sceneId)?.title || "";
    return sa.localeCompare(sb);
  });

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="text-sm tracking-wider text-white/50">时间线 / 世界线</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <ul className="space-y-1 border-l border-white/10 pl-4">
          {beats.map((beat) => {
            const done = completedBeatIds.has(beat.id);
            const current = beat.id === currentBeatId;
            const scene = pkg.scenes.find((s) => s.id === beat.sceneId);
            return (
              <li key={beat.id} className="relative py-2">
                <span
                  className={`absolute -left-[21px] top-3 flex h-3 w-3 items-center justify-center rounded-full ${
                    done
                      ? "bg-emerald-500/30 text-emerald-400"
                      : current
                        ? "bg-brand/30 ring-2 ring-brand/50"
                        : "bg-white/10"
                  }`}
                >
                  {done && <Check className="h-2 w-2" strokeWidth={3} />}
                  {!done && current && (
                    <Circle className="h-1.5 w-1.5 fill-brand text-brand" />
                  )}
                </span>
                <p
                  className={`text-sm ${current ? "text-white/70" : done ? "text-white/45" : "text-white/25"}`}
                >
                  {beat.sceneTitle || scene?.title || "未命名场景"}
                  {beat.isEnding && beat.endingLabel && (
                    <span className="ml-2 text-3xs text-amber-400/60">
                      [{beat.endingLabel}]
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
