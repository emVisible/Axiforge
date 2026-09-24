import { type ReactNode } from "react";
import { NavLink } from "react-router";
import type { LucideIcon } from "lucide-react";

import { cn } from "./formStyles";

export interface SidebarNavItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface SidebarNavProps {
  children: ReactNode;
  className?: string;
}

export function SidebarNav({ children, className = "" }: SidebarNavProps) {
  return (
    <nav className={cn("flex flex-col gap-5 px-2 py-3", className)} aria-label="侧栏导航">
      {children}
    </nav>
  );
}

interface SidebarNavGroupProps {
  label?: string;
  children: ReactNode;
}

export function SidebarNavGroup({ label, children }: SidebarNavGroupProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <p className="px-2.5 pb-1.5 text-3xs font-medium uppercase tracking-wider text-ink-faint">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

interface SidebarNavLinkProps {
  item: SidebarNavItem;
  nested?: boolean;
  iconOnly?: boolean;
  title?: string;
}

export function SidebarNavLink({
  item,
  nested = false,
  iconOnly = false,
  title,
}: SidebarNavLinkProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      end={item.end}
      title={title ?? item.label}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
          iconOnly
            ? "justify-center px-2 py-2"
            : nested
              ? "px-2.5 py-1.5 pl-8 text-xs"
              : "px-2.5 py-1.5",
          isActive
            ? "bg-panel-raised text-ink"
            : "text-ink-muted hover:bg-panel hover:text-ink",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !iconOnly && (
            <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
          )}
          {Icon && (
            <Icon
              className={cn(
                "shrink-0",
                nested ? "h-3.5 w-3.5" : "h-4 w-4",
                isActive ? "text-brand" : "text-ink-muted",
              )}
              strokeWidth={1.75}
            />
          )}
          {!iconOnly && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
