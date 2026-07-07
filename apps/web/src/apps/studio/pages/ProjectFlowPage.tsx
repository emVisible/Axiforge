
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import Shell from "@/components/Shell";
import Toast from "@/components/Toast";
import { BackLink, Button } from "@/components/ui";
import type { Instruction, Condition } from "@axiforge/core";
import { projectApi } from "@/api/editor";
import { characterApi } from "@/api/characters";
import ScriptPreview from "../components/ScriptPreview";
import type { SimTarget } from "../components/ConditionSimulator";
import FlowCanvas, { addEdge, MarkerType } from "../flow/FlowCanvas";
import FlowNodePalette from "../flow/FlowNodePalette";
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
} from "@/types/project";

export default function ProjectFlowPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sceneId = searchParams.get("scene");

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [projectRoles, setProjectRoles] = useState<ProjectRoleOption[]>([]);
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
  const [script, setScript] = useState<Instruction[]>([]);
  const [showPreview, setShowPreview] = useState(false);

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

  const fetchData = async () => {
    if (!id) return;
    const p = await projectApi.get(id);
    setProject(p);

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

    const scene = sceneId
      ? p.scenes?.find((s) => s.id === sceneId)
      : p.scenes?.[0];
    if (!scene) {
      setNodes([]);
      setEdges([]);
      return;
    }
    setCurrentScene(scene);

    const loadedNodes: Node[] = (scene.nodes || []).map(
      (n: ProjectNodeResponse) => {
        const ed = n.editor_data || {};
        const nd = n.narrative_data || {};
        const tc = nd.trigger_condition as Record<string, unknown> | null;
        const ef = nd.effects as Record<string, unknown>[] | null;
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
          },
        };
      },
    );
    setNodes(loadedNodes);

    const sceneNodeIds = new Set(
      (scene.nodes || []).map((n) => String(n.id)),
    );
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
  };

  useEffect(() => {
    fetchData();
  }, [id, sceneId]);

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
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, selectedNode, nodes, edges, setNodes]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const label = e.dataTransfer.getData("application/reactflow");
      if (!label || !wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      const isAnchor = label === "锚点事件";
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
        },
      };
      setNodes((nds) => {
        const n = [...nds, newNode];
        pushHistory(n, edges);
        return n;
      });
    },
    [nodes, edges, setNodes],
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

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
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
    setScript((node.data.script as Instruction[]) || []);
  }, []);

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

  const saveAll = async () => {
    if (!id || !currentScene) return;
    setSaving(true);
    try {
      const sid = currentScene.id;
      const currentIds = new Set(nodes.map((n) => n.id));
      for (const node of currentScene.nodes || []) {
        if (!currentIds.has(String(node.id))) {
          try {
            await projectApi.deleteNode(id, sid, node.id);
          } catch {
            /* 已删除则忽略 */
          }
        }
      }

      const nodeMap = new Map<string, string>();
      for (const n of nodes) {
        if (n.id.startsWith("new-") || n.id.startsWith("copy-")) {
          const created = await projectApi.addNode(id, sid, {
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
            },
          });
          nodeMap.set(n.id, created.id);
        } else {
          nodeMap.set(n.id, n.id);
        }
      }
      for (const n of nodes) {
        if (n.id.startsWith("new-") || n.id.startsWith("copy-")) continue;
        await projectApi.updateNode(id, sid, nodeMap.get(n.id) || n.id, {
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
          },
        });
      }

      const sceneNodeIds = new Set<string>();
      for (const n of nodes) {
        sceneNodeIds.add(nodeMap.get(n.id) || n.id);
      }
      for (const n of currentScene.nodes || []) {
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

      const refreshed = await projectApi.get(id);
      setProject(refreshed);
      const rs = refreshed.scenes?.find((s) => s.id === sid);
      if (rs) setCurrentScene(rs);
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

  return (
    <Shell>
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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BackLink to={`/studio/projects/${id}`}>返回剧本</BackLink>
          <span className="text-border">|</span>
          <span className="max-w-[200px] truncate text-sm font-medium text-ink">
            {project?.title || "加载中..."}
          </span>
          {currentScene && (
            <>
              <span className="text-border">|</span>
              <span className="text-xs text-ink-muted">{currentScene.title}</span>
              <span className="text-[10px] text-ink-muted/60">
                {currentScene.nodes?.length || 0} 节点
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo}>
            ↩ 撤销
          </Button>
          <Button size="md" onClick={saveAll} loading={saving} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 10rem)" }}>
        <FlowNodePalette />

        <FlowCanvas
          wrapperRef={wrapperRef}
          nodes={nodes}
          edges={edges}
          hoveredEdge={hoveredEdge}
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
          script={script}
          onScriptChange={updateScript}
          projectRoles={projectRoles}
          nodes={nodes}
          simTargets={simTargets}
          onPreviewScript={() => setShowPreview(true)}
          onDeleteNode={deleteSelectedNode}
          onEdgeLabelChange={handleEdgeLabelChange}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>
    </Shell>
  );
}
