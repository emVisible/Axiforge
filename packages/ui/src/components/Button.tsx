import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router";

import type { SurfaceTheme } from "./cardTheme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: SurfaceTheme;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { as?: "button" };
type ButtonAsLink = ButtonBaseProps & { as: "link"; to: string };
type ButtonProps = ButtonAsButton | ButtonAsLink;

const lightVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/20",
  secondary:
    "border border-border bg-surface text-ink hover:bg-canvas hover:border-ink-muted/30",
  ghost: "text-ink-muted hover:text-ink hover:bg-canvas",
  danger: "border border-red-200 bg-red-50/50 text-red-700 hover:bg-red-50",
};

const darkVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/30",
  secondary:
    "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
  ghost: "text-white/50 hover:text-white/80 hover:bg-white/5",
  danger:
    "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

function ButtonContent({
  loading,
  icon,
  children,
}: {
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <>
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        {children}
      </>
    );
  }
  return (
    <>
      {icon}
      {children}
    </>
  );
}

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    tone = "light",
    loading,
    icon,
    className = "",
    children,
    ...rest
  } = props;
  const palette = tone === "dark" ? darkVariantClasses : lightVariantClasses;
  const classes = `inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${palette[variant]} ${sizeClasses[size]} ${className}`;

  if (props.as === "link") {
    return (
      <Link to={props.to} className={classes}>
        <ButtonContent icon={icon}>{children}</ButtonContent>
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={loading}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <ButtonContent loading={loading} icon={icon}>
        {children}
      </ButtonContent>
    </button>
  );
}
