
import AppBrand from "@/shared/components/AppBrand";

interface PlayerHudBrandProps {
  subtitle?: string;
}

/** Player 顶栏左侧：品牌 + 当前舞台/剧本信息 */
export default function PlayerHudBrand({ subtitle }: PlayerHudBrandProps) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      /*
       * 这里不能再用 Link 包一层：AppBrand 自己就是一个指向发现页的锚链接，套起来就是「锚里套锚」，
       * React 会打 "In HTML, a cannot be a descendant of a" 并留下 hydration 隐患。
       * 停掉冒泡仍然需要（播放器整屏 onClick=推进剧情，点品牌不该顺带翻一拍），所以换成 span 承担。
       */
      <span
        className="shrink-0 opacity-80 transition-opacity hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <AppBrand variant="dark" zone="Play" />
      </span>
      {subtitle && (
        <span className="hidden truncate text-xs tracking-wide text-white/25 sm:inline">
          {subtitle}
        </span>
      )}
    </div>
  );
}
