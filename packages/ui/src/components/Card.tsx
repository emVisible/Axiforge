import { Children, isValidElement, type HTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router";

import { cardTheme, type SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";
import { useResolvedSurfaceTheme } from "../hooks/useSurfaceTheme";

type CardVariant = "default" | "interactive" | "muted";

interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  theme?: SurfaceTheme;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

function cardVariantClasses(
  variant: CardVariant,
  theme: SurfaceTheme,
): string {
  const t = cardTheme[theme];
  if (variant === "muted") return t.muted;
  if (variant === "interactive") return cn("transition-[border-color,box-shadow,background-color,transform] duration-200", t.surface);
  return t.surfaceStatic;
}

export function Card({
  variant = "default",
  theme,
  padding = "md",
  className = "",
  children,
  ...props
}: CardBaseProps) {
  const resolvedTheme = useResolvedSurfaceTheme(theme);

  return (
    <div
      className={cn(
        "rounded-2xl border",
        cardVariantClasses(variant, resolvedTheme),
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
  theme?: SurfaceTheme;
  className?: string;
  children: ReactNode;
}

export function CardLink({
  to,
  theme,
  className = "",
  children,
}: CardLinkProps) {
  const resolvedTheme = useResolvedSurfaceTheme(theme);
  const t = cardTheme[resolvedTheme];
  return (
    <Link
      to={to}
      className={cn(
        "group block rounded-2xl border p-5 transition-[border-color,box-shadow,background-color,transform] duration-200",
        t.surface,
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
  stagger = false,
  density = "default",
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  density?: "default" | "compact";
}) {
  return (
    <div
      className={cn(
        density === "compact"
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {stagger
        ? Children.map(children, (child, index) => {
            if (!isValidElement(child)) return child;
            if (index >= 6) return child;
            return (
              <div
                key={child.key ?? index}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {child}
              </div>
            );
          })
        : children}
    </div>
  );
}
