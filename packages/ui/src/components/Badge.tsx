import type { ReactNode } from "react";

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
  onRemove?: () => void;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-ink-muted border border-gray-200",
  brand: "bg-brand-muted text-brand border border-brand/15",
  blue: "bg-blue-50 text-blue-700 border border-blue-100",
  amber: "bg-amber-50 text-amber-700 border border-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rose: "bg-rose-50 text-rose-700 border border-rose-100",
  purple: "bg-purple-50 text-purple-700 border border-purple-100",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  onRemove,
}: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${variantClasses[variant]}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 transition-colors hover:text-red-500"
          aria-label="移除"
        >
          ×
        </button>
      )}
    </span>
  );
}
