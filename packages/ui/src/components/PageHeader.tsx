import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  action,
  meta,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
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
