import { useEffect, useRef, useState, type MouseEvent } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "./formStyles";
import type { SurfaceTheme } from "./cardTheme";

export interface CardMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface CardOverflowMenuProps {
  items: CardMenuItem[];
  theme?: SurfaceTheme;
  className?: string;
}

export default function CardOverflowMenu({
  items,
  theme = "light",
  className = "",
}: CardOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const close = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div ref={ref} className={cn("relative", className)} onClick={stop}>
      <button
        type="button"
        aria-label="更多操作"
        aria-expanded={open}
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100",
          open && "opacity-100",
          isDark
            ? "bg-black/40 text-white/70 hover:bg-black/55 hover:text-white"
            : "bg-black/30 text-white/90 hover:bg-black/45",
        )}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-30 mt-1 min-w-[7.5rem] overflow-hidden rounded-lg border py-1 shadow-lg",
            isDark
              ? "border-white/10 bg-[#1a1a28]"
              : "border-border bg-surface",
          )}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={(e) => {
                stop(e);
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                item.destructive
                  ? isDark
                    ? "text-red-400 hover:bg-white/5"
                    : "text-red-600 hover:bg-canvas"
                  : isDark
                    ? "text-white/75 hover:bg-white/5 hover:text-white"
                    : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
