import { Outlet, useLocation } from "react-router";
import {
  MapPin,
  Package,
  ScrollText,
  Users,
  Compass,
  Plus,
  User,
} from "lucide-react";
import { TabBar } from "@axiforge/ui";
import type { TabItem } from "@axiforge/ui";

import GlobalSearch from "@/components/GlobalSearch";
import { APP_NAME } from "@/lib/constants";
import { routes } from "@/lib/routes";

const STUDIO_TABS: TabItem[] = [
  { key: "projects", label: "剧本", href: routes.projects, icon: ScrollText },
  { key: "characters", label: "角色", href: routes.characters.index, icon: Users },
  { key: "items", label: "道具", href: routes.items, icon: Package },
  { key: "scenes", label: "场景", href: routes.scenes, icon: MapPin },
];

const CHARACTER_TABS: TabItem[] = [
  { key: "explore", label: "探索", href: routes.characters.index, icon: Compass, end: true },
  { key: "create", label: "创建", href: routes.characters.create, icon: Plus },
  { key: "mine", label: "我的", href: routes.characters.mine, icon: User },
];

function activeStudioTab(pathname: string) {
  return pathname.split("/")[2] || "projects";
}

export default function StudioLayout() {
  const { pathname } = useLocation();
  const inCharacters = activeStudioTab(pathname) === "characters";

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-sans">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-ink">
                {APP_NAME}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Studio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <span className="hidden font-mono text-[10px] text-ink-muted sm:inline">
              v1.0
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TabBar items={STUDIO_TABS} />
        </div>

        {inCharacters && (
          <div className="border-t border-border bg-canvas/80">
            <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
              <TabBar items={CHARACTER_TABS} variant="pill" />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-3 text-center">
        <span className="font-mono text-[10px] text-ink-muted/70">
          Axiforge · Narrative Simulation Platform
        </span>
      </footer>
    </div>
  );
}
