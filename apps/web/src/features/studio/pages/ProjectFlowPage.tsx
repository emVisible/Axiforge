
import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeMouseHandler,
  MarkerType,
} from "reactflow";
import { CanvasWorkspace } from "@/shared/components/Shell";
import Toast from "@/shared/components/Toast";
import { BackLink, Button, SegmentedControl, WorkspaceHeader, WorkspaceToolbar } from "@/shared/components/ui";
import type { Instruction, Condition } from "@axiforge/core";
import { projectApi, itemApi } from "@/shared/api/editor";
import { characterApi } from "@/shared/api/characters";
import { useDeleteProject, useProject, PROJECT_KEYS } from "@/shared/hooks/useProjects";
import ScriptPreview from "../components/ScriptPreview";
import type { SimTarget } from "../components/ConditionSimulator";
import { addEdge } from "../flow/FlowCanvas";
import {
  computeStageLanes,
  layoutNodesByStage,
  stageBounds,
  stageNodeCounts,
} from "../flow/stageLayout";
import { STAGE_PALETTE, stageColorIndex } from "../flow/stageColors";
import {
  type PanelTab,
} from "../flow/NodeInspectorPanel";
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
import CutStudioView, { type CutLayoutApi } from "../cut/CutStudioView";
import CutLayoutToolbar from "../cut/CutLayoutToolbar";
import { useProjectOutliner } from "../cut/hooks/useProjectOutliner";
import { exportProjectMarkdown } from "../lib/exportProjectMarkdown";
import StudioModeFallback from "../components/StudioModeFallback";
import { routes } from "@/shared/lib/routes";
import { Play, Star } from "lucide-react";
import AchievementPanel from "../components/AchievementPanel";
import {
  axsToSyncPayload,
  beatLineForNode,
  collectProjectNodes,
  projectToAxs,
  projectAxsFromCanvas,
} from "@/features/writer/lib/projection";
import { sanitizeScript } from "@/features/studio/cut/timelineUtils";
import { useDraftJournal } from "@/features/studio/hooks/useDraftJournal";
import type {
  Draft,
  Edge as KernelEdge,
  NarrativeNode as KernelNode,
  Origin,
} from "@axiforge/editor-core";
import { draftFromProject } from "@/features/writer/lib/projection";

const LazyFlowStudioView = lazy(() => import("../flow/FlowStudioView"));

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
const LazyWriterStudioView = lazy(
  () => import("@/features/writer/components/WriterStudioView"),
);

function prefetchStudioModes() {
  void import("../flow/FlowStudioView");
  void import("@/features/writer/components/WriterStudioView");
}

type EditorMode = "cut" | "flow" | "writer";
type CanvasViewMode = "full" | "stage";

export default function ProjectFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sceneId = searchParams.get("scene");
  const qc = useQueryClient();
  const { data: project, isLoading: projectLoading } = useProject(id!);
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
      if (!id) return;
      await projectApi.update(id, { axs_source: source });
      setAxsSource(source);
      setAxsDirty(false);
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
      const roleOptions: ProjectRoleOption[] = [];
      for (const role of p.roles || []) {
        try {
          const char = await characterApi.get(role.character_ref_id);
          roleOptions.push({
            roleId: role.id,
            characterRefId: role.character_ref_id,
            name: char.name,
            imagePath: char.image_path,
            spriteKeys: Object.keys(char.character_data?.sprites || {}),
          });
        } catch {
          roleOptions.push({
            roleId: role.id,
            characterRefId: role.character_ref_id,
            name: `角色 ${role.character_ref_id.slice(0, 8)}`,
          });
        }
      }
      setProjectRoles(roleOptions);
      const roleNameMap = Object.fromEntries(
        roleOptions.map((r) => [r.name, r.characterRefId]),
      );

      const itemRefs = (p.asset_refs || []).filter((r) => r.asset_type === "item");
      const items: { id: string; name: string }[] = [];
      for (const ref of itemRefs) {
        try {
          const item = await itemApi.get(ref.asset_id);
          items.push({ id: ref.asset_id, name: item.name });
        } catch {
          items.push({
            id: ref.asset_id,
            name: `道具 ${ref.asset_id.slice(0, 8)}`,
          });
        }
      }
      setItemOptions(items);

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
    if (!id) return;
    await qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
  }, [id, qc]);

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
        await projectApi.update(id, patch);
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
      await projectApi.syncNarrative(id, payload);
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
      const currentIds = new Set(draftNodes.map((n) => n.id));
      const scopeNodes =
        viewMode === "full"
          ? draftNodes
          : draftNodes.filter((n) => n.stageId === currentScene!.id);

      const resolveStageId = (n: { stageId: string | null }) =>
        n.stageId || currentScene?.id || project.scenes?.[0]?.id;

      // 删除服务端存在、画布已消失的节点（作用域内，旧语义等价）
      for (const node of allProjectNodes) {
        const sid = node.stage_id ?? node.scene_id ?? currentScene?.id;
        if (viewMode !== "full" && sid !== currentScene?.id) continue;
        if (!currentIds.has(String(node.id))) {
          if (!sid) continue;
          try {
            await projectApi.deleteNode(id, sid, node.id);
          } catch {
            /* 已删除则忽略 */
          }
        }
      }

      const nodeMap = new Map<string, string>();
      for (const n of draftNodes) {
        const sid = resolveStageId(n);
        if (!sid) continue;
        if (n.id.startsWith("new-") || n.id.startsWith("copy-")) {
          const created = await projectApi.addNode(id, sid, {
            stage_id: sid,
            editor_data: { position: n.position },
            narrative_data: n.narrative as Record<string, unknown>,
          });
          nodeMap.set(n.id, created.id);
        } else {
          nodeMap.set(n.id, n.id);
        }
      }
      for (const n of draftNodes) {
        if (n.id.startsWith("new-") || n.id.startsWith("copy-")) continue;
        const sid = resolveStageId(n);
        if (!sid) continue;
        await projectApi.updateNode(id, sid, nodeMap.get(n.id) || n.id, {
          stage_id: sid,
          editor_data: { position: n.position },
          narrative_data: n.narrative as Record<string, unknown>,
        });
      }

      if (viewMode === "full") {
        const allEdges = draft.edges.map((e) => ({
          source_node_id: nodeMap.get(e.source) || e.source,
          target_node_id: nodeMap.get(e.target) || e.target,
          source_port: "output",
          label: e.label || null,
        }));
        await projectApi.saveEdges(id, allEdges);
      } else {
        const sceneNodeIds = new Set<string>();
        for (const n of draftNodes) {
          sceneNodeIds.add(nodeMap.get(n.id) || n.id);
        }
        for (const n of scopeNodes) {
          sceneNodeIds.add(n.id);
        }

        const preservedEdges = (project?.edges || [])
          .filter((e) => {
            const src = String(e.source_node_id);
            const tgt = String(e.target_node_id);
            return !(sceneNodeIds.has(src) && sceneNodeIds.has(tgt));
          })
          .map((e) => ({
            source_node_id: e.source_node_id,
            target_node_id: e.target_node_id,
            source_port: e.source_port || "output",
            label: e.label || null,
          }));

        const currentSceneEdges = draft.edges.map((e) => ({
          source_node_id: nodeMap.get(e.source) || e.source,
          target_node_id: nodeMap.get(e.target) || e.target,
          source_port: "output",
          label: e.label || null,
        }));
        await projectApi.saveEdges(id, [...preservedEdges, ...currentSceneEdges]);
      }

      await refreshProject();
      if (viewMode === "stage" && currentScene && project) {
        const rs = project.scenes?.find((s) => s.id === currentScene.id);
        if (rs) setCurrentScene(rs);
      }

      if (id) {
        const fresh = await projectApi.get(id);
        const freshNodes = collectProjectNodes(fresh.nodes, fresh.scenes || []);
        const projected = projectToAxs(
          freshNodes,
          fresh.edges || [],
          fresh.scenes || [],
          rolesMap,
        );
        await persistAxsProjection(projected);
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

  return (
    <CanvasWorkspace immersive className={editorMode === "cut" ? "bg-canvas" : ""}>
      {projectLoading && !project && (
        <p className="py-20 text-center text-sm text-ink-muted">加载中...</p>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showPreview && (
        <ScriptPreview
          script={script}
          roles={projectRoles}
          onClose={() => setShowPreview(false)}
        />
      )}
      <WorkspaceHeader
        variant="dense"
        leading={
          <BackLink to={routes.projects}>剧本列表</BackLink>
        }
        title={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="max-w-[200px] truncate text-sm font-medium text-ink">
              {project?.title || "加载中..."}
            </span>
            {editorMode !== "cut" && viewMode === "stage" && project?.scenes && project.scenes.length > 0 && (
              <>
                <select
                  value={currentScene?.id ?? project.scenes[0]?.id ?? ""}
                  onChange={(e) => {
                    const scene = project.scenes?.find((s) => s.id === e.target.value);
                    if (scene) switchScene(scene);
                  }}
                  className="max-w-[140px] truncate rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink"
                >
                  {project.scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-ink-muted/60">{rfNodes.length} 节点</span>
              </>
            )}
            {editorMode !== "cut" && viewMode === "full" && (
              <span className="text-[10px] text-ink-muted/60">
                全剧本 · {rfNodes.length} 节点
              </span>
            )}
            {editorMode !== "cut" && (
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={switchViewMode}
              options={[
                { value: "full", label: "全剧本" },
                { value: "stage", label: "单舞台" },
              ]}
            />
            )}
            <div onMouseEnter={prefetchStudioModes}>
            <SegmentedControl
              size="sm"
              value={editorMode}
              onChange={(mode) => {
                if (mode === "writer") openWriterAtSelection();
                else setEditorMode(mode as EditorMode);
              }}
              options={[
                { value: "cut", label: "剪辑" },
                { value: "writer", label: "剧本" },
                { value: "flow", label: "结构" },
              ]}
            />
            </div>
          </div>
        }
        actions={
          <WorkspaceToolbar>
            {editorMode === "cut" && (
              <CutLayoutToolbar layoutApiRef={cutLayoutApiRef} />
            )}
            {editorMode === "flow" && viewMode === "full" && (
              <Button variant="ghost" size="toolbar" onClick={autoLayoutByStage}>
                整理布局
              </Button>
            )}
            {editorMode === "flow" && selectedNode && (
              <Button variant="ghost" size="toolbar" onClick={openWriterAtSelection}>
                剧本定位
              </Button>
            )}
            {editorMode === "flow" && (
              <Button variant="ghost" size="toolbar" onClick={undo}>
                ↩ 撤销
              </Button>
            )}
            {id && (
              <Button
                variant="ghost"
                size="toolbar"
                icon={<Star className="h-3.5 w-3.5" />}
                onClick={() => setShowAchievements(true)}
              >
                成就
              </Button>
            )}
            {id && (
              <Button
                as="link"
                to={routes.play(id)}
                variant="secondary"
                size="toolbar"
                icon={<Play className="h-3.5 w-3.5" />}
              >
                试玩
              </Button>
            )}
            {(editorMode === "flow" || editorMode === "cut") && (
              <Button size="sm" onClick={saveAll} loading={saving} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            )}
          </WorkspaceToolbar>
        }
      />

      {editorMode === "writer" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<StudioModeFallback />}>
        <LazyWriterStudioView
          source={axsSource}
          roles={Object.fromEntries(
            projectRoles.map((r) => [r.name, r.characterRefId]),
          )}
          roleNames={roleNames}
          onChange={(next) => {
            setAxsSource(next);
            setAxsDirty(true);
          }}
          onSave={saveWriter}
          saving={saving}
          dirty={axsDirty}
          scrollToLine={writerScrollLine}
          onBeatSelect={(beat) => setWriterScrollLine(beat.line)}
          onOpenInFlow={openBeatInFlow}
        />
        </Suspense>
        </div>
      ) : editorMode === "cut" ? (
        project && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CutStudioView
          layoutApiRef={cutLayoutApiRef}
          project={project}
          nodes={rfNodes}
          selectedNode={selectedNode}
          onSelectBeat={selectFlowNode}
          sceneFilterId={cutSceneFilter}
          onSceneFilterChange={setCutSceneFilter}
          script={script}
          projectRoles={projectRoles}
          projectRolesRaw={project?.roles || []}
          itemRefs={outlinerItemRefs}
          activePanel={activePanel}
          onActivePanelChange={setActivePanel}
          nodeForm={nodeForm}
          onNodeFormChange={updateSelectedNode}
          conditions={conditions}
          onConditionsChange={updateConditions}
          effects={effects}
          onEffectsChange={updateEffects}
          nodeProps={nodeProps}
          onPropsChange={updateNodeProps}
          itemOptions={itemOptions}
          onScriptChange={updateScript}
          scenes={project?.scenes || []}
          onStageChange={assignNodeStage}
          allNodes={rfNodes}
          simTargets={simTargets}
          onPreviewScript={() => setShowPreview(true)}
          onDeleteNode={deleteSelectedNode}
          onAddScene={async (title) => {
            try {
              await outliner.addScene(title);
              showToast("已添加舞台");
            } catch {
              showToast("添加失败", "error");
            }
          }}
          onImportScene={async (assetId) => {
            try {
              await outliner.importSceneAsset(assetId);
              showToast("已导入舞台");
            } catch {
              showToast("导入失败", "error");
            }
          }}
          onDeleteScene={async (sceneIdToDelete) => {
            try {
              await outliner.deleteScene(sceneIdToDelete);
              if (cutSceneFilter === sceneIdToDelete) setCutSceneFilter(null);
              showToast("已删除舞台");
            } catch {
              showToast("删除失败", "error");
            }
          }}
          onAddRole={async (characterId, name) => {
            try {
              await outliner.addRole(characterId, name);
              showToast(`已添加角色「${name}」`);
            } catch {
              showToast("添加失败", "error");
            }
          }}
          onRemoveRole={async (roleId) => {
            try {
              await outliner.removeRole(roleId);
              showToast("已移除角色");
            } catch {
              showToast("移除失败", "error");
            }
          }}
          onAddItem={async (itemId) => {
            try {
              await outliner.addItemRef(itemId);
              showToast("已添加道具引用");
            } catch {
              showToast("添加失败", "error");
            }
          }}
          onRemoveItemRef={async (refId) => {
            try {
              await outliner.removeItemRef(refId);
              showToast("已移除道具");
            } catch {
              showToast("移除失败", "error");
            }
          }}
          onOpenFlow={() => {
            if (cutSceneFilter) {
              setFilteredStageId(cutSceneFilter);
              setFocusStageId(cutSceneFilter);
              setStageFocusTrigger((t) => t + 1);
            }
            setEditorMode("flow");
          }}
          onOpenWriter={openWriterAtSelection}
          onExportMarkdown={handleExportMarkdown}
          onDeleteProject={handleDeleteProject}
          onBeatRename={renameBeat}
          onProjectPatch={patchProjectMeta}
          selectedEdge={null}
          onEdgeLabelChange={handleEdgeLabelChange}
          onDeleteEdge={handleDeleteEdge}
        />
        </div>
        )
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<StudioModeFallback />}>
        <LazyFlowStudioView
          wrapperRef={wrapperRef}
          viewMode={viewMode}
          projectScenes={project?.scenes}
          displayNodes={rfNodes}
          edges={rfEdges}
          hoveredEdge={hoveredEdge}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          activeStageId={activeStageId}
          filteredStageId={filteredStageId}
          stageCounts={stageCounts}
          stageLanes={stageLanes}
          stageFocusBounds={stageFocusBounds}
          stageFocusTrigger={stageFocusTrigger}
          fitViewTrigger={fitViewTrigger}
          activePanel={activePanel}
          nodeForm={nodeForm}
          conditions={conditions}
          effects={effects}
          nodeProps={nodeProps}
          script={script}
          itemOptions={itemOptions}
          projectRoles={projectRoles}
          nodes={rfNodes}
          simTargets={simTargets}
          onActivePanelChange={setActivePanel}
          onNodesChange={handleNodesChange}
          onNodeDragStop={handleNodeDragStop}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onEdgeMouseEnter={(_, e) => setHoveredEdge(e.id)}
          onEdgeMouseLeave={() => setHoveredEdge(null)}
          onDrop={onDrop}
          onNodeFormChange={updateSelectedNode}
          onConditionsChange={updateConditions}
          onEffectsChange={updateEffects}
          onPropsChange={updateNodeProps}
          onScriptChange={updateScript}
          onStageChange={assignNodeStage}
          onPreviewScript={() => setShowPreview(true)}
          onDeleteNode={deleteSelectedNode}
          onEdgeLabelChange={handleEdgeLabelChange}
          onDeleteEdge={handleDeleteEdge}
          onSelectStage={setActiveStageId}
          onFocusStage={handleFocusStage}
          onToggleStageFilter={handleToggleStageFilter}
        />
        </Suspense>
        </div>
      )}

      {showAchievements && id && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAchievements(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-panel shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">项目成就</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAchievements(false)}>
                关闭
              </Button>
            </div>
            <AchievementPanel projectId={id} />
          </div>
        </div>
      )}
    </CanvasWorkspace>
  );
}
