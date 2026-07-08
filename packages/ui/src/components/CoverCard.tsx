import { type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router";

import { cardTheme, type SurfaceTheme } from "./cardTheme";
import { cn } from "./formStyles";

interface CoverCardBaseProps {
  theme?: SurfaceTheme;
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
  theme = "light",
  title,
  description,
  cover,
  coverOverlay,
  menu,
  footer,
  className = "",
  ...action
}: CoverCardProps) {
  const t = cardTheme[theme];

  const body = (
    <>
      <div className={cn("relative h-36 overflow-hidden", t.cover)}>
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
      <div className="flex flex-1 flex-col p-4">
        <h3 className={cn("mb-1 text-sm font-semibold", t.title)}>{title}</h3>
        {description && (
          <p
            className={cn(
              "mb-3 line-clamp-2 flex-1 text-xs leading-relaxed",
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
    "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
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
