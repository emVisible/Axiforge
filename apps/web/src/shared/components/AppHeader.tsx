import { type ReactNode } from "react";
import { Link } from "react-router";

import GlobalSearch from "@/shared/components/GlobalSearch";
import UserAccountMenu from "@/shared/components/UserAccountMenu";
import AppBrand from "@/shared/components/AppBrand";
import { routes } from "@/shared/lib/routes";

interface AppHeaderProps {
  variant?: "light" | "dark";
  zone?: string;
  showDiscoverLink?: boolean;
  showStudioLink?: boolean;
  showSearch?: boolean;
  showVersion?: boolean;
  leading?: ReactNode;
  children?: ReactNode;
}

export default function AppHeader({
  variant = "light",
  zone,
  showDiscoverLink = false,
  showStudioLink = false,
  showSearch = false,
  showVersion = false,
  leading,
  children,
}: AppHeaderProps) {
  const isDark = variant === "dark";

  const navLinkClass = isDark
    ? "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
    : "rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-ink";

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-sm ${
        isDark
          ? "border-white/10 bg-[#0d0d16]/90"
          : "border-border bg-surface/95"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <AppBrand variant={variant} zone={zone} />
        </div>

        <div className="flex items-center gap-3">
          {showDiscoverLink && (
            <Link to={routes.discover} className={`hidden sm:inline ${navLinkClass}`}>
              发现
            </Link>
          )}
          {showStudioLink && (
            <Link to={routes.studio} className={navLinkClass}>
              进入创作
            </Link>
          )}
          {showSearch && <GlobalSearch />}
          <UserAccountMenu variant={variant} />
          {showVersion && (
            <span
              className={`hidden font-mono text-[10px] sm:inline ${
                isDark ? "text-white/25" : "text-ink-muted"
              }`}
            >
              v1.5
            </span>
          )}
        </div>
      </div>

      {children && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      )}
    </header>
  );
}
