import type { ReactNode } from "react";

import type { SurfaceTheme } from "./cardTheme";
import { useResolvedSurfaceTheme } from "../hooks/useSurfaceTheme";

export type BadgeVariant =
  | "default"
  | "brand"
  | "blue"
  | "amber"
  | "emerald"
  | "rose"
  | "purple";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  /** @deprecated 读 runtime `data-theme` */
  tone?: SurfaceTheme;
  onRemove?: () => void;
}

const lightVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-canvas text-ink-muted border border-border",
  brand: "bg-brand-muted text-brand border border-brand/15",
  blue: "bg-blue-50 text-blue-700 border border-blue-100",
  amber: "bg-amber-50 text-amber-700 border border-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rose: "bg-rose-50 text-rose-700 border border-rose-100",
  purple: "bg-purple-50 text-purple-700 border border-purple-100",
};

const darkVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-panel text-ink-muted border border-border",
  brand: "bg-brand-muted text-brand border border-brand/20",
  blue: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  amber: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  emerald: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  rose: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
  purple: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  tone,
  onRemove,
}: BadgeProps) {
  const resolvedTone = useResolvedSurfaceTheme(tone);
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const palette =
    resolvedTone === "dark" ? darkVariantClasses : lightVariantClasses;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${palette[variant]}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 transition-colors hover:text-danger"
          aria-label="移除"
        >
          ×
        </button>
      )}
    </span>
  );
}
