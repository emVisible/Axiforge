import { type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router";

import { cardTheme, type SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";
import { useResolvedSurfaceTheme } from "../hooks/useSurfaceTheme";

interface CoverCardBaseProps {
  theme?: SurfaceTheme;
  density?: "default" | "compact";
  title: string;
  description?: string;
  cover?: ReactNode;
  /** @deprecated 使用默认 hover 效果，无需文字遮罩 */
  coverOverlay?: ReactNode;
  menu?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

interface CoverCardLinkProps extends CoverCardBaseProps {
  to: string;
  onClick?: never;
}

interface CoverCardButtonProps extends CoverCardBaseProps {
  to?: never;
  onClick: () => void;
}

type CoverCardProps = CoverCardLinkProps | CoverCardButtonProps;

export default function CoverCard({
  theme,
  density = "default",
  title,
  description,
  cover,
  coverOverlay,
  menu,
  footer,
  className = "",
  ...action
}: CoverCardProps) {
  const resolvedTheme = useResolvedSurfaceTheme(theme);
  const t = cardTheme[resolvedTheme];
  const compact = density === "compact";

  const body = (
    <>
      <div
        className={cn(
          "relative overflow-hidden",
          compact ? "h-32" : "h-36",
          t.cover,
        )}
      >
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
          {cover}
        </div>
        {coverOverlay ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {coverOverlay}
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
        )}
        {menu && (
          <div className="absolute right-2 top-2 z-10">{menu}</div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-4")}>
        <h3 className={cn("mb-1 text-sm font-semibold", t.title)}>{title}</h3>
        {description && (
          <p
            className={cn(
              "line-clamp-2 flex-1 text-xs leading-relaxed",
              compact ? "mb-2" : "mb-3",
              t.description,
            )}
          >
            {description}
          </p>
        )}
        {footer}
      </div>
    </>
  );

  const shellClass = cn(
    "group flex cursor-pointer flex-col overflow-hidden border text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg",
    compact ? "rounded-xl" : "rounded-2xl",
    t.surface,
    className,
  );

  if ("to" in action && action.to) {
    return (
      <Link to={action.to} className={shellClass}>
        {body}
      </Link>
    );
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action.onClick?.();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={action.onClick}
      onKeyDown={handleKeyDown}
      className={shellClass}
    >
      {body}
    </article>
  );
}
