import { type ReactNode, type MouseEvent } from "react";
import { Trash2 } from "lucide-react";

import { CardLink } from "./Card";
import { cn } from "./formStyles";

interface EntityCardProps {
  to: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  onDelete?: () => void;
  className?: string;
}

export default function EntityCard({
  to,
  title,
  description,
  badges,
  meta,
  leading,
  onDelete,
  className = "",
}: EntityCardProps) {
  const handleDelete = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <CardLink to={to} className={cn("relative", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-ink group-hover:text-brand transition-colors">
              {title}
            </h3>
            {description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted/30 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            aria-label="删除"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
      {(badges || meta) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {badges}
          {meta && (
            <span className="ml-auto text-[10px] text-ink-muted/60">{meta}</span>
          )}
        </div>
      )}
    </CardLink>
  );
}
