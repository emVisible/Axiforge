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
            /* 原按 isDark 手写过一层半透明白边框；语义边框本身已随主题取值 */
            "border-t border-border-strong pt-4",
          )}
        >
          {expanded}
        </div>
      )}
    </div>
  );
}
