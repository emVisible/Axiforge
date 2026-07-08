import type { SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";

export interface WorkflowStep {
  title: string;
  description: string;
}

interface WorkflowGuideProps {
  steps: WorkflowStep[];
  theme?: SurfaceTheme;
  compact?: boolean;
  className?: string;
}

export default function WorkflowGuide({
  steps,
  theme = "light",
  compact = false,
  className = "",
}: WorkflowGuideProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3",
        className,
      )}
    >
      {steps.map((step, index) => (
        <div
          key={step.title}
          className={cn(
            "rounded-xl border p-4 text-left",
            isDark
              ? "border-white/10 bg-white/[0.03]"
              : "border-border bg-canvas/60",
          )}
        >
          <p
            className={cn(
              "mb-2 font-mono text-[10px] font-medium tracking-widest",
              isDark ? "text-white/30" : "text-ink-muted",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </p>
          <p
            className={cn(
              "text-sm font-medium",
              isDark ? "text-white/85" : "text-ink",
            )}
          >
            {step.title}
          </p>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              isDark ? "text-white/40" : "text-ink-muted",
            )}
          >
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}
