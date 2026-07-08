import Button from "./Button";
import { Card } from "./Card";
import type { SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  theme?: SurfaceTheme;
}

export default function ErrorDisplay({
  message,
  onRetry,
  theme = "light",
}: ErrorDisplayProps) {
  const isDark = theme === "dark";

  return (
    <Card
      theme={theme}
      padding="sm"
      className={cn(
        isDark
          ? "border-red-500/20 bg-red-500/10"
          : "border-red-200 bg-red-50",
      )}
    >
      <p className={isDark ? "text-red-300" : "text-red-800"}>{message}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          tone={theme}
          onClick={onRetry}
          className={cn("mt-2", isDark ? "text-red-300 hover:text-red-200" : "text-red-600")}
        >
          重试
        </Button>
      )}
    </Card>
  );
}
