
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  Anchor,
  Clapperboard,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import Shell from "@/components/Shell";
import Toast from "@/components/Toast";
import {
  BackLink,
  Button,
  CheckboxField,
  Input,
  Select,
  Textarea,
  cn,
  inputCompact,
  labelSm,
} from "@/components/ui";
import { tokens } from "@axiforge/ui";
import { projectApi } from "@/api/editor";
import { characterApi } from "@/api/characters";
import type {
  ProjectResponse,
  ProjectSceneResponse,
  ProjectNodeResponse,
} from "@/types/project";

interface ProjectRoleOption {
  roleId: string;
  characterRefId: string;
  name: string;
}

function parseCharStateKey(key: string): { charId: string; field: string } {
  const parts = key ? key.split(".") : [];
  if (parts.length !== 2) return { charId: "", field: "" };
  if (parts[0] === "char_id") return { charId: "", field: parts[1] };
  return { charId: parts[0], field: parts[1] };
}

// ================================================================
// 自定义节点 — 单输出端口
// ================================================================
function StoryNode({
  data,
  selected,
}: {
  data: Record<string, unknown>;
  selected: boolean;
}) {
  const title = (data.title as string) || "未命名";
  const description = (data.description as string) || "";
  const isAnchor = Boolean(data.is_anchor);
  const speaker = (data.speaker as string) || "";
  const hasConditions = Boolean(data.has_conditions);
  const hasEffects = Boolean(data.has_effects);

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[280px] rounded-xl border-2 shadow-sm transition-all duration-200",
        selected
          ? "border-brand bg-surface shadow-lg shadow-brand/10"
          : "border-border bg-surface hover:border-gray-300",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!-top-1.5 !h-3 !w-3 !border-2 !border-surface !bg-brand"
      />
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-[10px] px-4 py-2.5",
          isAnchor ? "bg-amber-50" : "bg-canvas",
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center">
          {isAnchor ? (
            <Anchor className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
          ) : (
            <MessageSquare
              className="h-3.5 w-3.5 text-ink-muted"
              strokeWidth={1.75}
            />
          )}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-ink">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {hasConditions && (
            <span className="rounded bg-purple-100 px-1 py-0.5 text-[9px] text-purple-600">
              条件
            </span>
          )}
          {hasEffects && (
            <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] text-emerald-600">
              效果
            </span>
          )}
          {isAnchor && (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-600">
              锚点
            </span>
          )}
          {speaker && (
            <span className="rounded bg-brand/10 px-1 py-0.5 text-[9px] text-brand">
              {speaker}
            </span>
          )}
        </div>
      </div>
      {description && (
        <div className="line-clamp-2 border-t border-border/60 px-4 py-2 text-[11px] leading-relaxed text-ink-muted">
          {description}
        </div>
      )}
      <div className="flex items-center justify-center border-t border-border px-3 py-1.5">
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="!relative !bottom-auto !left-auto !right-auto !top-auto !h-3 !w-3 !translate-none !border-2 !border-surface !bg-brand"
        />
        <span className="ml-1 text-[10px] text-ink-muted">输出</span>
      </div>
    </div>
  );
}

const nodeTypes = { custom: StoryNode };

const flowSelectClass = cn(inputCompact, "bg-surface");
const flowEdgeStroke = tokens.brand;
const flowEdgeStrokeHover = tokens.brandHover;

const EDGE_LABELS = [
  "",
  "接受",
  "拒绝",
  "继续",
  "离开",
  "追问",
  "沉默",
  "拥抱",
  "逃跑",
  "分支A",
  "分支B",
  "分支C",
];

// ================================================================
// 条件/效果类型
// ================================================================
interface ConditionItem {
  type: "memory" | "flag" | "character_state" | "node_completed";
  key: string;
  operator: "eq" | "ne" | "gt" | "lt" | "contains";
  value: string;
}
interface EffectItem {
  type: "memory" | "flag" | "character_state";
  key: string;
  value: string;
}

const CHARACTER_STATE_PRESETS = [
  {
    key: "mood",
    label: "情绪",
    values: [
      "neutral",
      "happy",
      "sad",
      "angry",
      "scared",
      "thoughtful",
      "determined",
    ],
  },
  {
    key: "affection",
    label: "好感度",
    values: ["-100", "-50", "-25", "0", "25", "50", "100"],
  },
  { key: "health", label: "健康", values: ["healthy", "injured", "critical"] },
  {
    key: "trust",
    label: "信任",
    values: ["none", "low", "medium", "high", "absolute"],
  },
  { key: "location", label: "位置", values: [] },
];

const CONDITION_TYPES = [
  {
    value: "memory" as const,
    label: "记忆",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    value: "flag" as const,
    label: "标志",
    color: "bg-red-50 border-red-200 text-red-700",
  },
  {
    value: "character_state" as const,
    label: "角色状态",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    value: "node_completed" as const,
    label: "前置节点",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
];

const EFFECT_TYPES = [
  {
    value: "memory" as const,
    label: "写入记忆",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    value: "flag" as const,
    label: "设置标志",
    color: "bg-red-50 border-red-200 text-red-700",
  },
  {
    value: "character_state" as const,
    label: "改变状态",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
];

const OPERATORS = [
  { value: "eq" as const, label: "=" },
  { value: "ne" as const, label: "≠" },
  { value: "gt" as const, label: ">" },
  { value: "lt" as const, label: "<" },
  { value: "contains" as const, label: "包含" },
];

// ================================================================
// 条件编辑器
// ================================================================
function ConditionEditor({
  conditions,
  onChange,
  roles,
}: {
  conditions: ConditionItem[];
  onChange: (c: ConditionItem[]) => void;
  roles: ProjectRoleOption[];
}) {
  const add = () =>
    onChange([
      ...conditions,
      { type: "memory", key: "", operator: "eq", value: "" },
    ]);
  const update = (i: number, d: Partial<ConditionItem>) => {
    const u = [...conditions];
    u[i] = { ...u[i], ...d };
    if (d.type && d.type !== conditions[i]?.type) {
      u[i].key = "";
      u[i].value = "";
    }
    onChange(u);
  };
  const remove = (i: number) => onChange(conditions.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelSm}>触发条件</label>
        <button
          onClick={add}
          className="text-[10px] font-medium text-brand hover:underline"
        >
          + 添加
        </button>
      </div>
      {conditions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-canvas/50 py-6 text-center">
          <p className="text-[11px] text-ink-muted/60">无条件 — 始终可用</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((c, i) => {
            const tc =
              CONDITION_TYPES.find((t) => t.value === c.type) ||
              CONDITION_TYPES[0];
            const isCS = c.type === "character_state";
            const { charId, field: spk } = parseCharStateKey(c.key);
            const mp = CHARACTER_STATE_PRESETS.find((p) => p.key === spk);
            return (
              <div
                key={i}
                className={`rounded-xl border bg-surface p-3 ${tc.color}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={c.type}
                    onChange={(e) =>
                      update(i, {
                        type: e.target.value as ConditionItem["type"],
                      })
                    }
                    className="text-[11px] font-medium bg-transparent border-none outline-none cursor-pointer"
                  >
                    {CONDITION_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(i)}
                    className="ml-auto text-xs text-ink-muted/60 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                {c.type === "node_completed" ? (
                  <input
                    value={c.key}
                    onChange={(e) => update(i, { key: e.target.value })}
                    placeholder="节点 ID"
                    className={cn(inputCompact, "w-full bg-surface")}
                  />
                ) : isCS ? (
                  <div className="space-y-1.5">
                    <select
                      value={charId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        update(i, {
                          key: cid && spk ? `${cid}.${spk}` : "",
                        });
                      }}
                      className={flowSelectClass}
                    >
                      <option value="">选择角色...</option>
                      {roles.map((r) => (
                        <option key={r.characterRefId} value={r.characterRefId}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={spk}
                        onChange={(e) => {
                          const p = CHARACTER_STATE_PRESETS.find(
                            (x) => x.key === e.target.value,
                          );
                          update(i, {
                            key: charId && e.target.value
                              ? `${charId}.${e.target.value}`
                              : "",
                            value: p?.values?.[0] || "",
                          });
                        }}
                        className={cn(flowSelectClass, "flex-1")}
                      >
                        <option value="">选择状态...</option>
                        {CHARACTER_STATE_PRESETS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={c.operator}
                        onChange={(e) =>
                          update(i, {
                            operator: e.target
                              .value as ConditionItem["operator"],
                          })
                        }
                        className={cn(flowSelectClass, "w-12 px-1")}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {mp && mp.values.length > 0 ? (
                      <select
                        value={c.value}
                        onChange={(e) => update(i, { value: e.target.value })}
                        className={flowSelectClass}
                      >
                        {mp.values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={c.value}
                        onChange={(e) => update(i, { value: e.target.value })}
                        placeholder="值"
                        className={cn(inputCompact, "w-full bg-surface")}
                      />
                    )}
                    <p className="text-[9px] text-ink-muted">
                      {roles.length === 0
                        ? "请先在剧本详情页关联角色"
                        : "选择剧本已关联的角色"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={c.key}
                      onChange={(e) => update(i, { key: e.target.value })}
                      placeholder="键名"
                      className={cn(flowSelectClass, "flex-1")}
                    />
                    <select
                      value={c.operator}
                      onChange={(e) =>
                        update(i, {
                          operator: e.target.value as ConditionItem["operator"],
                        })
                      }
                      className={cn(flowSelectClass, "w-12 px-1")}
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={c.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                      placeholder="值"
                      className={cn(flowSelectClass, "w-20")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================================================================
// 效果编辑器
// ================================================================
function EffectEditor({
  effects,
  onChange,
  roles,
}: {
  effects: EffectItem[];
  onChange: (e: EffectItem[]) => void;
  roles: ProjectRoleOption[];
}) {
  const add = () =>
    onChange([...effects, { type: "memory", key: "", value: "" }]);
  const update = (i: number, d: Partial<EffectItem>) => {
    const u = [...effects];
    u[i] = { ...u[i], ...d };
    if (d.type && d.type !== effects[i]?.type) {
      u[i].key = "";
      u[i].value = "";
    }
    onChange(u);
  };
  const remove = (i: number) => onChange(effects.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelSm}>完成效果</label>
        <button
          onClick={add}
          className="text-[10px] font-medium text-brand hover:underline"
        >
          + 添加
        </button>
      </div>
      {effects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-canvas/50 py-6 text-center">
          <p className="text-[11px] text-ink-muted/60">无效果 — 纯叙事节点</p>
        </div>
      ) : (
        <div className="space-y-2">
          {effects.map((e, i) => {
            const tc =
              EFFECT_TYPES.find((t) => t.value === e.type) || EFFECT_TYPES[0];
            const isCS = e.type === "character_state";
            const { charId, field: spk } = parseCharStateKey(e.key);
            const mp = CHARACTER_STATE_PRESETS.find((p) => p.key === spk);
            return (
              <div
                key={i}
                className={`rounded-xl border bg-surface p-3 ${tc.color}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={e.type}
                    onChange={(ev) =>
                      update(i, { type: ev.target.value as EffectItem["type"] })
                    }
                    className="text-[11px] font-medium bg-transparent border-none outline-none cursor-pointer"
                  >
                    {EFFECT_TYPES.map((et) => (
                      <option key={et.value} value={et.value}>
                        {et.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(i)}
                    className="ml-auto text-xs text-ink-muted/60 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                {isCS ? (
                  <div className="space-y-1.5">
                    <select
                      value={charId}
                      onChange={(ev) => {
                        const cid = ev.target.value;
                        update(i, {
                          key: cid && spk ? `${cid}.${spk}` : "",
                        });
                      }}
                      className={flowSelectClass}
                    >
                      <option value="">选择角色...</option>
                      {roles.map((r) => (
                        <option key={r.characterRefId} value={r.characterRefId}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={spk}
                      onChange={(ev) => {
                        const p = CHARACTER_STATE_PRESETS.find(
                          (x) => x.key === ev.target.value,
                        );
                        update(i, {
                          key: charId && ev.target.value
                            ? `${charId}.${ev.target.value}`
                            : "",
                          value: p?.values?.[0] || "",
                        });
                      }}
                      className={flowSelectClass}
                    >
                      <option value="">选择状态...</option>
                      {CHARACTER_STATE_PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {mp && mp.values.length > 0 ? (
                      <select
                        value={e.value}
                        onChange={(ev) => update(i, { value: ev.target.value })}
                        className={flowSelectClass}
                      >
                        {mp.values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={e.value}
                        onChange={(ev) => update(i, { value: ev.target.value })}
                        placeholder="值"
                        className={cn(inputCompact, "w-full bg-surface")}
                      />
                    )}
                    <p className="text-[9px] text-ink-muted">
                      {roles.length === 0
                        ? "请先在剧本详情页关联角色"
                        : "选择剧本已关联的角色"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={e.key}
                      onChange={(ev) => update(i, { key: ev.target.value })}
                      placeholder="键名"
                      className={cn(flowSelectClass, "flex-1")}
                    />
                    <span className="text-[11px] text-ink-muted">=</span>
                    <input
                      value={e.value}
                      onChange={(ev) => update(i, { value: ev.target.value })}
                      placeholder="值"
                      className={cn(flowSelectClass, "flex-1")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================================================================
// 主页面
// ================================================================
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
  const [activePanel, setActivePanel] = useState<
    "content" | "conditions" | "effects"
  >("content");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const [nodeForm, setNodeForm] = useState({
    title: "",
    description: "",
    is_anchor: false,
    speaker: "",
    dialogue: "",
    narration: "",
  });
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [effects, setEffects] = useState<EffectItem[]>([]);

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

  const undo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const s = historyRef.current[historyRef.current.length - 1];
    if (s) {
      setNodes(s.nodes);
      setEdges(s.edges);
      showToast("已撤销");
    }
  };

  // 加载
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
            speaker: nd.speaker || "",
            dialogue: nd.dialogue || "",
            narration: nd.narration || "",
            has_conditions: Boolean((tc as any)?.conditions?.length),
            has_effects: Boolean(ef?.length),
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

  // 键盘
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
  }, [undo, selectedNode, nodes, edges]);

  // 拖放
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
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
          has_conditions: false,
          has_effects: false,
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
    [nodes, edges],
  );

  // 连线 — 单端口
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
    [nodes, edges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setActivePanel("content");
    setNodeForm({
      title: (node.data.title as string) || "",
      description: (node.data.description as string) || "",
      is_anchor: Boolean(node.data.is_anchor),
      speaker: (node.data.speaker as string) || "",
      dialogue: (node.data.dialogue as string) || "",
      narration: (node.data.narration as string) || "",
    });
    const tc = node.data.trigger_condition as Record<string, unknown> | null;
    setConditions((tc?.conditions as ConditionItem[]) || []);
    setEffects((node.data.effects as EffectItem[]) || []);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const updateSelectedNode = (data: Partial<typeof nodeForm>) => {
    if (!selectedNode) return;
    const nd = { ...nodeForm, ...data };
    setNodeForm(nd);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? {
              ...n,
              data: { ...n.data, ...nd, is_anchor: Boolean(nd.is_anchor) },
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
    [selectedNode],
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
    [selectedNode],
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

  // 保存
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
          } catch {}
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
              speaker: (n.data.speaker as string) || null,
              dialogue: (n.data.dialogue as string) || null,
              narration: (n.data.narration as string) || null,
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
            speaker: (n.data.speaker as string) || null,
            dialogue: (n.data.dialogue as string) || null,
            narration: (n.data.narration as string) || null,
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

  const draggableLabels = [
    {
      label: "对话节点",
      icon: MessageSquare,
      color:
        "border-border bg-surface text-ink-muted shadow-sm hover:border-gray-300 hover:bg-canvas",
    },
    {
      label: "锚点事件",
      icon: Anchor,
      color:
        "border-amber-200 bg-amber-50 text-amber-600 shadow-sm hover:bg-amber-100",
    },
  ];

  const panelTabs = [
    { key: "content" as const, label: "内容", icon: FileText },
    { key: "conditions" as const, label: "条件", icon: Search },
    { key: "effects" as const, label: "效果", icon: Sparkles },
  ];

  return (
    <Shell>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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
        <div className="w-36 flex-shrink-0 space-y-3">
          <p className={cn(labelSm, "px-1")}>节点类型</p>
          {draggableLabels.map((item) => {
            const DragIcon = item.icon;
            return (
            <div
              key={item.label}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reactflow", item.label);
              }}
              className={`px-4 py-3 text-xs rounded-xl border-2 border-dashed cursor-grab active:cursor-grabbing text-center transition-all hover:border-solid ${item.color}`}
            >
              <DragIcon className="mx-auto mb-1 h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </div>
            );
          })}
          <div className="border-t border-border pt-4">
            <p className={cn(labelSm, "mb-2 px-1")}>操作提示</p>
            <div className="space-y-2 text-[10px] text-ink-muted">
              <p>拖入节点到画布</p>
              <p>从端口拖线连接</p>
              <p>滚轮缩放画布</p>
              <p>Ctrl+Z 撤销</p>
              <p>Delete 删除选中</p>
            </div>
          </div>
        </div>

        <div
          className="flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          ref={wrapperRef}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges.map((e) => ({
              ...e,
              style: {
                ...e.style,
                strokeWidth: e.id === hoveredEdge ? 4 : 2,
                stroke: e.id === hoveredEdge ? flowEdgeStrokeHover : flowEdgeStroke,
              },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onEdgeMouseEnter={(_, e) => setHoveredEdge(e.id)}
            onEdgeMouseLeave={() => setHoveredEdge(null)}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={["Backspace", "Delete"]}
            multiSelectionKeyCode={["Shift"]}
            selectionOnDrag
            panOnDrag={[1, 2]}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color={tokens.border}
            />
            <Controls className="!rounded-xl !border-border !bg-surface/90 !shadow-sm !backdrop-blur-sm" />
            <MiniMap
              style={{ background: tokens.canvas }}
              nodeColor={(n) => (n.data?.is_anchor ? "#d97706" : flowEdgeStroke)}
              maskColor="rgba(0,0,0,0.05)"
              className="!rounded-xl !border-border !shadow-sm"
            />
          </ReactFlow>
        </div>

        <div className="flex w-80 flex-shrink-0 flex-col rounded-2xl border border-border bg-surface shadow-sm">
          {selectedNode ? (
            <>
              <div className="flex border-b border-border">
                {panelTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                  <button
                    key={tab.key}
                    onClick={() => setActivePanel(tab.key)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-medium transition-all",
                      activePanel === tab.key
                        ? "border-b-2 border-brand bg-brand/5 text-brand"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    <TabIcon className="h-3 w-3" strokeWidth={1.75} />
                    {tab.label}
                  </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {activePanel === "content" && (
                  <div className="space-y-4">
                    <Input
                      label="节点标题"
                      value={nodeForm.title}
                      onChange={(e) =>
                        updateSelectedNode({ title: e.target.value })
                      }
                    />
                    <Select
                      label="说话角色"
                      value={nodeForm.speaker}
                      onChange={(e) =>
                        updateSelectedNode({ speaker: e.target.value })
                      }
                    >
                      <option value="">旁白（无说话人）</option>
                      {projectRoles.map((r) => (
                        <option key={r.characterRefId} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                    <Textarea
                      label="对话"
                      value={nodeForm.dialogue}
                      onChange={(e) =>
                        updateSelectedNode({ dialogue: e.target.value })
                      }
                      rows={3}
                      placeholder="角色台词..."
                    />
                    <Textarea
                      label="旁白"
                      value={nodeForm.narration}
                      onChange={(e) =>
                        updateSelectedNode({ narration: e.target.value })
                      }
                      rows={2}
                      placeholder="叙述性文字..."
                    />
                    <Textarea
                      label="备注"
                      value={nodeForm.description}
                      onChange={(e) =>
                        updateSelectedNode({ description: e.target.value })
                      }
                      rows={2}
                      placeholder="编辑器内部备注..."
                    />
                    <CheckboxField
                      checked={nodeForm.is_anchor}
                      onChange={(checked) =>
                        updateSelectedNode({ is_anchor: checked })
                      }
                      label="锚点事件（剧情关键转折点）"
                      className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5"
                    />
                  </div>
                )}
                {activePanel === "conditions" && (
                  <ConditionEditor
                    conditions={conditions}
                    onChange={updateConditions}
                    roles={projectRoles}
                  />
                )}
                {activePanel === "effects" && (
                  <EffectEditor
                    effects={effects}
                    onChange={updateEffects}
                    roles={projectRoles}
                  />
                )}
              </div>
              <div className="border-t border-border px-4 py-3">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={deleteSelectedNode}
                >
                  删除节点
                </Button>
              </div>
            </>
          ) : selectedEdge ? (
            <div className="flex-1 flex flex-col">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-ink">连线属性</h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <div>
                  <label className={cn(labelSm, "mb-2 block")}>分支标签</label>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {EDGE_LABELS.map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setEdges((eds) =>
                            eds.map((e) =>
                              e.id === selectedEdge.id ? { ...e, label: l } : e,
                            ),
                          );
                          setSelectedEdge((prev) =>
                            prev ? { ...prev, label: l } : null,
                          );
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[11px] transition-all",
                          selectedEdge.label === l
                            ? "border-brand bg-brand text-white shadow-sm"
                            : "border-border text-ink-muted hover:border-gray-300 hover:bg-canvas",
                        )}
                      >
                        {l || "无"}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={String(selectedEdge.label || "")}
                    onChange={(e) => {
                      setEdges((eds) =>
                        eds.map((ed) =>
                          ed.id === selectedEdge.id
                            ? { ...ed, label: e.target.value }
                            : ed,
                        ),
                      );
                      setSelectedEdge((prev) =>
                        prev ? { ...prev, label: e.target.value } : null,
                      );
                    }}
                    placeholder="自定义标签"
                    label="自定义标签"
                  />
                </div>
              </div>
              <div className="border-t border-border px-4 py-3">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setEdges((eds) =>
                      eds.filter((e) => e.id !== selectedEdge.id),
                    );
                    setSelectedEdge(null);
                  }}
                >
                  删除连线
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/5 text-brand">
                  <Clapperboard className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">叙事画布</p>
                  <p className="mt-1 text-xs text-ink-muted">点击节点编辑属性</p>
                </div>
                <div className="space-y-2 rounded-xl bg-canvas p-4 text-left text-[11px] text-ink-muted">
                  <p>
                    <strong>对话节点</strong> — 角色台词，连线分支
                  </p>
                  <p>
                    <strong>锚点事件</strong> — 剧情转折点
                  </p>
                  <p>
                    <strong>条件</strong> — 控制节点可见性
                  </p>
                  <p>
                    <strong>效果</strong> — 记忆/标志/状态变化
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
