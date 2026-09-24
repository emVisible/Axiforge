import { useCallback, useEffect, useRef, useState } from "react";

import type { CutLayoutApi } from "../cut/CutStudioView";

/** 画布有两种看法：全览所有舞台，或聚焦单个舞台。视图域拥有这个词表，故定义在此 */
export type CanvasViewMode = "full" | "stage";

interface CanvasViewInput {
  /** 从 URL 进入时的初始舞台：决定首屏是「单舞台」还是「全览」 */
  sceneId: string | null;
  /** 原实现以 `!project` 为守卫，此处逐字保留该条件，不改成等价的 scenes.length */
  hasProject: boolean;
  /** 切视图模式要顺带清画布选择——选择属于图域，故由宿主注入而非本 hook 持有 */
  clearSelection: () => void;
}

/**
 * 画布视图与舞台焦点域（useProjectEditor 拆分的第一块，宪章 Phase 7）。
 *
 * 边界依据：这一域只关心「用户在看哪个舞台、视口该看向哪里」，不读也不写叙事图内容。
 * 「按舞台整理布局」刻意**不在**这里——它提交的是 node.move 事务，属于图域；
 * 而且 rfNodes 投影本身要读 viewMode / filteredStageId，若把它放进来会形成
 * 「视图 hook 需要 rfNodes、rfNodes 又需要视图 hook」的环。
 */
export function useCanvasView({ sceneId, hasProject, clearSelection }: CanvasViewInput) {
  const [viewMode, setViewMode] = useState<CanvasViewMode>(
    sceneId ? "stage" : "full",
  );
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [filteredStageId, setFilteredStageId] = useState<string | null>(null);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [focusStageId, setFocusStageId] = useState<string | null>(null);
  const [stageFocusTrigger, setStageFocusTrigger] = useState(0);
  const cutLayoutApiRef = useRef<CutLayoutApi | null>(null);
  const [cutSceneFilter, setCutSceneFilter] = useState<string | null>(sceneId);

  useEffect(() => {
    if (sceneId) setCutSceneFilter(sceneId);
  }, [sceneId]);

  const switchViewMode = useCallback(
    (mode: CanvasViewMode) => {
      if (mode === viewMode || !hasProject) return;
      setViewMode(mode);
      clearSelection();
      setFilteredStageId(null);
      setFocusStageId(null);
    },
    [viewMode, hasProject, clearSelection],
  );

  const handleFocusStage = useCallback((stageId: string) => {
    setFocusStageId(stageId);
    setStageFocusTrigger((t) => t + 1);
    setFilteredStageId(stageId);
  }, []);

  const handleToggleStageFilter = useCallback((stageId: string) => {
    setFilteredStageId((prev) => (prev === stageId ? null : stageId));
    setFocusStageId(stageId);
  }, []);

  return {
    viewMode,
    activeStageId,
    setActiveStageId,
    filteredStageId,
    setFilteredStageId,
    fitViewTrigger,
    setFitViewTrigger,
    focusStageId,
    setFocusStageId,
    stageFocusTrigger,
    setStageFocusTrigger,
    cutLayoutApiRef,
    cutSceneFilter,
    setCutSceneFilter,
    switchViewMode,
    handleFocusStage,
    handleToggleStageFilter,
  };
}
