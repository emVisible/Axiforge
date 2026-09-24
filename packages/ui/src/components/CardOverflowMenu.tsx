import { useEffect, useRef, useState, type MouseEvent } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "./formStyles";

export interface CardMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface CardOverflowMenuProps {
  items: CardMenuItem[];
  className?: string;
}

export default function CardOverflowMenu({
  items,
  className = "",
}: CardOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          "flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-ink-on-scrim/70 opacity-0 transition-[opacity,background-color,color] hover:bg-black/55 hover:text-ink-on-scrim group-hover:opacity-100",
          open && "opacity-100",
        )}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-1 min-w-[7.5rem] overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-lg"
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
                  ? "text-danger hover:bg-panel"
                  : "text-ink-muted hover:bg-panel hover:text-ink",
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
