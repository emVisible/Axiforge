import { useState } from "react";
import { BookOpen, UserRound } from "lucide-react";
import type { GlossaryEntry, CharacterProfile } from "@axiforge/core";
import { getImageUrl } from "@/shared/lib/imageUrl";

interface CodexPanelProps {
  glossary: GlossaryEntry[];
  profiles: CharacterProfile[];
  worldSetting?: string | null;
  onClose: () => void;
}

export default function CodexPanel({
  glossary,
  profiles,
  worldSetting,
  onClose,
}: CodexPanelProps) {
  const [tab, setTab] = useState<"terms" | "chars">("terms");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryEntry | null>(null);
  const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setTab("terms");
              setSelectedChar(null);
            }}
            className={`flex items-center gap-1.5 text-sm ${tab === "terms" ? "text-white/70" : "text-white/25"}`}
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
            术语
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("chars");
              setSelectedTerm(null);
            }}
            className={`flex items-center gap-1.5 text-sm ${tab === "chars" ? "text-white/70" : "text-white/25"}`}
          >
            <UserRound className="h-3.5 w-3.5" strokeWidth={1.75} />
            角色
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>

      {worldSetting && (
        <div className="border-b border-white/5 px-6 py-3">
          <p className="text-xs leading-relaxed text-white/30">{worldSetting}</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-40 shrink-0 overflow-y-auto border-r border-white/5 p-3 sm:w-48">
          {tab === "terms" &&
            glossary.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedTerm(g)}
                className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-xs ${
                  selectedTerm?.id === g.id
                    ? "bg-white/10 text-white/70"
                    : "text-white/35 hover:bg-white/5"
                }`}
              >
                {g.term}
              </button>
            ))}
          {tab === "chars" &&
            profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedChar(p)}
                className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-xs ${
                  selectedChar?.id === p.id
                    ? "bg-white/10 text-white/70"
                    : "text-white/35 hover:bg-white/5"
                }`}
              >
                {p.name}
              </button>
            ))}
          {tab === "terms" && glossary.length === 0 && (
            <p className="px-2 py-8 text-center text-[11px] text-white/15">暂无术语</p>
          )}
          {tab === "chars" && profiles.length === 0 && (
            <p className="px-2 py-8 text-center text-[11px] text-white/15">暂无角色档案</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTerm && (
            <div className="animate-fade-in space-y-3">
              <h3 className="text-lg text-white/80">{selectedTerm.term}</h3>
              <p className="text-sm leading-relaxed text-white/45">
                {selectedTerm.definition || "（暂无解释）"}
              </p>
            </div>
          )}
          {selectedChar && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-start gap-4">
                {selectedChar.imagePath && (
                  <img
                    src={getImageUrl(selectedChar.imagePath) || ""}
                    alt={selectedChar.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                )}
                <div>
                  <h3 className="text-lg text-white/80">{selectedChar.name}</h3>
                  {selectedChar.essence && (
                    <p className="mt-1 text-sm text-white/40">{selectedChar.essence}</p>
                  )}
                </div>
              </div>
              {selectedChar.summary && (
                <p className="text-sm text-white/50">{selectedChar.summary}</p>
              )}
              {selectedChar.identity && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/25">
                    身份
                  </span>
                  <p className="mt-1 text-sm text-white/45">{selectedChar.identity}</p>
                </div>
              )}
              {selectedChar.appearance && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/25">
                    外貌
                  </span>
                  <p className="mt-1 text-sm text-white/45">{selectedChar.appearance}</p>
                </div>
              )}
              {selectedChar.tags && selectedChar.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedChar.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {!selectedTerm && !selectedChar && (
            <p className="py-20 text-center text-sm text-white/15">选择左侧条目查看详情</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** 对话内术语浮层 */
export function TermTipPopover({
  term,
  definition,
  onClose,
}: {
  term: string;
  definition: string;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute bottom-32 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-6 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-xl border border-white/10 bg-black/90 p-4 shadow-xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-400/80">{term}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-white/30 hover:text-white/60"
          >
            关闭
          </button>
        </div>
        <p className="text-sm leading-relaxed text-white/55">{definition}</p>
      </div>
    </div>
  );
}
