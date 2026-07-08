import {
  LayoutDashboard,
  MapPin,
  Package,
  ScrollText,
  Users,
} from "lucide-react";

import {
  SidebarNav,
  SidebarNavGroup,
  SidebarNavLink,
  type SidebarNavItem,
} from "@/shared/components/ui";
import { routes } from "@/shared/lib/routes";
import { cn } from "@/shared/components/ui";

/** Cursor-style flat groups; all primary labels are two characters. */
const OVERVIEW_ITEM: SidebarNavItem = {
  key: "dashboard",
  label: "概览",
  href: routes.dashboard,
  icon: LayoutDashboard,
  end: true,
};

const CREATION_ITEMS: SidebarNavItem[] = [
  { key: "projects", label: "剧本", href: routes.projects, icon: ScrollText },
  { key: "items", label: "道具", href: routes.items, icon: Package },
  { key: "scenes", label: "场景", href: routes.scenes, icon: MapPin },
  { key: "characters", label: "角色", href: routes.characters.mine, icon: Users },
];

interface StudioNavContentProps {
  className?: string;
  rail?: boolean;
}

export default function StudioNavContent({
  className = "",
  rail = false,
}: StudioNavContentProps) {
  if (rail) {
    const items = [OVERVIEW_ITEM, ...CREATION_ITEMS];
    return (
      <nav
        className={cn("flex flex-col items-center gap-0.5 py-2", className)}
        aria-label="侧栏导航（精简）"
      >
        {items.map((item) => (
          <SidebarNavLink key={item.key} item={item} iconOnly title={item.label} />
        ))}
      </nav>
    );
  }

  return (
    <SidebarNav className={cn("gap-5", className)}>
      <SidebarNavGroup label="工作室">
        <SidebarNavLink item={OVERVIEW_ITEM} />
      </SidebarNavGroup>
      <SidebarNavGroup label="创作">
        {CREATION_ITEMS.map((item) => (
          <SidebarNavLink key={item.key} item={item} />
        ))}
      </SidebarNavGroup>
    </SidebarNav>
  );
}
