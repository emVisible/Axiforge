import type { ReactNode } from "react";
import { Clapperboard, PanelsTopLeft, Rows3 } from "lucide-react";
import SplitHandle from "@/shared/components/workstation/SplitHandle";
import PanelRail from "@/shared/components/workstation/PanelRail";
import type { CutPanelLayout } from "@/shared/components/workstation/layoutStore";
import { CUT_LAYOUT_DEFAULTS } from "@/shared/components/workstation/layoutStore";

interface CutStudioLayoutProps {
  assetBin: ReactNode;
  monitor: ReactNode;
  transport: ReactNode;
  timeline: ReactNode;
  inspector: ReactNode;
  layout: CutPanelLayout;
  onLayoutPatch: (partial: Partial<CutPanelLayout>) => void;
}

/** 可调四区：左 Outliner · 中预览 · 右检查器 · 底指令轨 */
export default function CutStudioLayout({
  assetBin,
  monitor,
  transport,
  timeline,
  inspector,
  layout,
  onLayoutPatch,
}: CutStudioLayoutProps) {
  const {
    outlinerWidth,
    inspectorWidth,
    timelineHeight,
    outlinerCollapsed,
    inspectorCollapsed,
    timelineCollapsed,
  } = layout;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {outlinerCollapsed ? (
          <PanelRail
            label="Outliner"
            side="left"
            shortcut="\\"
            icon={<PanelsTopLeft className="mb-1 h-3.5 w-3.5" />}
            onExpand={() => onLayoutPatch({ outlinerCollapsed: false })}
          />
        ) : (
          <>
            <div
              className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-panel"
              style={{ width: outlinerWidth }}
            >
              {assetBin}
            </div>
            <SplitHandle
              axis="x"
              onDrag={(delta) =>
                onLayoutPatch({
                  outlinerWidth: Math.min(
                    420,
                    Math.max(160, outlinerWidth + delta),
                  ),
                })
              }
              onReset={() =>
                onLayoutPatch({
                  outlinerWidth: CUT_LAYOUT_DEFAULTS.outlinerWidth,
                })
              }
            />
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-border bg-canvas">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 pb-0">
            {monitor}
          </div>
          {transport}
        </div>

        {inspectorCollapsed ? (
          <PanelRail
            label="Inspector"
            side="right"
            shortcut="]"
            icon={<Clapperboard className="mb-1 h-3.5 w-3.5" />}
            onExpand={() => onLayoutPatch({ inspectorCollapsed: false })}
          />
        ) : (
          <>
            <SplitHandle
              axis="x"
              onDrag={(delta) =>
                onLayoutPatch({
                  inspectorWidth: Math.min(
                    480,
                    Math.max(220, inspectorWidth - delta),
                  ),
                })
              }
              onReset={() =>
                onLayoutPatch({
                  inspectorWidth: CUT_LAYOUT_DEFAULTS.inspectorWidth,
                })
              }
            />
            <div
              className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-surface"
              style={{ width: inspectorWidth }}
            >
              {inspector}
            </div>
          </>
        )}
      </div>

      {timelineCollapsed ? (
        <PanelRail
          label="指令轨"
          side="bottom"
          shortcut="Shift+\\"
          icon={<Rows3 className="mr-1 h-3 w-3" />}
          onExpand={() => onLayoutPatch({ timelineCollapsed: false })}
        />
      ) : (
        <>
          <SplitHandle
            axis="y"
            onDrag={(delta) =>
              onLayoutPatch({
                timelineHeight: Math.min(
                  420,
                  Math.max(120, timelineHeight - delta),
                ),
              })
            }
            onReset={() =>
              onLayoutPatch({
                timelineHeight: CUT_LAYOUT_DEFAULTS.timelineHeight,
              })
            }
          />
          <div
            className="flex shrink-0 flex-col overflow-hidden border-t border-border bg-panel"
            style={{ height: timelineHeight }}
          >
            {timeline}
          </div>
        </>
      )}
    </div>
  );
}
