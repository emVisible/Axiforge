import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MarkerType, type Node, type Edge, type Connection, type NodeChange, type EdgeChange, type NodeMouseHandler } from "reactflow";
import type { Instruction, Condition } from "@axiforge/core";
import type { NarrativeSyncRequest } from "@/shared/api/editor";
import { useDeleteProject } from "@/shared/hooks/useProjects";
import type { SimTarget } from "../components/ConditionSimulator";
import { addEdge } from "../flow/FlowCanvas";
import {
  computeStageLanes,
  layoutNodesByStage,
  stageBounds,
  stageNodeCounts,
} from "../flow/stageLayout";
import { STAGE_PALETTE, stageColorIndex } from "../flow/stageColors";
import type { PanelTab } from "../flow/NodeInspectorPanel";
import {
  flowEdgeStroke,
  type ConditionItem,
  type EffectItem,
  type NodeFormState,
  type ProjectRoleOption,
} from "../flow/types";
import type {
  ProjectResponse,
  ProjectSceneResponse,
  ProjectNodeResponse,
  ProjectUpdate,
} from "@/shared/types/project";
import type { CutLayoutApi } from "../cut/CutStudioView";
import { useProjectOutliner } from "../cut/hooks/useProjectOutliner";
import { exportProjectMarkdown } from "../lib/exportProjectMarkdown";
import { routes } from "@/shared/lib/routes";
import {
  axsToSyncPayload,
  beatLineForNode,
  collectProjectNodes,
  projectToAxs,
  projectAxsFromCanvas,
} from "@/features/writer/lib/projection";
import { sanitizeScript } from "@/features/studio/cut/timelineUtils";
import { useDraftJournal } from "./useDraftJournal";
import { fetchProjectDirectory } from "./useProjectDirectory";
import type {
  Draft,
  Edge as KernelEdge,
  NarrativeNode as KernelNode,
  Origin,
} from "@axiforge/editor-core";
import { draftFromProject } from "@/features/writer/lib/projection";
import {
  bundleToResponse,
  createStorageProvider,
  exportProjectAsAxsp,
  saveTextFile,
} from "@/shared/storage";
import type { StorageProvider } from "@axiforge/editor-core";


/** Draft 节点 → React Flow 节点投影（data 形状与旧 nodeResponseToFlowNode 逐字段一致） */
function flowNodeOf(
  draft: Draft,
  id: string,
  dragPositions: Map<string, { x: number; y: number }>,
  selected: boolean,
  scenes: ProjectSceneResponse[] = [],
  dimmed = false,
): Node | null {
  const n = draft.nodes.get(id);
  if (!n) return null;
  const nd = n.narrative;
  const tc = nd.trigger_condition as Record<string, unknown> | null;
  const ef = (nd.effects as unknown as Record<string, unknown>[]) || [];
  const script = (nd.script as Instruction[]) || [];
  const props = (nd.props as string[]) || [];
  const palette = STAGE_PALETTE[stageColorIndex(n.stageId, scenes.map((x) => x.id))];
  return {
    id: n.id,
    type: "custom",
    position: dragPositions.get(n.id) ?? n.position,
    selected,
    style: dimmed ? { opacity: 0.3 } : undefined,
    data: {
      title: nd.title || "未命名",
      description: nd.description || "",
      is_anchor: Boolean(nd.is_anchor),
      is_ending: Boolean(nd.is_ending),
      ending_label: (nd.ending_label as string) || "",
      speaker: nd.speaker || "",
      dialogue: nd.dialogue || "",
      narration: nd.narration || "",
      script,
      has_conditions: Boolean((tc as { conditions?: unknown[] } | null)?.conditions?.length),
      has_effects: Boolean(ef.length),
      has_script: Boolean(script.length),
      trigger_condition: tc,
      effects: ef,
      props,
      has_props: Boolean(props.length),
      stage_id: n.stageId,
      stage_title: scenes.find((x) => x.id === n.stageId)?.title ?? null,
      stage_border: palette.border,
      stage_header: palette.header,
      stage_dot: palette.dot,
    },
  };
}

export type EditorMode = "cut" | "flow" | "writer";
export type CanvasViewMode = "full" | "stage";

export function useProjectEditor(id: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sceneId = searchParams.get("scene");
  const providerRef = useRef<StorageProvider | null>(null);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const outliner = useProjectOutliner(id!);
  const deleteProjectMutation = useDeleteProject();

  const [projectRoles, setProjectRoles] = useState<ProjectRoleOption[]>([]);
  const [itemOptions, setItemOptions] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [currentScene, setCurrentScene] = useState<ProjectSceneResponse | null>(
    null,
  );
  // L2 内核：Draft 为图唯一持有者；React Flow 节点/边均为投影
  const { draft, sync, dispatch, undo: undoJournal } = useDraftJournal();
  const [dragPositions, setDragPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedNode: Node | null = useMemo(
    () => (selectedId ? flowNodeOf(draft, selectedId, dragPositions, true) : null),
    [selectedId, draft, dragPositions],
  );

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelTab>("content");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [nodeForm, setNodeForm] = useState<NodeFormState>({
    title: "",
    description: "",
    is_anchor: false,
    is_ending: false,
    ending_label: "",
    speaker: "",
    dialogue: "",
    narration: "",
  });
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [effects, setEffects] = useState<EffectItem[]>([]);
  const [nodeProps, setNodeProps] = useState<string[]>([]);
  const [script, setScript] = useState<Instruction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("cut");
  const [showAchievements, setShowAchievements] = useState(false);
  const [axsSource, setAxsSource] = useState("");
  const [axsDirty, setAxsDirty] = useState(false);
  const [allProjectNodes, setAllProjectNodes] = useState<ProjectNodeResponse[]>([]);
  const [writerScrollLine, setWriterScrollLine] = useState<number | null>(null);
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

  const rolesMap = useMemo(
    () => Object.fromEntries(projectRoles.map((r) => [r.name, r.characterRefId])),
    [projectRoles],
  );

  const scenesList = useMemo(() => project?.scenes || [], [project]);

  /** React Flow 节点投影：Draft + 拖拽临时层 + 选择/聚焦装饰 */
  const rfNodes: Node[] = useMemo(() => {
    const stageScoped = viewMode === "stage" && currentScene;
    return [...draft.nodes.values()]
      .filter((n) => (stageScoped ? n.stageId === currentScene!.id : true))
      .map((n) =>
        flowNodeOf(
          draft,
          n.id,
          dragPositions,
          selectedId === n.id,
          scenesList,
          Boolean(filteredStageId && n.stageId !== filteredStageId),
        )!,
      );
  }, [draft, dragPositions, selectedId, filteredStageId, viewMode, currentScene, scenesList]);

  /** React Flow 边投影（悬停高亮由 FlowCanvas 装饰） */
  const rfEdges: Edge[] = useMemo(() => {
    const stageScoped = viewMode === "stage" && currentScene;
    const visible = stageScoped
      ? new Set(
          [...draft.nodes.values()]
            .filter((n) => n.stageId === currentScene!.id)
            .map((n) => n.id),
        )
      : null;
    return draft.edges
      .filter((e) => !visible || (visible.has(e.source) && visible.has(e.target)))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: "output",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: flowEdgeStroke, strokeWidth: 2 },
        label: e.label || "",
        selected: selectedEdgeId === e.id,
      }));
  }, [draft, viewMode, currentScene, selectedEdgeId]);

  const selectedEdge: Edge | null = useMemo(
    () => (selectedEdgeId ? rfEdges.find((e) => e.id === selectedEdgeId) ?? null : null),
    [selectedEdgeId, rfEdges],
  );

  const editOrigin: Origin = editorMode === "flow" ? "flow" : "cut";
  const toKernelEdge = (e: Edge): KernelEdge => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: (e.label as string) ?? null,
  });
  const flowNodeToKernelNode = (n: Node): KernelNode => ({
    id: n.id,
    stageId: (n.data.stage_id as string) ?? null,
    position: n.position,
    narrative: n.data as Record<string, unknown>,
    sortOrder: rfNodes.length,
  });

  const projectAxsFromCanvasState = useCallback(() => {
    if (!project) return axsSource;
    const stageScoped = viewMode === "stage" && currentScene;
    return projectAxsFromCanvas(
      [...draft.nodes.values()]
        .filter((n) => (stageScoped ? n.stageId === currentScene!.id : true))
        .map((n) => ({
          id: n.id,
          position: n.position,
          data: { ...n.narrative, stage_id: n.stageId },
        })),
      draft.edges.map((e) => ({ source: e.source, target: e.target, label: e.label ?? null })),
      allProjectNodes,
      project.edges || [],
      project.scenes || [],
      rolesMap,
      stageScoped ? { scopeStageId: currentScene!.id } : undefined,
    );
  }, [
    project,
    draft,
    allProjectNodes,
    rolesMap,
    viewMode,
    currentScene,
    axsSource,
  ]);

  const persistAxsProjection = useCallback(
    async (source: string) => {
      const p = providerRef.current;
      if (!p || !id) return;
      const res = await p.updateProjectMeta(id, { axsSource: source });
      if (res.ok) {
        setAxsSource(source);
        setAxsDirty(false);
      }
    },
    [id],
  );

  const selectFlowNode = useCallback(
    (nodeOrId: Node | string) => {
      const id = typeof nodeOrId === "string" ? nodeOrId : nodeOrId.id;
      setSelectedId(id);
      setSelectedEdgeId(null);
      setActivePanel("content");
      const nd = draft.nodes.get(id)?.narrative ?? {};
      setNodeForm({
        title: (nd.title as string) || "",
        description: (nd.description as string) || "",
        is_anchor: Boolean(nd.is_anchor),
        is_ending: Boolean(nd.is_ending),
        ending_label: (nd.ending_label as string) || "",
        speaker: (nd.speaker as string) || "",
        dialogue: (nd.dialogue as string) || "",
        narration: (nd.narration as string) || "",
      });
      const tc = nd.trigger_condition as Record<string, unknown> | null;
      setConditions((tc?.conditions as ConditionItem[]) || []);
      setEffects((nd.effects as EffectItem[]) || []);
      setNodeProps((nd.props as string[]) || []);
      setScript(((nd.script ?? []) as Instruction[]) || []);
    },
    [draft],
  );

  const openWriterAtSelection = useCallback(() => {
    const projected = projectAxsFromCanvasState();
    setAxsSource(projected);
    setAxsDirty(false);
    if (selectedNode) {
      const line = beatLineForNode(
        projected,
        rolesMap,
        selectedNode.id,
        (selectedNode.data.title as string) || undefined,
      );
      if (line) setWriterScrollLine(line);
    }
    setEditorMode("writer");
  }, [projectAxsFromCanvasState, rolesMap, selectedNode]);

  const showToast = (m: string, t: "success" | "error" = "success") => {
    setToast({ message: m, type: t });
    setTimeout(() => setToast(null), 2500);
  };
  const undo = useCallback(() => {
    if (undoJournal()) showToast("已撤销");
  }, [undoJournal]);

  const syncCanvasFromProject = useCallback(
    async (p: ProjectResponse) => {
      const { roleOptions, items } = await fetchProjectDirectory(p);
      setProjectRoles(roleOptions);
      setItemOptions(items);
      const roleNameMap = Object.fromEntries(
        roleOptions.map((r) => [r.name, r.characterRefId]),
      );

      const projectNodes = collectProjectNodes(p.nodes, p.scenes || []);
      setAllProjectNodes(projectNodes);
      sync(draftFromProject(projectNodes, p.edges || [], p.scenes || []));
      const scenes = p.scenes || [];
      if (activeStageId === null && scenes[0]) {
        setActiveStageId(scenes[0].id);
      }

      const scene = sceneId
        ? p.scenes?.find((s) => s.id === sceneId)
        : null;
      if (!scene && !projectNodes.length) {
        setCurrentScene(null);
        setAxsSource(p.axs_source || `# 开始\n旁白：故事从这里开始。\n`);
        setAxsDirty(false);
        return;
      }
      setCurrentScene(scene ?? null);

      setAxsSource(
        p.axs_source ||
          projectToAxs(projectNodes, p.edges || [], p.scenes || [], roleNameMap),
      );
      setAxsDirty(false);
      setFitViewTrigger((t) => t + 1);
    },
    [activeStageId, sceneId, sync],
  );

  useEffect(() => {
    if (!project) return;
    void syncCanvasFromProject(project);
  }, [project, syncCanvasFromProject]);

  const refreshProject = useCallback(async () => {
    const p = providerRef.current;
    if (!p || !id) return;
    const res = await p.loadProject(id);
    if (res.ok) setProject(bundleToResponse(res.data));
  }, [id]);

  // Provider 初始化 + 工程装载（浏览器=HTTP 实现；桌面=SQLite 实现，断网可用）
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await createStorageProvider();
      if (cancelled) {
        return;
      }
      providerRef.current = p;
      const res = await p.loadProject(id);
      if (cancelled) return;
      setProjectLoading(false);
      if (res.ok) {
        setProject(bundleToResponse(res.data));
      } else if (res.error.code === "not_found") {
        showToast(`工程不存在或已删除`, "error");
      } else {
        showToast(`工程载入失败：${res.error.code}`, "error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openBeatInFlow = useCallback(
    (nodeId: string) => {
      if (!project) return;
      const projNode = allProjectNodes.find((n) => String(n.id) === nodeId);
      if (!projNode) return;
      const stageId = projNode.stage_id ?? projNode.scene_id;
      const targetScene =
        project.scenes?.find((s) => s.id === stageId) ?? project.scenes?.[0];
      if (viewMode === "stage" && targetScene && targetScene.id !== currentScene?.id) {
        setCurrentScene(targetScene);
        showToast(`已切换到舞台：${targetScene.title}`);
      }
      setEditorMode("flow");
      selectFlowNode(nodeId);
    },
    [project, allProjectNodes, currentScene?.id, selectFlowNode, viewMode],
  );

  // React Flow 变更分流：位置→拖拽临时层；选择→选择态；删除由 window 处理器负责
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const pos = changes.filter(
        (c): c is Extract<NodeChange, { type: "position" }> =>
          c.type === "position" && Boolean(c.position),
      );
      if (pos.length) {
        setDragPositions((prev) => {
          const m = new Map(prev);
          for (const c of pos) m.set(c.id, c.position!);
          return m;
        });
      }
      const sel = changes.filter((c) => c.type === "select");
      if (sel.length) {
        const picked = sel.find((c) => (c as { selected?: boolean }).selected);
        setSelectedId(picked ? picked.id : null);
      }
    },
    [],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const sel = changes.filter((c) => c.type === "select");
      if (sel.length) {
        const picked = sel.find((c) => (c as { selected?: boolean }).selected);
        setSelectedEdgeId(picked ? picked.id : null);
      }
      const removed = changes.filter((c) => c.type === "remove");
      if (removed.length) {
        dispatch(
          {
            kind: "edges.replaceAll",
            edges: draft.edges.filter((e) => !removed.some((c) => c.id === e.id)),
          },
          "flow",
        );
      }
    },
    [draft, dispatch],
  );

  // 拖拽落点记序：过程走临时层（高频），松手提交事务并清除临时层
  const handleNodeDragStop = useCallback<NodeMouseHandler>(
    (_, node) => {
      dispatch(
        { kind: "node.move", nodeId: node.id, position: node.position },
        "flow",
      );
      setDragPositions((prev) => {
        if (!prev.has(node.id)) return prev;
        const m = new Map(prev);
        m.delete(node.id);
        return m;
      });
    },
    [dispatch],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const label = e.dataTransfer.getData("application/reactflow");
      if (!label || !wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      const isAnchor = label === "锚点事件";
      const scenes = project?.scenes || [];
      const stageIds = scenes.map((s) => s.id);
      const stageId =
        viewMode === "full"
          ? activeStageId || currentScene?.id || scenes[0]?.id || null
          : currentScene?.id || null;
      const colorIdx = stageColorIndex(stageId, stageIds);
      const palette = STAGE_PALETTE[colorIdx];
      const stageTitle =
        scenes.find((s) => s.id === stageId)?.title ?? null;
      const newNode: Node = {
        id: `new-${Date.now()}`,
        type: "custom",
        position: {
          x: e.clientX - bounds.left - 110,
          y: e.clientY - bounds.top - 30,
        },
        data: {
          title: isAnchor ? "锚点事件" : "对话节点",
          description: "",
          is_anchor: isAnchor,
          speaker: "",
          dialogue: "",
          narration: "",
          script: [],
          has_conditions: false,
          has_effects: false,
          has_script: false,
          trigger_condition: null,
          effects: [],
          stage_id: stageId,
          stage_title: stageTitle,
          stage_border: palette.border,
          stage_header: palette.header,
          stage_dot: palette.dot,
        },
      };
      dispatch({ kind: "node.add", node: flowNodeToKernelNode(newNode) }, "flow");
    },
    [dispatch, project, viewMode, activeStageId, currentScene, rfNodes.length],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge: Edge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: "output",
        targetHandle: params.targetHandle ?? undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: flowEdgeStroke, strokeWidth: 2 },
        label: "",
      };
      dispatch(
        { kind: "edges.replaceAll", edges: addEdge(newEdge, rfEdges).map(toKernelEdge) },
        "flow",
      );
    },
    [rfEdges, dispatch],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectFlowNode(node);
    },
    [selectFlowNode],
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
    setSelectedEdgeId(null);
  }, []);

  const updateSelectedNode = (data: Partial<NodeFormState>) => {
    if (!selectedNode) return;
    const nd = { ...nodeForm, ...data };
    setNodeForm(nd);
    dispatch(
      {
        kind: "node.patch",
        nodeId: selectedNode.id,
        patch: {
          ...nd,
          is_anchor: Boolean(nd.is_anchor),
          is_ending: Boolean(nd.is_ending),
        },
      },
      editOrigin,
    );
  };

  const updateConditions = useCallback(
    (newC: ConditionItem[]) => {
      setConditions(newC);
      if (!selectedNode) return;
      const hc = newC.length > 0;
      const tc = hc ? { type: "all", conditions: newC } : null;
      dispatch(
        { kind: "node.patch", nodeId: selectedNode.id, patch: { trigger_condition: tc as Condition | null } },
        editOrigin,
      );
    },
    [selectedNode, dispatch, editOrigin],
  );

  const updateEffects = useCallback(
    (newE: EffectItem[]) => {
      setEffects(newE);
      if (!selectedNode) return;
      dispatch(
        { kind: "node.patch", nodeId: selectedNode.id, patch: { effects: newE } },
        editOrigin,
      );
    },
    [selectedNode, dispatch, editOrigin],
  );

  const updateScript = useCallback(
    (newS: Instruction[]) => {
      const cleaned = sanitizeScript(newS);
      setScript(cleaned);
      if (!selectedNode) return;
      // 单一写入口：内核事务校验并入日志（Draft 唯一持有者，投影自动反映）
      dispatch(
        { kind: "script.replace", nodeId: selectedNode.id, script: cleaned },
        editOrigin,
      );
    },
    [selectedNode, dispatch, editOrigin],
  );

  const renameBeat = useCallback(
    (nodeId: string, title: string) => {
      dispatch({ kind: "node.patch", nodeId, patch: { title } }, editOrigin);
    },
    [dispatch, editOrigin],
  );

  const patchProjectMeta = useCallback(
    async (patch: Pick<ProjectUpdate, "title" | "description" | "world_setting" | "rules">) => {
      if (!id) return;
      try {
        const p = providerRef.current;
        if (!p) throw new Error("provider 未就绪");
        const res = await p.updateProjectMeta(id, patch);
        if (!res.ok) throw new Error(res.error.code);
        await outliner.refresh();
        showToast("已保存项目信息");
      } catch {
        showToast("保存失败", "error");
      }
    },
    [id, outliner],
  );

  const updateNodeProps = useCallback(
    (newProps: string[]) => {
      setNodeProps(newProps);
      if (!selectedNode) return;
      dispatch(
        { kind: "node.patch", nodeId: selectedNode.id, patch: { props: newProps } },
        editOrigin,
      );
    },
    [selectedNode, dispatch, editOrigin],
  );

  useEffect(() => {
    if (editorMode !== "cut" || selectedNode || rfNodes.length === 0) return;
    selectFlowNode(rfNodes[0]!);
  }, [editorMode, rfNodes, selectedNode, selectFlowNode]);

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    const title = (selectedNode.data.title as string) || "未命名";
    if (
      !confirm(
        `删除整个 Beat「${title}」？\n其演出脚本、条件与效果将一并移除（不是只删一条指令）。`,
      )
    ) {
      return;
    }
    dispatch({ kind: "node.remove", nodeId: selectedNode.id }, "flow");
    setSelectedId(null);
  };

  const handleEdgeLabelChange = (edgeId: string, label: string) => {
    dispatch(
      {
        kind: "edges.replaceAll",
        edges: draft.edges.map((e) =>
          e.id === edgeId ? { ...e, label } : e,
        ),
      },
      "flow",
    );
  };

  const handleDeleteEdge = (edgeId: string) => {
    dispatch(
      { kind: "edges.replaceAll", edges: draft.edges.filter((e) => e.id !== edgeId) },
      "flow",
    );
    setSelectedEdgeId(null);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedNode) {
        e.preventDefault();
        dispatch(
          {
            kind: "node.add",
            node: {
              id: `copy-${Date.now()}`,
              stageId: (selectedNode.data.stage_id as string) ?? null,
              position: {
                x: selectedNode.position.x + 50,
                y: selectedNode.position.y + 50,
              },
              narrative: selectedNode.data as Record<string, unknown>,
              sortOrder: rfNodes.length,
            },
          },
          "flow",
        );
        showToast("已复制");
      }
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      if (!typing && (e.key === "Delete" || e.key === "Backspace")) {
        // 剪辑台由 CutStudioView 删除当前片段，避免误删整个 Beat
        if (editorMode === "cut") return;
        if (selectedEdge) {
          e.preventDefault();
          handleDeleteEdge(selectedEdge.id);
        } else if (selectedNode) {
          e.preventDefault();
          deleteSelectedNode();
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, selectedNode, selectedEdge, handleDeleteEdge, editorMode]);

  /** 传输态载荷 → L4 原子保存（HTTP/SQLite 实现共用） */
  const dispatchSaveNarrative = useCallback(
    async (payload: NarrativeSyncRequest, axsSourceOverride?: string | null) => {
      const p = providerRef.current;
      if (!p || !id) return;
      await p.saveNarrative(id, {
        axsSource: axsSourceOverride ?? payload.axs_source ?? null,
        nodes: payload.nodes.map((n) => ({
          id: String(n.id),
          stageId: n.stage_id ?? null,
          editorData: (n.editor_data ?? {}) as Record<string, unknown>,
          narrativeData: (n.narrative_data ?? {}) as Record<string, unknown>,
          sortOrder: n.sort_order ?? 0,
        })),
        edges: payload.edges.map((e) => ({
          id: `${e.source_node_id}-${e.target_node_id}`,
          source: String(e.source_node_id),
          target: String(e.target_node_id),
          label: e.label ?? null,
        })),
      });
    },
    [id],
  );

  const exportProjectAxsp = useCallback(async () => {
    const p = providerRef.current;
    if (!p || !id) return;
    const res = await exportProjectAsAxsp(p, id);
    if (!res.ok) {
      showToast(`导出失败：${res.error.code}`, "error");
      return;
    }
    const saved = await saveTextFile(
      `${project?.title || "工程"}.axsp`,
      res.data,
    );
    if (saved) showToast("已导出 .axsp");
  }, [id, project, showToast]);

  const saveWriter = async () => {
    if (!id || !project) return;
    setSaving(true);
    try {
      const rolesMap = Object.fromEntries(
        projectRoles.map((r) => [r.name, r.characterRefId]),
      );
      const payload = axsToSyncPayload(
        axsSource,
        rolesMap,
        project.scenes || [],
        allProjectNodes,
      );
      await dispatchSaveNarrative(payload);
      dispatch(
        { kind: "axs.import", source: axsSource, roles: rolesMap },
        "writer",
      );
      await refreshProject();
      showToast("剧本已保存");
    } catch {
      showToast("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    if (!id || !project) return;
    if (viewMode === "stage" && !currentScene) return;
    setSaving(true);
    try {
      const draftNodes = [...draft.nodes.values()];
      const uuid = () =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // 临时 id（new-/copy-）客户端重映射为正式 UUID
      const nodeMap = new Map<string, string>();
      for (const n of draftNodes) {
        nodeMap.set(n.id, n.id.startsWith("new-") || n.id.startsWith("copy-") ? uuid() : n.id);
      }

      // 作用域外节点：沿用最近一次服务端真值（原子覆写不可丢其他舞台）
      const preservedNodes = (allProjectNodes || [])
        .filter((n) => {
          const sid = n.stage_id ?? n.scene_id;
          return viewMode === "stage" && currentScene ? sid !== currentScene.id : false;
        })
        .map((n) => ({
          id: String(n.id),
          stageId: n.stage_id ?? n.scene_id ?? null,
          editorData: (n.editor_data ?? {}) as Record<string, unknown>,
          narrativeData: (n.narrative_data ?? {}) as Record<string, unknown>,
          sortOrder: n.sort_order ?? 0,
        }));

      const payloadNodes = [
        ...preservedNodes,
        ...draftNodes.map((n) => ({
          id: nodeMap.get(n.id)!,
          stageId: n.stageId ?? currentScene?.id ?? project.scenes?.[0]?.id ?? null,
          editorData: { position: n.position },
          narrativeData: n.narrative as Record<string, unknown>,
          sortOrder: n.sortOrder,
        })),
      ];

      // 边：全部按重映射后的 id 提交；舞台模式保留跨舞台既有边
      const inScope = new Set(payloadNodes.map((n) => n.id));
      const draftEdges = draft.edges.map((e) => ({
        id: `${nodeMap.get(e.source) || e.source}-${nodeMap.get(e.target) || e.target}`,
        source: nodeMap.get(e.source) || e.source,
        target: nodeMap.get(e.target) || e.target,
        label: e.label ?? null,
      }));
      const preservedEdges = (project?.edges || [])
        .filter((e) => {
          const src = String(e.source_node_id);
          const tgt = String(e.target_node_id);
          const bothOutside = !inScope.has(src) && !inScope.has(tgt);
          return viewMode === "stage" && bothOutside;
        })
        .map((e) => ({
          id: e.id,
          source: String(e.source_node_id),
          target: String(e.target_node_id),
          label: e.label,
        }));
      const payloadEdges = [...preservedEdges, ...draftEdges];

      await dispatchSaveNarrative(
        {
          axs_source: project.axs_source ?? "",
          nodes: payloadNodes.map((n) => ({
            id: n.id,
            stage_id: n.stageId,
            editor_data: n.editorData,
            narrative_data: n.narrativeData,
            sort_order: n.sortOrder,
          })),
          edges: payloadEdges.map((e) => ({
            source_node_id: e.source,
            target_node_id: e.target,
            source_port: "output",
            label: e.label,
          })),
        },
        project.axs_source ?? null,
      );

      await refreshProject();
      if (viewMode === "stage" && currentScene) {
        const rs = project.scenes?.find((sc) => sc.id === currentScene.id);
        if (rs) setCurrentScene(rs);
      }

      if (id) {
        const fresh = await providerRef.current?.loadProject(id);
        if (fresh?.ok) {
          const freshResponse = bundleToResponse(fresh.data);
          const projected = projectToAxs(
            collectProjectNodes(freshResponse.nodes, freshResponse.scenes || []),
            freshResponse.edges || [],
            freshResponse.scenes || [],
            rolesMap,
          );
          await persistAxsProjection(projected);
        }
      }

      showToast("已保存");
    } catch {
      showToast("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const simTargets: SimTarget[] = selectedNode
    ? rfEdges
        .filter((e) => e.source === selectedNode.id)
        .map((e) => {
          const tgt = rfNodes.find((n) => n.id === e.target);
          return {
            edgeId: e.id,
            label: (e.label as string) || "",
            targetTitle: (tgt?.data.title as string) || "未命名",
            trigger:
              (tgt?.data.trigger_condition as Condition | null) ?? null,
          };
        })
    : [];

  const roleNames = projectRoles.map((r) => r.name);

  const outlinerItemRefs = useMemo(() => {
    const refs = (project?.asset_refs || []).filter((r) => r.asset_type === "item");
    return refs.map((ref) => ({
      id: ref.id,
      asset_id: ref.asset_id,
      name:
        itemOptions.find((i) => i.id === ref.asset_id)?.name ||
        ref.asset_id.slice(0, 8),
    }));
  }, [project?.asset_refs, itemOptions]);

  const handleExportMarkdown = useCallback(() => {
    if (!project) return;
    const roleNameMap = Object.fromEntries(
      projectRoles.map((r) => [r.characterRefId, r.name]),
    );
    exportProjectMarkdown(project, roleNameMap);
    showToast("已导出 Markdown");
  }, [project, projectRoles]);

  const handleDeleteProject = useCallback(async () => {
    if (!id || !confirm("确定删除此剧本？此操作不可恢复。")) return;
    try {
      await deleteProjectMutation.mutateAsync(id);
      navigate(routes.projects);
    } catch {
      showToast("删除失败", "error");
    }
  }, [id, deleteProjectMutation, navigate]);

  const stageCounts = useMemo(
    () => stageNodeCounts(rfNodes, project?.scenes || []),
    [rfNodes, project?.scenes],
  );

  const stageLanes = useMemo(
    () =>
      viewMode === "full" && project?.scenes
        ? computeStageLanes(rfNodes, project.scenes)
        : [],
    [viewMode, rfNodes, project?.scenes],
  );

  const stageFocusBounds = useMemo(
    () => (focusStageId ? stageBounds(rfNodes, focusStageId) : null),
    [focusStageId, rfNodes, stageFocusTrigger],
  );

  const assignNodeStage = useCallback(
    (stageId: string) => {
      if (!selectedNode) return;
      dispatch(
        { kind: "node.restage", nodeId: selectedNode.id, stageId },
        editOrigin,
      );
    },
    [selectedNode, dispatch, editOrigin],
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

  const autoLayoutByStage = useCallback(() => {
    if (!project?.scenes?.length) return;
    const laid = layoutNodesByStage(rfNodes, project.scenes);
    for (const n of laid) {
      dispatch({ kind: "node.move", nodeId: n.id, position: n.position }, "flow");
    }
    setFitViewTrigger((t) => t + 1);
    showToast("已按舞台整理布局");
  }, [project, rfNodes, dispatch]);

  const switchScene = useCallback(
    (scene: ProjectSceneResponse) => {
      setCurrentScene(scene);
      setSelectedId(null);
      setFitViewTrigger((t) => t + 1);
    },
    [],
  );

  const switchViewMode = (mode: CanvasViewMode) => {
    if (mode === viewMode || !project) return;
    setViewMode(mode);
    setSelectedId(null);
    setSelectedEdgeId(null);
    setFilteredStageId(null);
    setFocusStageId(null);
  };
  return {
    project,
    projectLoading,
    navigate,
    outliner,
    handleDeleteProject,
    projectRoles,
    itemOptions,
    currentScene,
    draft,
    selectedNode,
    selectedEdge,
    toast,
    saving,
    hoveredEdge,
    setHoveredEdge,
    activePanel,
    setActivePanel,
    wrapperRef,
    nodeForm,
    conditions,
    effects,
    nodeProps,
    script,
    showPreview,
    setShowPreview,
    editorMode,
    setEditorMode,
    showAchievements,
    setShowAchievements,
    axsSource,
    setAxsSource,
    axsDirty,
    setAxsDirty,
    allProjectNodes,
    writerScrollLine,
    setWriterScrollLine,
    viewMode,
    switchViewMode,
    activeStageId,
    setActiveStageId,
    filteredStageId,
    setFilteredStageId,
    focusStageId,
    setFocusStageId,
    setStageFocusTrigger,
    fitViewTrigger,
    stageFocusTrigger,
    cutLayoutApiRef,
    cutSceneFilter,
    setCutSceneFilter,
    rfNodes,
    rfEdges,
    stageCounts,
    stageLanes,
    stageFocusBounds,
    simTargets,
    roleNames,
    outlinerItemRefs,
    showToast,
    setToast,
    rolesMap,
    editOrigin,
    switchScene,
    openWriterAtSelection,
    openBeatInFlow,
    selectFlowNode,
    undo,
    syncCanvasFromProject,
    refreshProject,
    saveWriter,
    saveAll,
    exportProjectAxsp,
    patchProjectMeta,
    handleExportMarkdown,
    handleNodesChange,
    handleEdgesChange,
    handleNodeDragStop,
    onDrop,
    onConnect,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    updateSelectedNode,
    updateConditions,
    updateEffects,
    updateScript,
    renameBeat,
    updateNodeProps,
    assignNodeStage,
    deleteSelectedNode,
    handleEdgeLabelChange,
    handleDeleteEdge,
    autoLayoutByStage,
    handleFocusStage,
    handleToggleStageFilter,
  };
}

export type ProjectEditor = ReturnType<typeof useProjectEditor>;
