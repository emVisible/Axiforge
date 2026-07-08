import {
  LayoutDashboard,
  MapPin,
  Package,
  Plus,
  ScrollText,
  User,
  Users,
} from "lucide-react";

import {
  SidebarNav,
  SidebarNavGroup,
  SidebarNavLink,
  type SidebarNavItem,
} from "@/shared/components/ui";
import { routes } from "@/shared/lib/routes";

const OVERVIEW_ITEM: SidebarNavItem = {
  key: "dashboard",
  label: "概览",
  href: routes.dashboard,
  icon: LayoutDashboard,
  end: true,
};

const PRIMARY_ITEMS: SidebarNavItem[] = [
  { key: "projects", label: "剧本", href: routes.projects, icon: ScrollText },
  { key: "items", label: "道具", href: routes.items, icon: Package },
  { key: "scenes", label: "场景模板", href: routes.scenes, icon: MapPin },
];

const CHARACTER_ITEMS: SidebarNavItem[] = [
  {
    key: "characters-mine",
    label: "我的角色",
    href: routes.characters.mine,
    icon: User,
    end: true,
  },
  {
    key: "characters-create",
    label: "创建角色",
    href: routes.characters.create,
    icon: Plus,
  },
];

interface StudioNavContentProps {
  className?: string;
}

export default function StudioNavContent({ className = "" }: StudioNavContentProps) {
  return (
    <SidebarNav className={className}>
      <SidebarNavGroup label="工作室">
        <SidebarNavLink item={OVERVIEW_ITEM} />
      </SidebarNavGroup>
      <SidebarNavGroup label="创作">
        {PRIMARY_ITEMS.map((item) => (
          <SidebarNavLink key={item.key} item={item} />
        ))}
      </SidebarNavGroup>

      <SidebarNavGroup label="角色">
        <SidebarNavLink
          item={{
            key: "characters",
            label: "角色库",
            href: routes.characters.mine,
            icon: Users,
          }}
        />
        {CHARACTER_ITEMS.map((item) => (
          <SidebarNavLink key={item.key} item={item} nested />
        ))}
      </SidebarNavGroup>
    </SidebarNav>
  );
}
