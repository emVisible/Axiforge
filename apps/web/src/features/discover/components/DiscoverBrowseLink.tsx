import { Link } from "react-router";
import { Compass } from "lucide-react";

import { routes } from "@/shared/lib/routes";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

interface DiscoverBrowseLinkProps {
  tab?: "projects" | "characters" | "items" | "scenes";
  label?: string;
}

export default function DiscoverBrowseLink({
  tab,
  label = "去 Discover 浏览更多",
}: DiscoverBrowseLinkProps) {
  // 桌面是唯一发布目标：/discover 在桌面是显式缺席（见 DiscoverPage 的 isLocalOnlyDeployment 分支
  // 与 E18 的不变量），那就不该在任何页面上留一个通向它的入口。闸门收在这里，
  // 而不是散在每个调用点——原先 ProjectListPage 挡了、ItemsPage 与 SceneAssetsPage 没挡。
  if (isLocalOnlyDeployment()) return null;
  const href = tab ? `${routes.discover}?tab=${tab}` : routes.discover;
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand/30 hover:text-brand"
    >
      <Compass className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
