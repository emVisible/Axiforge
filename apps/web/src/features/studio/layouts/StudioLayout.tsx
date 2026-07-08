import { useState } from "react";
import { Outlet } from "react-router";
import { Menu } from "lucide-react";

import AppHeader from "@/shared/components/AppHeader";
import StudioSidebar from "@/features/studio/layouts/StudioSidebar";
import StudioSidebarDrawer from "@/features/studio/layouts/StudioSidebarDrawer";
import StudioMobileNav from "@/features/studio/layouts/StudioMobileNav";

export default function StudioLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
      <AppHeader
        variant="light"
        zone="Studio"
        showDiscoverLink
        showSearch
        showVersion
        leading={
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开导航菜单"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        }
      />

      <div className="flex min-h-0 flex-1">
        <StudioSidebar />
        <main className="min-w-0 flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <StudioMobileNav />
      <StudioSidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
