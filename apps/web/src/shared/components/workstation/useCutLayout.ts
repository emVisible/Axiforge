import { useCallback, useEffect, useState } from "react";
import {
  CUT_LAYOUT_DEFAULTS,
  loadCutLayout,
  resetCutLayout,
  saveCutLayout,
  type CutPanelLayout,
} from "./layoutStore";

export function useCutLayout() {
  const [layout, setLayout] = useState<CutPanelLayout>(() => loadCutLayout());

  useEffect(() => {
    saveCutLayout(layout);
  }, [layout]);

  const patch = useCallback((partial: Partial<CutPanelLayout>) => {
    setLayout((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setLayout(resetCutLayout());
  }, []);

  const toggleOutliner = useCallback(() => {
    setLayout((p) => ({ ...p, outlinerCollapsed: !p.outlinerCollapsed }));
  }, []);

  const toggleInspector = useCallback(() => {
    setLayout((p) => ({ ...p, inspectorCollapsed: !p.inspectorCollapsed }));
  }, []);

  const toggleTimeline = useCallback(() => {
    setLayout((p) => ({ ...p, timelineCollapsed: !p.timelineCollapsed }));
  }, []);

  const toggleFocus = useCallback(() => {
    setLayout((p) => {
      const next = !p.focusMode;
      if (next) {
        return {
          ...p,
          focusMode: true,
          sidebarRail: true,
          outlinerCollapsed: false,
          inspectorCollapsed: false,
          timelineCollapsed: false,
        };
      }
      return {
        ...p,
        focusMode: false,
        sidebarRail: false,
      };
    });
  }, []);

  return {
    layout,
    patch,
    reset,
    toggleOutliner,
    toggleInspector,
    toggleTimeline,
    toggleFocus,
    defaults: CUT_LAYOUT_DEFAULTS,
  };
}
