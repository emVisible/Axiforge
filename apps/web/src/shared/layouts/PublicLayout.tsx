import { Outlet } from "react-router";

import AppHeader from "@/shared/components/AppHeader";
import DiscoverAtmosphere from "@/shared/components/DiscoverAtmosphere";
import { useTheme } from "@/app/providers/ThemeProvider";

export function DiscoverLayout() {
  return <PublicLayout zone="Discover" atmosphere />;
}

export function AccountLayout() {
  return <PublicLayout zone="账户" />;
}

function PublicLayout({
  zone,
  atmosphere = false,
}: {
  zone?: string;
  atmosphere?: boolean;
}) {
  const { theme } = useTheme();
  const showAtmosphere = atmosphere && theme === "dark";

  return (
    <div className="relative min-h-screen bg-canvas font-sans text-ink">
      {showAtmosphere && <DiscoverAtmosphere />}

      <div className="relative z-10">
        <AppHeader
          variant="auto"
          zone={zone}
          showDiscoverLink={false}
          showStudioLink
          showVersion
        />

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PublicLayout;
