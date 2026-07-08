import { cn } from "./formStyles";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  color?: string;
  className?: string;
  variant?: "light" | "dark";
}

export default function FilterChip({
  label,
  active = false,
  onClick,
  count,
  color,
  className = "",
  variant = "light",
}: FilterChipProps) {
  const isDark = variant === "dark";

  if (color) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
          active ? "shadow-sm" : "opacity-75 hover:opacity-100",
          className,
        )}
        style={{
          color: active ? "#fff" : color,
          borderColor: color + "40",
          backgroundColor: active ? color : color + "12",
        }}
      >
        {label}
        {count !== undefined && count > 0 && (
          <span className="ml-1 opacity-60">{count}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200",
        isDark
          ? active
            ? "border-white/30 bg-white/15 text-white shadow-sm"
            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/75"
          : active
            ? "border-brand bg-brand text-white shadow-sm shadow-brand/20"
            : "border-border bg-surface text-ink-muted hover:border-gray-300 hover:text-ink",
        className,
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn("ml-1", active ? "opacity-80" : "opacity-50")}>
          {count}
        </span>
      )}
    </button>
  );
}
