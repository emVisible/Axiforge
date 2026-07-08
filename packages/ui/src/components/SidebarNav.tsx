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
    <nav className={cn("flex flex-col gap-6 p-3", className)} aria-label="侧栏导航">
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
    <div className="flex flex-col gap-1">
      {label && (
        <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted/70">
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
}

export function SidebarNavLink({ item, nested = false }: SidebarNavLinkProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
          nested ? "px-3 py-2 pl-9 text-xs" : "px-3 py-2",
          isActive
            ? "bg-brand-muted text-brand"
            : "text-ink-muted hover:bg-canvas hover:text-ink",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
          )}
          {Icon && (
            <Icon
              className={cn(
                "shrink-0",
                nested ? "h-3.5 w-3.5" : "h-4 w-4",
              )}
              strokeWidth={1.75}
            />
          )}
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
