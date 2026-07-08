import { type ReactNode, type MouseEvent } from "react";
import { Trash2 } from "lucide-react";

import { CardLink } from "./Card";
import { cardTheme, type SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";

interface EntityCardProps {
  to: string;
  title: string;
  subtitle?: string;
  description?: string;
  badges?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  footer?: ReactNode;
  onDelete?: () => void;
  theme?: SurfaceTheme;
  className?: string;
}

export function EntityIcon({
  children,
  theme = "light",
  className = "",
}: {
  children: ReactNode;
  theme?: SurfaceTheme;
  className?: string;
}) {
  const t = cardTheme[theme];
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        t.iconBox,
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function EntityCard({
  to,
  title,
  subtitle,
  description,
  badges,
  meta,
  leading,
  footer,
  onDelete,
  theme = "light",
  className = "",
}: EntityCardProps) {
  const t = cardTheme[theme];

  const handleDelete = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <CardLink to={to} theme={theme} className={cn("relative", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading}
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "truncate text-sm font-semibold transition-colors",
                t.title,
              )}
            >
              {title}
            </h3>
            {subtitle && (
              <p className={cn("mt-0.5 truncate text-xs", t.subtitle)}>
                {subtitle}
              </p>
            )}
            {description && (
              <p
                className={cn(
                  "mt-1 line-clamp-2 text-xs leading-relaxed",
                  t.description,
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100",
              t.deleteBtn,
            )}
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
            <span className={cn("ml-auto text-[10px]", t.meta)}>{meta}</span>
          )}
        </div>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </CardLink>
  );
}
