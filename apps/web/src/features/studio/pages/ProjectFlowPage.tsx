
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { CanvasWorkspace } from "@/shared/components/Shell";
import Toast from "@/shared/components/Toast";
import { BackLink, Button, SegmentedControl, WorkspaceHeader } from "@/shared/components/ui";
import type { Instruction, Condition } from "@axiforge/core";
import { projectApi, itemApi } from "@/shared/api/editor";
import { characterApi } from "@/shared/api/characters";
import { useProject, PROJECT_KEYS } from "@/shared/hooks/useProjects";
import ScriptPreview from "../components/ScriptPreview";
import type { SimTarget } from "../components/ConditionSimulator";
import FlowCanvas, { addEdge, MarkerType } from "../flow/FlowCanvas";
import FlowNodePalette from "../flow/FlowNodePalette";
import StageLegend from "../flow/StageLegend";
import {
  computeStageLanes,
  layoutNodesByStage,
  stageBounds,
  stageNodeCounts,
} from "../flow/stageLayout";
import { STAGE_PALETTE, stageColorIndex } from "../flow/stageColors";
import NodeInspectorPanel, {
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
} from "@/shared/types/project";
import WriterPanel from "@/features/writer/components/WriterPanel";
import {
  axsToSyncPayload,
  beatLineForNode,
  collectProjectNodes,
  nodeIdForBeat,
  parseAxs,
  projectToAxs,
} from "@/features/writer/lib/projection";

type EditorMode = "flow" | "writer";
type CanvasViewMode = "full" | "stage";

export default function ProjectFlowPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sceneId = searchParams.get("scene");
  const qc = useQueryClient();
  const { data: project, isLoading: projectLoading } = useProject(id!);

  const [projectRoles, setProjectRoles] = useState<ProjectRoleOption[]>([]);
  const [itemOptions, setItemOptions] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [currentScene, setCurrentScene] = useState<ProjectSceneResponse | null>(
    null,
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelTab>("content");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

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
  const [editorMode, setEditorMode] = useState<EditorMode>("flow");
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

  const rolesMap = useMemo(
    () => Object.fromEntries(projectRoles.map((r) => [r.name, r.characterRefId])),
    [projectRoles],
  );

  const selectFlowNode = useCallback((node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setActivePanel("content");
    setNodeForm({
      title: (node.data.title as string) || "",
      description: (node.data.description as string) || "",
      is_anchor: Boolean(node.data.is_anchor),
      is_ending: Boolean(node.data.is_ending),
      ending_label: (node.data.ending_label as string) || "",
      speaker: (node.data.speaker as string) || "",
      dialogue: (node.data.dialogue as string) || "",
      narration: (node.data.narration as string) || "",
    });
    const tc = node.data.trigger_condition as Record<string, unknown> | null;
    setConditions((tc?.conditions as ConditionItem[]) || []);
    setEffects((node.data.effects as EffectItem[]) || []);
    setNodeProps((node.data.props as string[]) || []);
    setScript((node.data.script as Instruction[]) || []);
  }, []);

  const openWriterAtSelection = useCallback(() => {
    if (selectedNode) {
      const line = beatLineForNode(
        axsSource,
        rolesMap,
        selectedNode.id,
        (selectedNode.data.title as string) || undefined,
      );
      if (line) setWriterScrollLine(line);
    }
    setEditorMode("writer");
  }, [axsSource, rolesMap, selectedNode]);

  const showToast = (m: string, t: "success" | "error" = "success") => {
    setToast({ message: m, type: t });
    setTimeout(() => setToast(null), 2500);
  };
  const pushHistory = (nds: Node[], eds: Edge[]) => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nds)),
      edges: JSON.parse(JSON.stringify(eds)),
    });
    if (historyRef.current.length > 50) historyRef.current.shift();
  };

  const undo = useCallback(() => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const s = historyRef.current[historyRef.current.length - 1];
    if (s) {
      setNodes(s.nodes);
      setEdges(s.edges);
      showToast("已撤销");
    }
  }, [setNodes, setEdges]);

  const nodeResponseToFlowNode = (
    n: ProjectNodeResponse,
    scenes: ProjectSceneResponse[],
    stageIds: string[],
  ): Node => {
    const ed = n.editor_data || {};
    const nd = n.narrative_data || {};
    const tc = nd.trigger_condition as Record<string, unknown> | null;
    const ef = nd.effects as Record<string, unknown>[] | null;
    const stageId = n.stage_id ?? n.scene_id ?? null;
    const colorIdx = stageColorIndex(stageId, stageIds);
    const palette = STAGE_PALETTE[colorIdx];
    const stageTitle =
      scenes.find((s) => s.id === stageId)?.title ?? null;
    return {
      id: String(n.id),
      type: "custom",
      position: {
        x: ed.position?.x ?? Math.random() * 400 + 100,
        y: ed.position?.y ?? Math.random() * 300 + 50,
      },
      data: {
        title: nd.title || "未命名",
        description: nd.description || "",
        is_anchor: Boolean(nd.is_anchor),
        is_ending: Boolean(nd.is_ending),
        ending_label: (nd.ending_label as string) || "",
        speaker: nd.speaker || "",
        dialogue: nd.dialogue || "",
        narration: nd.narration || "",
        script: (nd.script as Instruction[]) || [],
        has_conditions: Boolean((tc as { conditions?: unknown[] })?.conditions?.length),
        has_effects: Boolean(ef?.length),
        has_script: Boolean((nd.script as Instruction[])?.length),
        trigger_condition: tc,
        effects: ef || [],
        props: (nd.props as string[]) || [],
        has_props: Boolean((nd.props as string[])?.length),
        stage_id: stageId,
        stage_title: stageTitle,
        stage_border: palette.border,
        stage_header: palette.header,
        stage_dot: palette.dot,
      },
    };
  };

  const applySceneCanvas = useCallback(
    (
      scene: ProjectSceneResponse,
      p: ProjectResponse,
      projectNodes: ProjectNodeResponse[],
    ): Node[] => {
      setCurrentScene(scene);
      const scenes = p.scenes || [];
      const stageIds = scenes.map((s) => s.id);
      const sceneNodes = projectNodes.filter(
        (n) => (n.stage_id ?? n.scene_id) === scene.id,
      );
      const loadedNodes = sceneNodes.map((n) =>
        nodeResponseToFlowNode(n, scenes, stageIds),
      );
      setNodes(loadedNodes);
      const sceneNodeIds = new Set(sceneNodes.map((n) => String(n.id)));
      const loadedEdges: Edge[] = (p.edges || [])
        .filter(
          (e) =>
            sceneNodeIds.has(String(e.source_node_id)) &&
            sceneNodeIds.has(String(e.target_node_id)),
        )
        .map((e) => ({
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          sourceHandle: "output",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: flowEdgeStroke, strokeWidth: 2 },
          label: e.label || "",
        }));
      setEdges(loadedEdges);
      pushHistory(loadedNodes, loadedEdges);
      return loadedNodes;
    },
    [setNodes, setEdges],
  );

  const applyFullCanvas = useCallback(
    (
      p: ProjectResponse,
      projectNodes: ProjectNodeResponse[],
    ): Node[] => {
      setCurrentScene(null);
      const scenes = p.scenes || [];
      const stageIds = scenes.map((s) => s.id);
      const loadedNodes = projectNodes.map((n) =>
        nodeResponseToFlowNode(n, scenes, stageIds),
      );
      const allNodeIds = new Set(projectNodes.map((n) => String(n.id)));
      const loadedEdges: Edge[] = (p.edges || [])
        .filter(
          (e) =>
            allNodeIds.has(String(e.source_node_id)) &&
            allNodeIds.has(String(e.target_node_id)),
        )
        .map((e) => ({
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          sourceHandle: "output",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: flowEdgeStroke, strokeWidth: 2 },
          label: e.label || "",
        }));
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      pushHistory(loadedNodes, loadedEdges);
      return loadedNodes;
    },
    [setNodes, setEdges],
  );

  const openBeatInFlow = useCallback(
    (beatId: string) => {
      if (!project) return;
      const beat = parseAxs(axsSource, { roles: rolesMap }).beats.find(
        (b) => b.id === beatId,
      );
      if (!beat) return;
      const nodeId = nodeIdForBeat(beat, allProjectNodes);
      if (!nodeId) {
        showToast("未找到对应节点，请先保存剧本", "error");
        return;
      }
      const projNode = allProjectNodes.find((n) => String(n.id) === nodeId);
      if (!projNode) return;

      const stageId = projNode.stage_id ?? projNode.scene_id;
      const targetScene =
        project.scenes?.find((s) => s.id === stageId) ?? project.scenes?.[0];

      let flowNode: Node | undefined;
      if (viewMode === "stage" && targetScene && targetScene.id !== currentScene?.id) {
        const loadedNodes = applySceneCanvas(
          targetScene,
          project,
          allProjectNodes,
        );
        flowNode = loadedNodes.find((n) => n.id === nodeId);
        showToast(`已切换到舞台：${targetScene.title}`);
      } else {
        flowNode = nodes.find((n) => n.id === nodeId);
      }
      if (!flowNode) {
        const scenes = project.scenes || [];
        const stageIds = scenes.map((s) => s.id);
        flowNode = nodeResponseToFlowNode(projNode, scenes, stageIds);
      }
      setEditorMode("flow");
      selectFlowNode(flowNode);
    },
    [
      project,
      axsSource,
      rolesMap,
      allProjectNodes,
      currentScene?.id,
      nodes,
      applySceneCanvas,
      selectFlowNode,
      viewMode,
    ],
  );

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
      const scenes = p.scenes || [];
      if (activeStageId === null && scenes[0]) {
        setActiveStageId(scenes[0].id);
      }

      const scene = sceneId
        ? p.scenes?.find((s) => s.id === sceneId)
        : p.scenes?.[0];
      if (!scene && !projectNodes.length) {
        setNodes([]);
        setEdges([]);
        setCurrentScene(null);
        setAxsSource(p.axs_source || `# 开始\n旁白：故事从这里开始。\n`);
        setAxsDirty(false);
        return;
      }
      if (viewMode === "full") {
        applyFullCanvas(p, projectNodes);
      } else if (scene) {
        applySceneCanvas(scene, p, projectNodes);
      } else {
        const stageIds = scenes.map((s) => s.id);
        const loadedNodes = projectNodes.map((n) =>
          nodeResponseToFlowNode(n, scenes, stageIds),
        );
        setNodes(loadedNodes);
        setEdges([]);
        pushHistory(loadedNodes, []);
      }

      setAxsSource(
        p.axs_source ||
          projectToAxs(projectNodes, p.edges || [], p.scenes || [], roleNameMap),
      );
      setAxsDirty(false);
      setFitViewTrigger((t) => t + 1);
    },
    [
      activeStageId,
      applyFullCanvas,
      applySceneCanvas,
      sceneId,
      setEdges,
      setNodes,
      viewMode,
    ],
  );

  useEffect(() => {
    if (!project) return;
    void syncCanvasFromProject(project);
  }, [project, syncCanvasFromProject]);

  const refreshProject = useCallback(async () => {
    if (!id) return;
    await qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
  }, [id, qc]);

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
      setNodes((nds) => {
        const n = [...nds, newNode];
        pushHistory(n, edges);
        return n;
      });
    },
    [nodes, edges, setNodes, project, viewMode, activeStageId, currentScene],
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
      setEdges((eds) => {
        const e = addEdge(newEdge, eds);
        pushHistory(nodes, e);
        return e;
      });
    },
    [nodes, edges, setEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectFlowNode(node);
    },
    [selectFlowNode],
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const updateSelectedNode = (data: Partial<NodeFormState>) => {
    if (!selectedNode) return;
    const nd = { ...nodeForm, ...data };
    setNodeForm(nd);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                ...nd,
                is_anchor: Boolean(nd.is_anchor),
                is_ending: Boolean(nd.is_ending),
              },
            }
          : n,
      ),
    );
  };

  const updateConditions = useCallback(
    (newC: ConditionItem[]) => {
      setConditions(newC);
      if (!selectedNode) return;
      const hc = newC.length > 0;
      const tc = hc ? { type: "all", conditions: newC } : null;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: { ...n.data, has_conditions: hc, trigger_condition: tc },
              }
            : n,
        ),
      );
    },
    [selectedNode, setNodes],
  );

  const updateEffects = useCallback(
    (newE: EffectItem[]) => {
      setEffects(newE);
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  has_effects: newE.length > 0,
                  effects: newE,
                },
              }
            : n,
        ),
      );
    },
    [selectedNode, setNodes],
  );

  const updateScript = useCallback(
    (newS: Instruction[]) => {
      setScript(newS);
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  script: newS,
                  has_script: newS.length > 0,
                },
              }
            : n,
        ),
      );
    },
    [selectedNode, setNodes],
  );

  const updateNodeProps = useCallback(
    (newProps: string[]) => {
      setNodeProps(newProps);
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  props: newProps,
                  has_props: newProps.length > 0,
                },
              }
            : n,
        ),
      );
    },
    [selectedNode, setNodes],
  );

  const deleteSelectedNode = () => {
    if (!selectedNode || !confirm("删除此节点？")) return;
    setNodes((nds) => {
      const n = nds.filter((x) => x.id !== selectedNode.id);
      pushHistory(n, edges);
      return n;
    });
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
      ),
    );
    setSelectedNode(null);
  };

  const handleEdgeLabelChange = (edgeId: string, label: string) => {
    setEdges((eds) =>
      eds.map((e) => (e.id === edgeId ? { ...e, label } : e)),
    );
    setSelectedEdge((prev) =>
      prev && prev.id === edgeId ? { ...prev, label } : prev,
    );
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedNode) {
        e.preventDefault();
        const copied: Node = {
          ...selectedNode,
          id: `copy-${Date.now()}`,
          position: {
            x: selectedNode.position.x + 50,
            y: selectedNode.position.y + 50,
          },
          selected: false,
        };
        setNodes((nds) => {
          const n = [...nds, copied];
          pushHistory(n, edges);
          return n;
        });
        showToast("已复制");
      }
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      if (!typing && (e.key === "Delete" || e.key === "Backspace")) {
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
  }, [undo, selectedNode, selectedEdge, nodes, edges, setNodes]);

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
      const currentIds = new Set(nodes.map((n) => n.id));
      const scopeNodes =
        viewMode === "full"
          ? allProjectNodes
          : allProjectNodes.filter(
              (n) => (n.stage_id ?? n.scene_id) === currentScene!.id,
            );

      const resolveStageId = (node: Node) =>
        (node.data.stage_id as string) ||
        currentScene?.id ||
        project.scenes?.[0]?.id;

      for (const node of scopeNodes) {
        if (!currentIds.has(String(node.id))) {
          const sid = node.stage_id ?? node.scene_id ?? currentScene?.id;
          if (!sid) continue;
          try {
            await projectApi.deleteNode(id, sid, node.id);
          } catch {
            /* 已删除则忽略 */
          }
        }
      }

      const nodeMap = new Map<string, string>();
      for (const n of nodes) {
        const sid = resolveStageId(n);
        if (!sid) continue;
        if (n.id.startsWith("new-") || n.id.startsWith("copy-")) {
          const created = await projectApi.addNode(id, sid, {
            stage_id: sid,
            editor_data: { position: n.position },
            narrative_data: {
              title: (n.data.title as string) || "未命名",
              description: (n.data.description as string) || "",
              is_anchor: Boolean(n.data.is_anchor),
              is_ending: Boolean(n.data.is_ending),
              ending_label: (n.data.ending_label as string) || null,
              speaker: (n.data.speaker as string) || null,
              dialogue: (n.data.dialogue as string) || null,
              narration: (n.data.narration as string) || null,
              script: (n.data.script as Instruction[]) || [],
              trigger_condition: n.data.trigger_condition || null,
              effects: n.data.effects || [],
              props: (n.data.props as string[]) || [],
            },
          });
          nodeMap.set(n.id, created.id);
        } else {
          nodeMap.set(n.id, n.id);
        }
      }
      for (const n of nodes) {
        if (n.id.startsWith("new-") || n.id.startsWith("copy-")) continue;
        const sid = resolveStageId(n);
        if (!sid) continue;
        await projectApi.updateNode(id, sid, nodeMap.get(n.id) || n.id, {
          stage_id: sid,
          editor_data: { position: n.position },
          narrative_data: {
            title: (n.data.title as string) || "未命名",
            description: (n.data.description as string) || "",
            is_anchor: Boolean(n.data.is_anchor),
            is_ending: Boolean(n.data.is_ending),
            ending_label: (n.data.ending_label as string) || null,
            speaker: (n.data.speaker as string) || null,
            dialogue: (n.data.dialogue as string) || null,
            narration: (n.data.narration as string) || null,
            script: (n.data.script as Instruction[]) || [],
            trigger_condition: n.data.trigger_condition || null,
            effects: n.data.effects || [],
            props: (n.data.props as string[]) || [],
          },
        });
      }

      if (viewMode === "full") {
        const allEdges = edges.map((e) => ({
          source_node_id: nodeMap.get(e.source) || e.source,
          target_node_id: nodeMap.get(e.target) || e.target,
          source_port: "output",
          label: (e.label as string) || null,
        }));
        await projectApi.saveEdges(id, allEdges);
      } else {
        const sceneNodeIds = new Set<string>();
        for (const n of nodes) {
          sceneNodeIds.add(nodeMap.get(n.id) || n.id);
        }
        for (const n of scopeNodes) {
          sceneNodeIds.add(String(n.id));
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

        const currentSceneEdges = edges.map((e) => ({
          source_node_id: nodeMap.get(e.source) || e.source,
          target_node_id: nodeMap.get(e.target) || e.target,
          source_port: "output",
          label: (e.label as string) || null,
        }));
        await projectApi.saveEdges(id, [...preservedEdges, ...currentSceneEdges]);
      }

      const un = nodes.map((n) => {
        const r = nodeMap.get(n.id);
        return r && r !== n.id ? { ...n, id: r } : n;
      });
      setNodes(un);
      const ue = edges.map((e) => ({
        ...e,
        id: `${nodeMap.get(e.source) || e.source}-${nodeMap.get(e.target) || e.target}`,
        source: nodeMap.get(e.source) || e.source,
        target: nodeMap.get(e.target) || e.target,
      }));
      setEdges(ue);
      pushHistory(un, ue);

      await refreshProject();
      if (viewMode === "stage" && currentScene && project) {
        const rs = project.scenes?.find((s) => s.id === currentScene.id);
        if (rs) setCurrentScene(rs);
      }
      showToast("已保存");
    } catch {
      showToast("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const simTargets: SimTarget[] = selectedNode
    ? edges
        .filter((e) => e.source === selectedNode.id)
        .map((e) => {
          const tgt = nodes.find((n) => n.id === e.target);
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

  const stageCounts = useMemo(
    () => stageNodeCounts(nodes, project?.scenes || []),
    [nodes, project?.scenes],
  );

  const stageLanes = useMemo(
    () =>
      viewMode === "full" && project?.scenes
        ? computeStageLanes(nodes, project.scenes)
        : [],
    [viewMode, nodes, project?.scenes],
  );

  const stageFocusBounds = useMemo(
    () => (focusStageId ? stageBounds(nodes, focusStageId) : null),
    [focusStageId, nodes, stageFocusTrigger],
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const sid = n.data.stage_id as string | undefined;
        const dimmed = filteredStageId && sid !== filteredStageId;
        return {
          ...n,
          selected: selectedNode?.id === n.id,
          style: dimmed ? { opacity: 0.3 } : undefined,
        };
      }),
    [nodes, selectedNode, filteredStageId],
  );

  const assignNodeStage = useCallback(
    (stageId: string) => {
      if (!selectedNode || !project?.scenes) return;
      const scenes = project.scenes;
      const stageIds = scenes.map((s) => s.id);
      const palette = STAGE_PALETTE[stageColorIndex(stageId, stageIds)];
      const stageTitle = scenes.find((s) => s.id === stageId)?.title ?? null;
      const patch = {
        stage_id: stageId,
        stage_title: stageTitle,
        stage_border: palette.border,
        stage_header: palette.header,
        stage_dot: palette.dot,
      };
      const updated: Node = {
        ...selectedNode,
        data: { ...selectedNode.data, ...patch },
      };
      setSelectedNode(updated);
      setNodes((nds) =>
        nds.map((n) => (n.id === selectedNode.id ? updated : n)),
      );
    },
    [selectedNode, project, setNodes],
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
    const laid = layoutNodesByStage(nodes, project.scenes);
    setNodes(laid);
    pushHistory(laid, edges);
    setFitViewTrigger((t) => t + 1);
    showToast("已按舞台整理布局");
  }, [project, nodes, edges, setNodes]);

  const switchScene = useCallback(
    (scene: ProjectSceneResponse) => {
      if (!project) return;
      applySceneCanvas(scene, project, allProjectNodes);
      setFitViewTrigger((t) => t + 1);
    },
    [project, allProjectNodes, applySceneCanvas],
  );

  const switchViewMode = (mode: CanvasViewMode) => {
    if (mode === viewMode || !project) return;
    setViewMode(mode);
    setSelectedNode(null);
    setSelectedEdge(null);
    setFilteredStageId(null);
    setFocusStageId(null);
  };

  return (
    <CanvasWorkspace>
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
        className="shrink-0 py-2.5"
        leading={
          <BackLink to={`/studio/projects/${id}`}>返回剧本</BackLink>
        }
        title={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="max-w-[200px] truncate text-sm font-medium text-ink">
              {project?.title || "加载中..."}
            </span>
            {viewMode === "stage" && project?.scenes && project.scenes.length > 0 && (
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
                <span className="text-[10px] text-ink-muted/60">{nodes.length} 节点</span>
              </>
            )}
            {viewMode === "full" && (
              <span className="text-[10px] text-ink-muted/60">
                全剧本 · {nodes.length} 节点
              </span>
            )}
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={switchViewMode}
              options={[
                { value: "full", label: "全剧本" },
                { value: "stage", label: "单舞台" },
              ]}
            />
            <SegmentedControl
              size="sm"
              value={editorMode}
              onChange={(mode) => {
                if (mode === "writer") openWriterAtSelection();
                else setEditorMode("flow");
              }}
              options={[
                { value: "flow", label: "画布" },
                { value: "writer", label: "剧本" },
              ]}
            />
          </div>
        }
        actions={
          <>
            {editorMode === "flow" && viewMode === "full" && (
              <Button variant="ghost" size="sm" onClick={autoLayoutByStage}>
                整理布局
              </Button>
            )}
            {editorMode === "flow" && selectedNode && (
              <Button variant="ghost" size="sm" onClick={openWriterAtSelection}>
                剧本定位
              </Button>
            )}
            {editorMode === "flow" && (
              <Button variant="ghost" size="sm" onClick={undo}>
                ↩ 撤销
              </Button>
            )}
            {editorMode === "flow" ? (
              <Button size="md" onClick={saveAll} loading={saving} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            ) : null}
          </>
        }
      />

      {editorMode === "writer" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <WriterPanel
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
        </div>
      ) : (
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <div className="flex w-44 shrink-0 flex-col gap-3">
          <FlowNodePalette />
          {viewMode === "full" && project?.scenes && (
            <StageLegend
              scenes={project.scenes}
              activeStageId={activeStageId}
              filteredStageId={filteredStageId}
              nodeCounts={stageCounts}
              onSelectStage={setActiveStageId}
              onFocusStage={handleFocusStage}
              onToggleFilter={handleToggleStageFilter}
            />
          )}
        </div>

        <FlowCanvas
          wrapperRef={wrapperRef}
          nodes={displayNodes}
          edges={edges}
          hoveredEdge={hoveredEdge}
          focusNodeId={selectedNode?.id}
          focusStageBounds={stageFocusBounds}
          focusStageTrigger={stageFocusTrigger}
          showSwimlanes={viewMode === "full"}
          stageLanes={stageLanes}
          highlightedStageId={filteredStageId}
          fitViewTrigger={fitViewTrigger}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onEdgeMouseEnter={(_, e) => setHoveredEdge(e.id)}
          onEdgeMouseLeave={() => setHoveredEdge(null)}
          onDrop={onDrop}
        />

        <NodeInspectorPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
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
          script={script}
          onScriptChange={updateScript}
          projectRoles={projectRoles}
          scenes={project?.scenes || []}
          nodeStageId={(selectedNode?.data.stage_id as string) || null}
          onStageChange={assignNodeStage}
          nodes={nodes}
          simTargets={simTargets}
          onPreviewScript={() => setShowPreview(true)}
          onDeleteNode={deleteSelectedNode}
          onEdgeLabelChange={handleEdgeLabelChange}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>
      )}
    </CanvasWorkspace>
  );
}
