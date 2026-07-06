import { type ReactNode } from "react";

import SearchInput from "./SearchInput";
import { Card } from "./Card";
import { cn } from "./formStyles";

interface FilterToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchClear?: () => void;
  children?: ReactNode;
  expanded?: ReactNode;
  className?: string;
}

export default function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "搜索...",
  onSearchClear,
  children,
  expanded,
  className = "",
}: FilterToolbarProps) {
  return (
    <Card padding="sm" className={cn("mb-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange !== undefined && (
          <SearchInput
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onSearchClear ?? (() => onSearchChange(""))}
            placeholder={searchPlaceholder}
            containerClassName="min-w-[200px] flex-1"
          />
        )}
        {children}
      </div>
      {expanded && (
        <div className="mt-4 border-t border-border pt-4">{expanded}</div>
      )}
    </Card>
  );
}
