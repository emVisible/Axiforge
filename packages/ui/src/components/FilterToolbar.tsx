import { type ReactNode } from "react";

import SearchInput from "./SearchInput";
import { cn } from "./formStyles";
import type { SearchWidth } from "./searchTheme";

interface FilterToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchClear?: () => void;
  searchWidth?: SearchWidth;
  children?: ReactNode;
  expanded?: ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export default function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "搜索...",
  onSearchClear,
  searchWidth = "md",
  children,
  expanded,
  className = "",
  variant = "light",
}: FilterToolbarProps) {
  const isDark = variant === "dark";

  return (
    <div className={cn("mb-6 space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange !== undefined && (
          <SearchInput
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onSearchClear ?? (() => onSearchChange(""))}
            placeholder={searchPlaceholder}
            variant={variant}
            size="md"
            width={searchWidth}
          />
        )}
        {children && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {children}
          </div>
        )}
      </div>
      {expanded && (
        <div
          className={cn(
            "border-t pt-4",
            isDark ? "border-white/10" : "border-border",
          )}
        >
          {expanded}
        </div>
      )}
    </div>
  );
}
