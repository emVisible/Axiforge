import { useCallback, useRef } from "react";
import { cn } from "@/shared/components/ui";

interface SplitHandleProps {
  axis: "x" | "y";
  onDrag: (delta: number) => void;
  onReset?: () => void;
  className?: string;
}

/** Thin drag rail between panels; double-click resets. */
export default function SplitHandle({
  axis,
  onDrag,
  onReset,
  className,
}: SplitHandleProps) {
  const last = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      last.current = axis === "x" ? e.clientX : e.clientY;

      const onMove = (ev: PointerEvent) => {
        const pos = axis === "x" ? ev.clientX : ev.clientY;
        const delta = pos - last.current;
        last.current = pos;
        if (delta !== 0) onDrag(delta);
      };
      const onUp = () => {
        target.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [axis, onDrag],
  );

  return (
    <div
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      onPointerDown={onPointerDown}
      onDoubleClick={() => onReset?.()}
      className={cn(
        "shrink-0 bg-border transition-colors hover:bg-accent-soft/50 active:bg-accent-soft",
        axis === "x"
          ? "w-1 cursor-col-resize self-stretch"
          : "h-1 w-full cursor-row-resize",
        className,
      )}
      title="拖动调整 · 双击复位"
    />
  );
}
