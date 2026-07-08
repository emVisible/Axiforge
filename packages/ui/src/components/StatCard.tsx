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
    <div className={cn("rounded-xl border border-border bg-surface p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">{label}</p>
        {Icon && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-muted text-brand">
            <Icon className="h-3 w-3" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-ink-muted">{hint}</p>}
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
    <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>
  );
}
