import { type ReactNode } from "react";

import { cn } from "./formStyles";

interface WorkspaceToolbarProps {
  children: ReactNode;
  className?: string;
}

/** 工作站顶栏工具组 — 与 WorkspaceHeader actions 槽配合，统一间距与换行 */
export default function WorkspaceToolbar({
  children,
  className = "",
}: WorkspaceToolbarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1", className)}
      role="toolbar"
    >
      {children}
    </div>
  );
}
