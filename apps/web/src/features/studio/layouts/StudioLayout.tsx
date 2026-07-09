import { Outlet, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import AppHeader from "@/shared/components/AppHeader";
import StudioSidebar from "@/features/studio/layouts/StudioSidebar";
import StudioSidebarDrawer from "@/features/studio/layouts/StudioSidebarDrawer";
import StudioMobileNav from "@/features/studio/layouts/StudioMobileNav";
import {
  StudioChromeProvider,
  useStudioChrome,
} from "@/features/studio/layouts/StudioChromeContext";
import { cn } from "@/shared/components/ui";

function StudioLayoutInner() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { sidebarRail } = useStudioChrome();
  const isImmersiveWorkspace = /\/studio\/projects\/(?!new$)[^/]+$/.test(pathname);

  return (
    <div
      className={cn(
        "flex flex-col bg-canvas font-sans text-ink",
        isImmersiveWorkspace ? "h-screen overflow-hidden" : "min-h-screen",
      )}
    >
      <AppHeader
        variant="auto"
        zone="Studio"
        showDiscoverLink
        showDocsLink
        showSearch
        showVersion
        dense={isImmersiveWorkspace}
        leading={
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-panel hover:text-ink md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开导航菜单"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <StudioSidebar rail={isImmersiveWorkspace && sidebarRail} />
        <main
          className={cn(
            "min-w-0 flex-1",
            isImmersiveWorkspace
              ? "flex flex-col overflow-hidden"
              : "overflow-auto pb-16 md:pb-0",
          )}
        >
          <Outlet />
        </main>
      </div>

      {!isImmersiveWorkspace && <StudioMobileNav />}
      <StudioSidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

export default function StudioLayout() {
  return (
    <StudioChromeProvider>
      <StudioLayoutInner />
    </StudioChromeProvider>
  );
}
