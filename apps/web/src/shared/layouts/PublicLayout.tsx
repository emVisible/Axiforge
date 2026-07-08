import { Outlet } from "react-router";

import AppHeader from "@/shared/components/AppHeader";
import DiscoverAtmosphere from "@/shared/components/DiscoverAtmosphere";

interface PublicLayoutProps {
  variant: "light" | "dark";
  zone?: string;
}

export function DiscoverLayout() {
  return <PublicLayout variant="dark" zone="Discover" />;
}

export function AccountLayout() {
  return <PublicLayout variant="light" zone="账户" />;
}

function PublicLayout({ variant, zone }: PublicLayoutProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={`relative min-h-screen font-sans ${
        isDark
          ? "bg-gradient-to-b from-[#0d0d16] via-[#10101c] to-[#141428] text-white"
          : "bg-canvas text-ink"
      }`}
    >
      {isDark && <DiscoverAtmosphere />}

      <div className="relative z-10">
        <AppHeader
          variant={variant}
          zone={zone}
          showDiscoverLink
          showStudioLink
          showVersion={!isDark}
        />

        <main
          className={`mx-auto max-w-7xl pb-20 ${
            isDark ? "px-4 sm:px-6 lg:px-8 pt-6" : "px-4 sm:px-6 lg:px-8 py-8"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PublicLayout;
