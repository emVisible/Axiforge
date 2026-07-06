import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "./formStyles";

export interface TabItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface TabBarProps {
  items: TabItem[];
  variant?: "underline" | "pill";
  className?: string;
}

export default function TabBar({
  items,
  variant = "underline",
  className = "",
}: TabBarProps) {
  if (variant === "pill") {
    return (
      <div className={cn("flex items-center gap-1", className)} role="tablist">
        {items.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.key}
              to={tab.href}
              end={tab.end}
              role="tab"
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-muted text-brand"
                    : "text-ink-muted hover:bg-surface hover:text-ink",
                )
              }
            >
              {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    );
  }

  return (
    <nav className={cn("flex items-center", className)} role="tablist">
      {items.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.key}
            to={tab.href}
            end={tab.end}
            role="tab"
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors",
                isActive ? "text-brand" : "text-ink-muted hover:text-ink",
              )
            }
          >
            {({ isActive }) => (
              <>
                {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
