import { type ReactNode } from "react";

import { cn } from "./formStyles";

type WorkspaceHeaderVariant = "default" | "dense" | "immersive";

interface WorkspaceHeaderProps {
  title?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: WorkspaceHeaderVariant;
}

const variantClasses: Record<WorkspaceHeaderVariant, string> = {
  default: "px-4 py-3 sm:px-6",
  dense: "px-4 py-2 sm:px-5",
  immersive:
    "border-transparent bg-transparent px-3 py-2 backdrop-blur-none sm:px-4",
};

export default function WorkspaceHeader({
  title,
  leading,
  actions,
  className = "",
  variant = "default",
}: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/95 backdrop-blur-sm",
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {leading}
        {title && (
          <div className="min-w-0 text-sm font-medium text-ink">{title}</div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
      )}
    </div>
  );
}

export type { WorkspaceHeaderVariant };
