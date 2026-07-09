import { type ReactNode } from "react";
import { Link } from "react-router";
import { Moon, Sun } from "lucide-react";

import GlobalSearch from "@/shared/components/GlobalSearch";
import UserAccountMenu from "@/shared/components/UserAccountMenu";
import AppBrand from "@/shared/components/AppBrand";
import { routes } from "@/shared/lib/routes";
import { useTheme } from "@/app/providers/ThemeProvider";
import { cn } from "@/shared/components/ui";

interface AppHeaderProps {
  variant?: "light" | "dark" | "auto";
  zone?: string;
  showDiscoverLink?: boolean;
  showStudioLink?: boolean;
  showDocsLink?: boolean;
  showSearch?: boolean;
  showVersion?: boolean;
  showThemeToggle?: boolean;
  leading?: ReactNode;
  children?: ReactNode;
  dense?: boolean;
}

export default function AppHeader({
  variant = "auto",
  zone,
  showDiscoverLink = false,
  showStudioLink = false,
  showDocsLink = false,
  showSearch = false,
  showVersion = false,
  showThemeToggle = true,
  leading,
  children,
  dense = false,
}: AppHeaderProps) {
  const { theme, toggle } = useTheme();
  const resolved = variant === "auto" ? theme : variant;
  const isDark = resolved === "dark";
  const brandVariant = isDark ? "dark" : "light";

  const navLinkClass = isDark
    ? "rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink"
    : "rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-ink";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm",
        dense && "[&_[data-header-inner]]:h-11",
      )}
    >
      <div
        data-header-inner
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
          dense ? "h-11" : "h-14",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <AppBrand variant={brandVariant} zone={zone} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showDiscoverLink && (
            <Link to={routes.discover} className={`hidden sm:inline ${navLinkClass}`}>
              发现
            </Link>
          )}
          {showStudioLink && (
            <Link to={routes.studio} className={navLinkClass}>
              工作台
            </Link>
          )}
          {showDocsLink && (
            <Link to={routes.docs} className={`hidden sm:inline ${navLinkClass}`}>
              文档
            </Link>
          )}
          {showSearch && <GlobalSearch />}
          {showThemeToggle && (
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg border border-border p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
              aria-label={theme === "dark" ? "切换到日间主题" : "切换到夜间主题"}
              title={theme === "dark" ? "日间" : "夜间"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          )}
          <UserAccountMenu variant={brandVariant} />
          {showVersion && (
            <span className="hidden font-mono text-[10px] text-ink-faint sm:inline">
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
