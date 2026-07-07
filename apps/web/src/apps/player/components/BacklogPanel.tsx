import { Volume2 } from "lucide-react";

export interface BacklogEntry {
  speaker: string | null;
  text: string;
  voice?: string | null;
}

interface BacklogPanelProps {
  entries: BacklogEntry[];
  onClose: () => void;
  onReplayVoice?: (voice: string) => void;
}

export default function BacklogPanel({
  entries,
  onClose,
  onReplayVoice,
}: BacklogPanelProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="text-sm tracking-wider text-white/50">对话回顾</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-8">
        {entries.map((entry, i) => (
          <div key={i} className="group flex gap-3">
            <div className="min-w-0 flex-1">
              {entry.speaker && (
                <p className="mb-0.5 text-xs text-white/40">{entry.speaker}</p>
              )}
              <p className="text-sm leading-relaxed text-white/30">{entry.text}</p>
            </div>
            {entry.voice && onReplayVoice && (
              <button
                type="button"
                onClick={() => onReplayVoice(entry.voice!)}
                className="mt-1 shrink-0 rounded-lg p-1.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                aria-label="重播语音"
              >
                <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <p className="py-20 text-center text-sm text-white/10">暂无对话记录</p>
        )}
      </div>
    </div>
  );
}
