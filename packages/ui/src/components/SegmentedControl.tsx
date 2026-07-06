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
        "inline-flex items-center rounded-xl bg-gray-100/80 p-0.5",
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
              "rounded-lg font-medium transition-all duration-200",
              btnSize,
              active
                ? "bg-surface text-ink shadow-sm"
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
