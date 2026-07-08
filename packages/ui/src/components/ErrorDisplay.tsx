import Button from "./Button";
import { Card } from "./Card";
import { cn } from "./formStyles";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <Card
      padding="sm"
      className="border-danger/20 bg-danger/10"
    >
      <p className="text-danger">{message}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className={cn("mt-2 text-danger hover:text-danger")}
        >
          重试
        </Button>
      )}
    </Card>
  );
}
