import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Node } from "reactflow";
import type { Instruction } from "@axiforge/core";
import type { ProjectResponse, ProjectUpdate } from "@/shared/types/project";
import { Copy, Trash2 } from "lucide-react";
import PreviewMonitor from "../components/PreviewMonitor";
import NodeInspectorPanel, { type PanelTab } from "../flow/NodeInspectorPanel";
import type {
  ConditionItem,
  EffectItem,
  NodeFormState,
  ProjectRoleOption,
} from "../flow/types";
import type { ProjectSceneResponse, ProjectRoleResponse } from "@/shared/types/project";
import type { SimTarget } from "../components/ConditionSimulator";
import CutStudioLayout from "./CutStudioLayout";
import TimelineShell, { type TimelineShellHandle } from "./TimelineShell";
import MasterTimelineBar from "./MasterTimelineBar";
import TransportBar from "./TransportBar";
import OutlinerPanel from "./outliner/OutlinerPanel";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import MiniAxsEditor from "./MiniAxsEditor";
import { clipLabel, patchClipDuration, reorderScriptByIndices, totalDurationMs, indicesOnTrack, characterTrackGroups, insertShowInstruction, type CutTrackId } from "./timelineUtils";
import {
  buildMasterTimeline,
  locateMasterPosition,
  masterGlobalMs,
  nextBeatId,
} from "./masterTimelineUtils";
import { useCutPlayback } from "./useCutPlayback";
import { useCutLayout } from "@/shared/components/workstation/useCutLayout";
import { useStudioChrome } from "../layouts/StudioChromeContext";
import type { CutPanelLayout } from "@/shared/components/workstation/layoutStore";

export interface CutStudioViewProps {
  project: ProjectResponse;
  nodes: Node[];
  selectedNode: Node | null;
  onSelectBeat: (node: Node) => void;
  sceneFilterId: string | null;
  onSceneFilterChange: (sceneId: string | null) => void;
  script: Instruction[];
  projectRoles: ProjectRoleOption[];
  projectRolesRaw: ProjectRoleResponse[];
  itemRefs: { id: string; asset_id: string; name: string }[];
  activePanel: PanelTab;
  onActivePanelChange: (tab: PanelTab) => void;
  nodeForm: NodeFormState;
  onNodeFormChange: (data: Partial<NodeFormState>) => void;
  conditions: ConditionItem[];
  onConditionsChange: (c: ConditionItem[]) => void;
  effects: EffectItem[];
  onEffectsChange: (e: EffectItem[]) => void;
  nodeProps: string[];
  onPropsChange: (ids: string[]) => void;
  itemOptions: { id: string; name: string }[];
  onScriptChange: (s: Instruction[]) => void;
  scenes: ProjectSceneResponse[];
  onStageChange: (stageId: string) => void;
  allNodes: Node[];
  simTargets: SimTarget[];
  onPreviewScript: () => void;
  onDeleteNode: () => void;
  onAddScene: (title: string) => void | Promise<void>;
  onImportScene: (assetId: string) => void | Promise<void>;
  onDeleteScene: (sceneId: string) => void | Promise<void>;
  onAddRole: (characterId: string, name: string) => void | Promise<void>;
  onRemoveRole: (roleId: string) => void | Promise<void>;
  onAddItem: (itemId: string) => void | Promise<void>;
  onRemoveItemRef: (refId: string) => void | Promise<void>;
  onOpenFlow: () => void;
  onOpenWriter: () => void;
  onExportMarkdown?: () => void;
  onDeleteProject?: () => void;
  onBeatRename?: (nodeId: string, title: string) => void;
  onProjectPatch?: (patch: Pick<ProjectUpdate, "title" | "description" | "world_setting" | "rules">) => void | Promise<void>;
  selectedEdge: null;
  onEdgeLabelChange: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  layoutApiRef?: React.MutableRefObject<CutLayoutApi | null>;
}

export type CutLayoutApi = {
  layout: CutPanelLayout;
  patch: (partial: Partial<CutPanelLayout>) => void;
  reset: () => void;
  toggleOutliner: () => void;
  toggleInspector: () => void;
  toggleTimeline: () => void;
  toggleFocus: () => void;
  toggleShortcuts: () => void;
};

export default function CutStudioView({
  project,
  nodes,
  selectedNode,
  onSelectBeat,
  sceneFilterId,
  onSceneFilterChange,
  script,
  projectRoles,
  projectRolesRaw,
  itemRefs,
  activePanel,
  onActivePanelChange,
  nodeForm,
  onNodeFormChange,
  conditions,
  onConditionsChange,
  effects,
  onEffectsChange,
  nodeProps,
  onPropsChange,
  itemOptions,
  onScriptChange,
  scenes,
  onStageChange,
  allNodes,
  simTargets,
  onPreviewScript,
  onDeleteNode,
  onAddScene,
  onImportScene,
  onDeleteScene,
  onAddRole,
  onRemoveRole,
  onAddItem,
  onRemoveItemRef,
  onOpenFlow,
  onOpenWriter,
  onExportMarkdown,
  onDeleteProject,
  onBeatRename,
  onProjectPatch,
  onEdgeLabelChange,
  onDeleteEdge,
  layoutApiRef,
}: CutStudioViewProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const toggleShortcuts = useCallback(
    () => setShortcutsOpen((open) => !open),
    [],
  );

  const master = useMemo(() => buildMasterTimeline(nodes), [nodes]);
  const showMasterRail = master.beats.length > 1;

  const resumePlayRef = useRef(false);
  const pendingClipRef = useRef<number | null>(null);
  const skipBeatResetRef = useRef(false);

  const handleBeatEnd = useCallback(() => {
    if (!showMasterRail) return false;
    const nextId = nextBeatId(master, selectedNode?.id);
    if (!nextId) return false;
    const node = nodes.find((n) => n.id === nextId);
    if (!node) return false;
    resumePlayRef.current = true;
    skipBeatResetRef.current = true;
    onSelectBeat(node);
    return true;
  }, [showMasterRail, master, selectedNode?.id, nodes, onSelectBeat]);

  const {
    selectedIndex,
    cursorIndex,
    isPlaying,
    zoom,
    setZoom,
    currentTimeMs,
    selectClip,
    scrubTo,
    setCursorIndex,
    stepPrev,
    stepNext,
    goToStart,
    goToEnd,
    togglePlay,
    seekIndex,
  } = useCutPlayback(script, { onBeatEnd: handleBeatEnd });

  const timelineRef = useRef<TimelineShellHandle>(null);
  const beatIdRef = useRef<string | null>(null);

  const handleReorderTrack = useCallback(
    (trackKey: string, fromLocal: number, toLocal: number) => {
      // 轨道键：char:<characterId> 角色轨（F2）| 其余为固定轨
      const indices = trackKey.startsWith("char:")
        ? (characterTrackGroups(script).find(
            (g) => `char:${g.characterId}` === trackKey,
          )?.indices ?? [])
        : indicesOnTrack(script, trackKey.slice(4) as CutTrackId);
      const next = reorderScriptByIndices(script, indices, fromLocal, toLocal);
      onScriptChange(next);
      const nextIndices = trackKey.startsWith("char:")
        ? (characterTrackGroups(next).find(
            (g) => `char:${g.characterId}` === trackKey,
          )?.indices ?? [])
        : indicesOnTrack(next, trackKey.slice(4) as CutTrackId);
      selectClip(nextIndices[toLocal] ?? 0);
    },
    [script, onScriptChange, selectClip],
  );

  const handleSpriteDrop = useCallback(
    (characterId: string, expression: string, insertIndex: number) => {
      const next = insertShowInstruction(script, insertIndex, characterId, expression);
      onScriptChange(next);
      selectClip(Math.min(insertIndex, next.length - 1));
    },
    [script, onScriptChange, selectClip],
  );

  const handleDurationChange = useCallback(
    (index: number, ms: number) => {
      const inst = script[index];
      if (!inst) return;
      const next = script.map((s, i) =>
        i === index ? patchClipDuration(s, ms) : s,
      );
      onScriptChange(next);
    },
    [script, onScriptChange],
  );

  const duplicateClip = useCallback(() => {
    const inst = script[selectedIndex];
    if (!inst) return;
    const copy = JSON.parse(JSON.stringify(inst)) as Instruction;
    const next = [...script];
    next.splice(selectedIndex + 1, 0, copy);
    onScriptChange(next);
    selectClip(selectedIndex + 1);
  }, [script, selectedIndex, onScriptChange, selectClip]);

  const deleteClipAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= script.length) return;
      const inst = script[index];
      if (!inst) return;
      const name = clipLabel(inst);
      if (
        !confirm(
          `删除片段「${name}」？\n仅移除此条演出指令，不会删除整个 Beat。`,
        )
      ) {
        return;
      }
      const next = script.filter((_, i) => i !== index);
      onScriptChange(next);
      if (next.length === 0) {
        selectClip(0);
        return;
      }
      selectClip(Math.min(index, next.length - 1));
    },
    [script, onScriptChange, selectClip],
  );

  const deleteClip = useCallback(() => {
    deleteClipAt(selectedIndex);
  }, [deleteClipAt, selectedIndex]);

  useEffect(() => {
    const beatId = selectedNode?.id ?? null;
    if (beatIdRef.current === beatId) return;
    beatIdRef.current = beatId;
    if (!beatId) return;

    if (skipBeatResetRef.current) {
      skipBeatResetRef.current = false;
      goToStart(resumePlayRef.current);
      resumePlayRef.current = false;
    } else {
      goToStart();
    }
    requestAnimationFrame(() => timelineRef.current?.scrollToClip(0));
  }, [selectedNode?.id, goToStart]);

  useEffect(() => {
    if (pendingClipRef.current == null || !selectedNode) return;
    const idx = pendingClipRef.current;
    pendingClipRef.current = null;
    selectClip(idx);
  }, [selectedNode?.id, script, selectClip]);

  const globalMs = masterGlobalMs(
    master,
    selectedNode?.id,
    Math.min(cursorIndex, Math.max(0, script.length - 1)),
  );

  const scrubMaster = useCallback(
    (ms: number) => {
      const { beatId, localClipIndex } = locateMasterPosition(master, ms);
      if (!beatId) return;
      if (beatId !== selectedNode?.id) {
        pendingClipRef.current = localClipIndex;
        const node = nodes.find((n) => n.id === beatId);
        if (node) onSelectBeat(node);
        return;
      }
      scrubTo(localClipIndex);
      selectClip(localClipIndex);
    },
    [master, selectedNode?.id, nodes, onSelectBeat, scrubTo, selectClip],
  );

  const selectMasterBeat = useCallback(
    (beatId: string) => {
      if (beatId === selectedNode?.id) return;
      const node = nodes.find((n) => n.id === beatId);
      if (node) onSelectBeat(node);
    },
    [selectedNode?.id, nodes, onSelectBeat],
  );

  const {
    layout,
    patch,
    reset,
    toggleOutliner,
    toggleInspector,
    toggleTimeline,
    toggleFocus,
  } = useCutLayout();

  const { setSidebarRail } = useStudioChrome();

  useEffect(() => {
    setSidebarRail(layout.sidebarRail || layout.focusMode);
  }, [layout.sidebarRail, layout.focusMode, setSidebarRail]);

  useEffect(() => {
    if (layoutApiRef) {
      layoutApiRef.current = {
        layout,
        patch,
        reset,
        toggleOutliner,
        toggleInspector,
        toggleTimeline,
        toggleFocus,
        toggleShortcuts,
      };
    }
  }, [
    layoutApiRef,
    layout,
    patch,
    reset,
    toggleOutliner,
    toggleInspector,
    toggleTimeline,
    toggleFocus,
    toggleShortcuts,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        toggleShortcuts();
        return;
      }
      if (shortcutsOpen) return;
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        script.length > 0
      ) {
        e.preventDefault();
        deleteClipAt(selectedIndex);
        return;
      }
      // ArrowLeft/Right: 逐 clip 导航
      if (e.key === "ArrowLeft" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        stepPrev();
        return;
      }
      if (e.key === "ArrowRight" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        stepNext();
        return;
      }
      // Alt+ArrowUp/Down: 在脚本内重排选中 clip（上移/下移一位）
      if (e.key === "ArrowUp" && e.altKey && script.length > 1) {
        e.preventDefault();
        if (selectedIndex > 0) {
          const next = [...script];
          [next[selectedIndex - 1], next[selectedIndex]] = [next[selectedIndex], next[selectedIndex - 1]];
          onScriptChange(next);
          selectClip(selectedIndex - 1);
        }
        return;
      }
      if (e.key === "ArrowDown" && e.altKey && script.length > 1) {
        e.preventDefault();
        if (selectedIndex < script.length - 1) {
          const next = [...script];
          [next[selectedIndex], next[selectedIndex + 1]] = [next[selectedIndex + 1], next[selectedIndex]];
          onScriptChange(next);
          selectClip(selectedIndex + 1);
        }
        return;
      }
      // Cmd/Ctrl+D: 复制选中 clip
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        duplicateClip();
        return;
      }
      if (e.key === "\\" && !e.shiftKey) {
        e.preventDefault();
        toggleOutliner();
      } else if (e.key === "|" || (e.key === "\\" && e.shiftKey)) {
        e.preventDefault();
        toggleTimeline();
      } else if (e.key === "]") {
        e.preventDefault();
        toggleInspector();
      } else if (e.key === "f" || e.key === "F" || (e.key === "." && (e.metaKey || e.ctrlKey))) {
        if (e.key === "." || e.key === "f" || e.key === "F") {
          e.preventDefault();
          toggleFocus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    toggleOutliner,
    toggleInspector,
    toggleTimeline,
    toggleFocus,
    toggleShortcuts,
    shortcutsOpen,
    script.length,
    selectedIndex,
    deleteClipAt,
    stepPrev,
    stepNext,
    duplicateClip,
    onScriptChange,
  ]);

  useEffect(() => {
    if (selectedNode && activePanel !== "script" && script.length > 0) {
      onActivePanelChange("script");
    }
  }, [selectedNode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const beatTitle = selectedNode
    ? (selectedNode.data.title as string) || "未命名"
    : undefined;

  const selectedClip = script[selectedIndex];

  const miniRoles = useMemo(
    () => Object.fromEntries(projectRoles.map((r) => [r.name, r.characterRefId])),
    [projectRoles],
  );
  const miniRoleNames = useMemo(() => projectRoles.map((r) => r.name), [projectRoles]);

  return (
    <>
    <CutStudioLayout
      layout={layout}
      onLayoutPatch={patch}
      assetBin={
        <OutlinerPanel
          project={project}
          beats={nodes}
          selectedBeatId={selectedNode?.id ?? null}
          onSelectBeat={(id) => {
            const node = nodes.find((n) => n.id === id);
            if (node) onSelectBeat(node);
          }}
          sceneFilterId={sceneFilterId}
          onSceneFilterChange={onSceneFilterChange}
          roles={projectRoles}
          projectRoles={projectRolesRaw}
          itemRefs={itemRefs}
          onAddScene={onAddScene}
          onImportScene={onImportScene}
          onDeleteScene={onDeleteScene}
          onAddRole={onAddRole}
          onRemoveRole={onRemoveRole}
          onAddItem={onAddItem}
          onRemoveItemRef={onRemoveItemRef}
          onOpenFlow={onOpenFlow}
          onOpenWriter={onOpenWriter}
          onExportMarkdown={onExportMarkdown}
          onDeleteProject={onDeleteProject}
          onBeatRename={onBeatRename}
          onProjectPatch={onProjectPatch}
        />
      }
      monitor={
        <PreviewMonitor
          script={script}
          roles={projectRoles}
          seekIndex={seekIndex}
          embedded
          showFooter={false}
          monitorLabel="演出预览"
          className="h-full min-h-0"
          onCursorChange={setCursorIndex}
        />
      }
      transport={
        <TransportBar
          isPlaying={isPlaying}
          currentTimeMs={showMasterRail ? globalMs : currentTimeMs}
          totalTimeMs={showMasterRail ? master.totalMs : totalDurationMs(script)}
          clipIndex={cursorIndex}
          clipCount={script.length}
          onTogglePlay={togglePlay}
          onStepPrev={stepPrev}
          onStepNext={stepNext}
          onGoToStart={goToStart}
          onGoToEnd={goToEnd}
          beatTitle={beatTitle}
          masterBeatCount={showMasterRail ? master.beats.length : undefined}
        />
      }
      timeline={
        <div className="flex h-full min-h-0 flex-col">
          {showMasterRail && (
            <MasterTimelineBar
              master={master}
              activeBeatId={selectedNode?.id ?? null}
              globalMs={globalMs}
              onSelectBeat={selectMasterBeat}
              onScrubGlobal={scrubMaster}
            />
          )}
          <div className="min-h-0 flex-1">
            <TimelineShell
          ref={timelineRef}
          script={script}
          selectedIndex={selectedIndex}
          cursorIndex={cursorIndex}
          zoom={zoom}
          onZoomChange={setZoom}
          onSelectClip={(index) => {
            selectClip(index);
            onActivePanelChange("script");
          }}
          onScrub={(index) => {
            scrubTo(index);
          }}
          characterLabels={Object.fromEntries(
            projectRoles.map((r) => [r.characterRefId, r.name]),
          )}
          onReorderTrack={handleReorderTrack}
          onSpriteDrop={handleSpriteDrop}
          effects={effects as never[]}
          onDeleteClip={(index) => {
            selectClip(index);
            deleteClipAt(index);
          }}
          onDurationChange={handleDurationChange}
            />
          </div>
        </div>
      }
      inspector={
        <div className="flex h-full min-h-0 flex-col">
          {selectedClip && (
            <div className="shrink-0 border-b border-border bg-surface-raised px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-ink-faint">
                    当前片段
                  </p>
                  <p className="truncate text-2xs text-ink">
                    #{selectedIndex + 1} · {selectedClip.op} · {clipLabel(selectedClip)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={duplicateClip}
                    className="flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-panel hover:text-ink"
                    title="复制片段"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={deleteClip}
                    className="flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-danger/10 hover:text-danger"
                    title="删除片段"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {activePanel === "script" && selectedNode && (
            <MiniAxsEditor
              script={script}
              selectedIndex={selectedIndex}
              beatTitle={beatTitle ?? "未命名"}
              roles={miniRoles}
              roleNames={miniRoleNames}
              onSelectClip={selectClip}
              onScriptChange={onScriptChange}
            />
          )}
          <div className="min-h-0 flex-1 overflow-hidden">
            <NodeInspectorPanel
              selectedNode={selectedNode}
              selectedEdge={null}
              activePanel={activePanel}
              onActivePanelChange={onActivePanelChange}
              nodeForm={nodeForm}
              onNodeFormChange={onNodeFormChange}
              conditions={conditions}
              onConditionsChange={onConditionsChange}
              effects={effects}
              onEffectsChange={onEffectsChange}
              nodeProps={nodeProps}
              onPropsChange={onPropsChange}
              itemOptions={itemOptions}
              script={script}
              onScriptChange={onScriptChange}
              projectRoles={projectRoles}
              scenes={scenes}
              nodeStageId={(selectedNode?.data.stage_id as string) || null}
              onStageChange={onStageChange}
              nodes={allNodes}
              simTargets={simTargets}
              onPreviewScript={onPreviewScript}
              onDeleteNode={onDeleteNode}
              highlightScriptIndex={selectedIndex}
              onEdgeLabelChange={onEdgeLabelChange}
              onDeleteEdge={onDeleteEdge}
              variant="nle"
            />
          </div>
        </div>
      }
    />
    <KeyboardShortcutsModal
      open={shortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
    />
    </>
  );
}
