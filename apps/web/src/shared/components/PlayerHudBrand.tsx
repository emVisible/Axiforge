import { Link } from "react-router";

import AppBrand from "@/shared/components/AppBrand";
import { routes } from "@/shared/lib/routes";

interface PlayerHudBrandProps {
  subtitle?: string;
}

/** Player 顶栏左侧：品牌 + 当前舞台/剧本信息 */
export default function PlayerHudBrand({ subtitle }: PlayerHudBrandProps) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <Link
        to={routes.discover}
        className="shrink-0 opacity-80 transition-opacity hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <AppBrand variant="dark" zone="Play" href={routes.discover} />
      </Link>
      {subtitle && (
        <span className="hidden truncate text-xs tracking-wide text-white/25 sm:inline">
          {subtitle}
        </span>
      )}
    </div>
  );
}
