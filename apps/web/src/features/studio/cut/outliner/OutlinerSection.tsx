import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/shared/components/ui";

interface OutlinerSectionProps {
  title: string;
  icon?: ReactNode;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export default function OutlinerSection({
  title,
  icon,
  count,
  open,
  onToggle,
  children,
  actions,
}: OutlinerSectionProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-1 bg-surface pr-1">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-left transition-colors hover:bg-panel-raised"
        >
          {open ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={2} />
          )}
          {icon}
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {title}
          </span>
          {count != null && (
            <span className="ml-auto font-mono text-[9px] text-ink-faint">{count}</span>
          )}
        </button>
        {actions}
      </div>
      {open && <div className="max-h-[min(280px,35vh)] overflow-y-auto bg-panel p-1.5">{children}</div>}
    </div>
  );
}

export function OutlinerRow({
  active,
  onClick,
  onDoubleClick,
  children,
  className,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] transition-colors",
        active
          ? "bg-panel-raised text-ink"
          : "text-ink-muted hover:bg-surface-raised hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
