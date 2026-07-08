import { type ReactNode } from "react";

import { cn } from "./formStyles";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
  dense?: boolean;
}

export default function PageHeader({
  title,
  description,
  action,
  meta,
  dense = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4",
        dense ? "mb-5" : "mb-8",
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {(description || meta) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {description && (
              <p className="text-sm text-ink-muted">{description}</p>
            )}
            {meta}
          </div>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
