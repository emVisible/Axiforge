import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

import Button from "./Button";
import { Card } from "./Card";
import type { SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  action?: {
    label: string;
    to: string;
  };
  theme?: SurfaceTheme;
  framed?: boolean;
  children?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  theme = "light",
  framed = false,
  children,
}: EmptyStateProps) {
  const isDark = theme === "dark";

  const content = (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
          isDark ? "bg-white/10 text-white/60" : "bg-brand-muted text-brand",
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className={cn("text-base font-semibold", isDark ? "text-white/85" : "text-ink")}>
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-2 max-w-sm text-sm",
            isDark ? "text-white/40" : "text-ink-muted",
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          <Button as="link" to={action.to} size="sm" tone={theme}>
            {action.label}
          </Button>
        </div>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );

  if (framed) {
    return (
      <Card theme={theme} variant="muted" padding="none">
        {content}
      </Card>
    );
  }

  return content;
}
