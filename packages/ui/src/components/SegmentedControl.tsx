import { cn } from "./formStyles";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  size?: "sm" | "md";
  className?: string;
  /** @deprecated 主题由 `data-theme` + token 驱动，无需传 variant */
  variant?: "light" | "dark";
}

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  className = "",
}: SegmentedControlProps<T>) {
  const btnSize = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-xl bg-panel p-0.5",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex min-w-[3.25rem] shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors duration-200",
              btnSize,
              active
                ? "bg-panel-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
