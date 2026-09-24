import { Trash2 } from "lucide-react";
import type { SaveSlotResponse } from "@/shared/api/player";
import { getImageUrl } from "@/shared/lib/imageUrl";

export const MAX_SAVE_SLOTS = 6;
export const AUTO_SAVE_SLOT = 0;

interface SaveSlotPanelProps {
  slots: SaveSlotResponse[];
  mode: "load" | "save";
  currentSlot?: number;
  onSelect: (slot: number) => void;
  onDelete: (slot: number) => void;
  onClose: () => void;
}

function slotLabel(slot: number): string {
  return slot === AUTO_SAVE_SLOT ? "自动存档" : `存档 ${slot}`;
}

export default function SaveSlotPanel({
  slots,
  mode,
  currentSlot,
  onSelect,
  onDelete,
  onClose,
}: SaveSlotPanelProps) {
  const bySlot = new Map(slots.map((s) => [s.slot, s]));

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="text-sm tracking-wider text-white/50">
          {mode === "load" ? "读档" : "存档"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-6 sm:grid-cols-2">
        {Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => i).map((slot) => {
          const save = bySlot.get(slot);
          const thumb = getImageUrl(save?.thumb_path || undefined);
          const isAuto = slot === AUTO_SAVE_SLOT;
          const disabled = mode === "save" && isAuto;

          return (
            <div
              key={slot}
              className={`relative overflow-hidden rounded-xl border transition-colors ${
                currentSlot === slot
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(slot)}
                className={`flex w-full flex-col text-left ${disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/[0.04]"}`}
              >
                <div className="relative h-24 bg-white/[0.03]">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover opacity-70"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/10">
                      {save ? "无预览" : "空"}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-3xs text-white/50">
                    {slotLabel(slot)}
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  {save?.summary ? (
                    <p className="line-clamp-2 text-xs text-white/40">{save.summary}</p>
                  ) : (
                    <p className="text-xs text-white/15">
                      {save ? "（无摘要）" : "— 空槽 —"}
                    </p>
                  )}
                  {save?.updated_at && (
                    <p className="text-3xs text-white/15">
                      {new Date(save.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </button>
              {save && !isAuto && (
                <button
                  type="button"
                  onClick={() => onDelete(slot)}
                  className="absolute right-2 top-2 rounded-lg bg-black/40 p-1.5 text-white/30 hover:text-red-400"
                  aria-label="删除存档"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
