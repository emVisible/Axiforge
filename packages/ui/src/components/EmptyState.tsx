import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

import Button from "./Button";
import { Card } from "./Card";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  action?: {
    label: string;
    to: string;
  };
  framed?: boolean;
  children?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  framed = false,
  children,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button as="link" to={action.to} size="sm">
            {action.label}
          </Button>
        </div>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );

  if (framed) {
    return (
      <Card variant="muted" padding="none">
        {content}
      </Card>
    );
  }

  return content;
}
