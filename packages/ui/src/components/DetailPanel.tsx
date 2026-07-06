import { type ReactNode } from "react";

import Button from "./Button";
import { Card } from "./Card";

interface DetailPanelProps {
  title: string;
  description?: string;
  onEdit?: () => void;
  editLabel?: string;
  children: ReactNode;
}

export function DetailPanel({
  title,
  description,
  onEdit,
  editLabel = "编辑",
  children,
}: DetailPanelProps) {
  return (
    <Card padding="lg">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {editLabel}
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

export function DetailEditPanel({ children }: { children: ReactNode }) {
  return (
    <Card padding="lg" className="space-y-4">
      {children}
    </Card>
  );
}
