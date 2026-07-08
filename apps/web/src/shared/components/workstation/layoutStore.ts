export type CutPanelLayout = {
  outlinerWidth: number;
  inspectorWidth: number;
  timelineHeight: number;
  outlinerCollapsed: boolean;
  inspectorCollapsed: boolean;
  timelineCollapsed: boolean;
  focusMode: boolean;
  sidebarRail: boolean;
};

export const CUT_LAYOUT_DEFAULTS: CutPanelLayout = {
  outlinerWidth: 240,
  inspectorWidth: 300,
  timelineHeight: 200,
  outlinerCollapsed: false,
  inspectorCollapsed: false,
  timelineCollapsed: false,
  focusMode: false,
  sidebarRail: false,
};

const STORAGE_KEY = "axiforge-cut-layout";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function loadCutLayout(): CutPanelLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...CUT_LAYOUT_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<CutPanelLayout>;
    return {
      ...CUT_LAYOUT_DEFAULTS,
      ...parsed,
      outlinerWidth: clamp(
        Number(parsed.outlinerWidth) || CUT_LAYOUT_DEFAULTS.outlinerWidth,
        160,
        420,
      ),
      inspectorWidth: clamp(
        Number(parsed.inspectorWidth) || CUT_LAYOUT_DEFAULTS.inspectorWidth,
        220,
        480,
      ),
      timelineHeight: clamp(
        Number(parsed.timelineHeight) || CUT_LAYOUT_DEFAULTS.timelineHeight,
        120,
        420,
      ),
    };
  } catch {
    return { ...CUT_LAYOUT_DEFAULTS };
  }
}

export function saveCutLayout(layout: CutPanelLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

export function resetCutLayout(): CutPanelLayout {
  const next = { ...CUT_LAYOUT_DEFAULTS };
  saveCutLayout(next);
  return next;
}
