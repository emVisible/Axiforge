import { type ReactNode } from "react";

import { cn } from "./formStyles";

interface WorkspaceHeaderProps {
  title?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function WorkspaceHeader({
  title,
  leading,
  actions,
  className = "",
}: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading}
        {title && (
          <div className="min-w-0 text-sm font-medium text-ink">{title}</div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
