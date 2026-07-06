import { type HTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "./formStyles";

type CardVariant = "default" | "interactive" | "muted";

interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: "border-border bg-surface shadow-sm",
  interactive:
    "border-border bg-surface shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200",
  muted: "border-border/80 bg-canvas",
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardBaseProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
}

export function CardLink({ to, className = "", children }: CardLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group block rounded-2xl border border-border bg-surface p-5 shadow-sm",
        "transition-all duration-200 hover:border-gray-300 hover:shadow-md",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function CardGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
