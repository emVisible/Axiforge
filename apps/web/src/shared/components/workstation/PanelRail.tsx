import type { ReactNode } from "react";
import { cn } from "@/shared/components/ui";

interface PanelRailProps {
  label: string;
  side: "left" | "right" | "bottom";
  onExpand: () => void;
  icon?: ReactNode;
  /** 展开提示中显示的快捷键，如 `\\` */
  shortcut?: string;
}

/** Collapsed strip — click to restore panel. */
export default function PanelRail({
  label,
  side,
  onExpand,
  icon,
  shortcut,
}: PanelRailProps) {
  const vertical = side === "left" || side === "right";
  const title = shortcut ? `展开 ${label} (${shortcut})` : `展开 ${label}`;
  return (
    <button
      type="button"
      onClick={onExpand}
      title={title}
      aria-label={title}
      className={cn(
        "flex shrink-0 items-center justify-center gap-1 border-border bg-panel text-3xs font-medium uppercase tracking-wider text-ink-faint transition-colors hover:bg-panel-raised hover:text-ink-muted",
        vertical
          ? "w-7 flex-col border-r px-0.5 py-3"
          : "h-7 w-full flex-row border-t px-3",
        side === "right" && "border-r-0 border-l",
      )}
    >
      {icon}
      <span className={cn(vertical && "writing-vertical-rl rotate-180")}>
        {label}
      </span>
    </button>
  );
}
