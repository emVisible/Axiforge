import { cn } from "./formStyles";

export interface WorkflowStep {
  title: string;
  description: string;
}

interface WorkflowGuideProps {
  steps: WorkflowStep[];
  compact?: boolean;
  className?: string;
}

export default function WorkflowGuide({
  steps,
  compact = false,
  className = "",
}: WorkflowGuideProps) {
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
          className="rounded-xl border border-border bg-canvas/60 p-4 text-left"
        >
          <p className="mb-2 font-mono text-3xs font-medium tracking-widest text-ink-muted">
            {String(index + 1).padStart(2, "0")}
          </p>
          <p className="text-sm font-medium text-ink">{step.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}
