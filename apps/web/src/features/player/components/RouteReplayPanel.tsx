import type { RouteHistory } from "@/shared/lib/routeHistory";

interface RouteReplayPanelProps {
  history: RouteHistory;
  onClose: () => void;
}

export default function RouteReplayPanel({
  history,
  onClose,
}: RouteReplayPanelProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="text-sm tracking-wider text-white/50">分支回想</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
            已达成结局 ({history.endings.length})
          </h3>
          {history.endings.length === 0 ? (
            <p className="text-sm text-white/65">尚未达成任何结局</p>
          ) : (
            <ul className="space-y-2">
              {history.endings.map((e) => (
                <li
                  key={e}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-300/70"
                >
                  {e}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
            选择记录 ({history.choices.length})
          </h3>
          {history.choices.length === 0 ? (
            <p className="text-sm text-white/65">暂无分支选择记录</p>
          ) : (
            <ul className="space-y-2">
              {history.choices.map((c, i) => (
                <li
                  key={`${c.beatId}-${i}`}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white/40"
                >
                  <span className="text-white/20">→ </span>
                  {c.label}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
