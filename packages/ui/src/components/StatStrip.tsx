import type { ComponentType, ReactNode } from "react";
import { cn } from "./formStyles";

interface StatStripItemProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
}

/** Dense metric cell for dashboards (Blender/outliner density). */
export function StatStripItem({
  label,
  value,
  hint,
  icon: Icon,
}: StatStripItemProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-3xs font-medium uppercase tracking-wider text-ink-faint">
          {label}
        </p>
        <p className="text-lg font-semibold tabular-nums leading-tight text-ink">
          {value}
        </p>
        {hint && (
          <p className="truncate text-3xs text-ink-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}

export function StatStrip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
