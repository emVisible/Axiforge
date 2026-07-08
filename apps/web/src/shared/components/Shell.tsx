import { type ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
  className?: string;
  /** @deprecated 使用 variant="focus" */
  narrow?: boolean;
  variant?: "list" | "focus" | "full";
}

const variantClasses = {
  list: "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
  focus: "mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8",
  full: "min-h-0 w-full",
};

export default function Shell({
  children,
  className = "",
  narrow = false,
  variant,
}: ShellProps) {
  const resolved = variant ?? (narrow ? "focus" : "list");

  return <div className={`${variantClasses[resolved]} ${className}`}>{children}</div>;
}

/** 画布/全宽工作区：无 max-width 限制 */
export function CanvasWorkspace({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-h-[calc(100vh-3.5rem)] flex-col ${className}`}>
      {children}
    </div>
  );
}
