import type { ComponentType, ReactNode } from "react";

import { cn } from "./formStyles";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  className?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className = "",
}: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">{label}</p>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-muted text-brand">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted/70">{hint}</p>}
    </div>
  );
}

export function StatCardGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
  );
}
