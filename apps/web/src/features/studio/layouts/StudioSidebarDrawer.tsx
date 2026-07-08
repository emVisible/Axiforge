import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { X } from "lucide-react";

import StudioNavContent from "@/features/studio/layouts/StudioNavContent";

interface StudioSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function StudioSidebarDrawer({
  open,
  onClose,
}: StudioSidebarDrawerProps) {
  const location = useLocation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    onCloseRef.current();
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭导航菜单"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-ink">创作导航</p>
          <button
            type="button"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <StudioNavContent />
        </div>
      </aside>
    </div>
  );
}
