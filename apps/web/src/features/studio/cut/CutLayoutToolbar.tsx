import { HelpCircle, Maximize2, PanelLeft, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui";
import type { CutLayoutApi } from "./CutStudioView";

interface CutLayoutToolbarProps {
  layoutApiRef: React.RefObject<CutLayoutApi | null>;
}

/** 剪辑台布局快捷操作 — 嵌入 WorkspaceToolbar 使用 */
export default function CutLayoutToolbar({ layoutApiRef }: CutLayoutToolbarProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="toolbar"
        title="切换 Outliner (\\)"
        onClick={() => layoutApiRef.current?.toggleOutliner()}
        icon={<PanelLeft className="h-3.5 w-3.5" />}
      >
        素材
      </Button>
      <Button
        variant="ghost"
        size="toolbar"
        title="专注模式 (F)"
        onClick={() => layoutApiRef.current?.toggleFocus()}
        icon={<Maximize2 className="h-3.5 w-3.5" />}
      >
        专注
      </Button>
      <Button
        variant="ghost"
        size="toolbar"
        title="快捷键 (?)"
        onClick={() => layoutApiRef.current?.toggleShortcuts()}
        icon={<HelpCircle className="h-3.5 w-3.5" />}
        aria-label="快捷键"
      >
        <span className="sr-only">快捷键</span>
      </Button>
      <Button
        variant="ghost"
        size="toolbar"
        title="复位布局"
        onClick={() => layoutApiRef.current?.reset()}
        icon={<RotateCcw className="h-3.5 w-3.5" />}
      >
        复位
      </Button>
    </>
  );
}
