import { NavLink } from "react-router";
import {
  MapPin,
  Package,
  ScrollText,
  Users,
} from "lucide-react";

import { routes } from "@/shared/lib/routes";
import { cn } from "@/shared/components/ui";

const MOBILE_ITEMS = [
  { key: "projects", label: "剧本", href: routes.projects, icon: ScrollText },
  { key: "characters", label: "角色", href: routes.characters.mine, icon: Users },
  { key: "items", label: "道具", href: routes.items, icon: Package },
  { key: "scenes", label: "场景", href: routes.scenes, icon: MapPin },
];

export default function StudioMobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden"
      aria-label="创作导航"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-brand" : "text-ink-muted",
                )
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
