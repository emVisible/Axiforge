interface LoadingSpinnerProps {
  variant?: "light" | "dark";
}

export default function LoadingSpinner({ variant = "light" }: LoadingSpinnerProps) {
  const isDark = variant === "dark";
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`h-7 w-7 animate-spin rounded-full border-2 ${
          isDark
            ? "border-white/20 border-t-white/60"
            : "border-border border-t-brand"
        }`}
      />
    </div>
  );
}
