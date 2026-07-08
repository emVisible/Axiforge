import { Lock, Music, Image as ImageIcon } from "lucide-react";
import type { StoryPackage } from "@axiforge/core";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { collectGalleryAssets } from "../lib/galleryAssets";
import type { PlayerUnlocks } from "@/shared/lib/playerUnlocks";

interface GalleryPanelProps {
  pkg: StoryPackage;
  unlocks: PlayerUnlocks;
  tab: "cg" | "music";
  onTabChange: (tab: "cg" | "music") => void;
  onClose: () => void;
}

export default function GalleryPanel({
  pkg,
  unlocks,
  tab,
  onTabChange,
  onClose,
}: GalleryPanelProps) {
  const assets = collectGalleryAssets(pkg);
  const items = tab === "cg" ? assets.cgs : assets.bgms;
  const unlocked = tab === "cg" ? unlocks.cgs : unlocks.bgms;

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onTabChange("cg")}
            className={`flex items-center gap-1.5 text-sm ${tab === "cg" ? "text-white/70" : "text-white/25 hover:text-white/40"}`}
          >
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
            CG
          </button>
          <button
            type="button"
            onClick={() => onTabChange("music")}
            className={`flex items-center gap-1.5 text-sm ${tab === "music" ? "text-white/70" : "text-white/25 hover:text-white/40"}`}
          >
            <Music className="h-3.5 w-3.5" strokeWidth={1.75} />
            音乐
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
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-6 sm:grid-cols-3">
        {items.length === 0 && (
          <p className="col-span-full py-20 text-center text-sm text-white/15">
            本作品暂无可鉴赏资产
          </p>
        )}
        {items.map((path) => {
          const isUnlocked = unlocked.includes(path);
          const src = getImageUrl(path);
          return (
            <div
              key={path}
              className={`relative aspect-video overflow-hidden rounded-xl border ${
                isUnlocked ? "border-white/10" : "border-white/5"
              }`}
            >
              {tab === "cg" && src && isUnlocked ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-white/[0.02]">
                  {!isUnlocked && <Lock className="h-5 w-5 text-white/15" strokeWidth={1.5} />}
                  <span className="max-w-[90%] truncate px-2 text-[10px] text-white/20">
                    {isUnlocked ? path.split("/").pop() : "？？？"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
