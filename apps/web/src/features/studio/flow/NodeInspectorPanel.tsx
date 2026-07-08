import {
  Clapperboard,
  FileText,
  Package,
  Search,
  Sparkles,
} from "lucide-react";
import type { ProjectSceneResponse } from "@/shared/types/project";
import type { Instruction } from "@axiforge/core";
import type { Edge, Node } from "reactflow";

import {
  Button,
  CheckboxField,
  Input,
  Select,
  Textarea,
  cn,
  labelSm,
} from "@/shared/components/ui";
import ScriptEditor from "../components/ScriptEditor";
import ConditionSimulator, {
  type SimTarget,
} from "../components/ConditionSimulator";
import ConditionEditor from "./ConditionEditor";
import EffectEditor from "./EffectEditor";
import { EDGE_LABELS, type ConditionItem, type EffectItem, type NodeFormState, type ProjectRoleOption } from "./types";

type PanelTab = "content" | "script" | "conditions" | "effects";

const PANEL_TABS = [
  { key: "content" as const, label: "内容", icon: FileText },
  { key: "script" as const, label: "演出", icon: Clapperboard },
  { key: "conditions" as const, label: "条件", icon: Search },
  { key: "effects" as const, label: "效果", icon: Sparkles },
];

interface ItemOption {
  id: string;
  name: string;
}

interface NodeInspectorPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
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
  itemOptions: ItemOption[];
  script: Instruction[];
  onScriptChange: (s: Instruction[]) => void;
  projectRoles: ProjectRoleOption[];
  scenes: ProjectSceneResponse[];
  nodeStageId: string | null;
  onStageChange: (stageId: string) => void;
  nodes: Node[];
  simTargets: SimTarget[];
  onPreviewScript: () => void;
  onDeleteNode: () => void;
  highlightScriptIndex?: number | null;
  onEdgeLabelChange: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  variant?: "default" | "nle";
}

export default function NodeInspectorPanel({
  selectedNode,
  selectedEdge,
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
  script,
  onScriptChange,
  projectRoles,
  scenes,
  nodeStageId,
  onStageChange,
  nodes,
  simTargets,
  onPreviewScript,
  onDeleteNode,
  highlightScriptIndex = null,
  onEdgeLabelChange,
  onDeleteEdge,
  variant = "default",
}: NodeInspectorPanelProps) {
  const isNle = variant === "nle";

  return (
    <div
      className={cn(
        "flex flex-col",
        isNle
          ? "h-full min-h-0 w-full border-0 bg-transparent shadow-none"
          : "w-80 shrink-0 rounded-2xl border border-border bg-surface shadow-sm",
      )}
    >
      {selectedNode ? (
        <div className={cn("flex flex-col", isNle && "min-h-0 flex-1")}>
          <div
            className={cn(
              "flex border-b",
              isNle ? "border-border bg-surface-raised" : "border-border",
            )}
          >
            {PANEL_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onActivePanelChange(tab.key)}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-medium transition-all",
                    activePanel === tab.key
                      ? isNle
                        ? "border-b-2 border-accent-soft bg-panel-raised text-ink"
                        : "border-b-2 border-brand bg-brand/5 text-brand"
                      : isNle
                        ? "text-ink-faint hover:text-ink-muted"
                        : "text-ink-muted hover:text-ink",
                  )}
                >
                  <TabIcon className="h-3 w-3" strokeWidth={1.75} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto p-4",
              isNle && "bg-surface text-ink",
            )}
          >
            {activePanel === "content" && (
              <div className="space-y-4">
                {scenes.length > 0 && (
                  <Select
                    label="所属舞台"
                    value={nodeStageId || ""}
                    onChange={(e) => onStageChange(e.target.value)}
                  >
                    <option value="" disabled>
                      选择舞台
                    </option>
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </Select>
                )}
                <Input
                  label="节点标题"
                  value={nodeForm.title}
                  onChange={(e) => onNodeFormChange({ title: e.target.value })}
                />
                <Select
                  label="说话角色"
                  value={nodeForm.speaker}
                  onChange={(e) => onNodeFormChange({ speaker: e.target.value })}
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
                  onChange={(e) => onNodeFormChange({ dialogue: e.target.value })}
                  rows={3}
                  placeholder="角色台词..."
                />
                <Textarea
                  label="旁白"
                  value={nodeForm.narration}
                  onChange={(e) => onNodeFormChange({ narration: e.target.value })}
                  rows={2}
                  placeholder="叙述性文字..."
                />
                <Textarea
                  label="备注"
                  value={nodeForm.description}
                  onChange={(e) => onNodeFormChange({ description: e.target.value })}
                  rows={2}
                  placeholder="编辑器内部备注..."
                />
                <CheckboxField
                  checked={nodeForm.is_anchor}
                  onChange={(checked) => onNodeFormChange({ is_anchor: checked })}
                  label="锚点事件（剧情关键转折点）"
                  className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5"
                />
                <CheckboxField
                  checked={nodeForm.is_ending}
                  onChange={(checked) => onNodeFormChange({ is_ending: checked })}
                  label="结局节点"
                  className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5"
                />
                {nodeForm.is_ending && (
                  <Input
                    label="结局名称"
                    value={nodeForm.ending_label}
                    onChange={(e) =>
                      onNodeFormChange({ ending_label: e.target.value })
                    }
                    placeholder="如：真结局 / Bad End"
                  />
                )}
                {itemOptions.length > 0 && (
                  <div>
                    <p className={labelSm}>关联道具</p>
                    <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-canvas p-2">
                      {itemOptions.map((item) => {
                        const checked = nodeProps.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                onPropsChange(
                                  checked
                                    ? nodeProps.filter((x) => x !== item.id)
                                    : [...nodeProps, item.id],
                                );
                              }}
                              className="rounded border-border text-brand focus:ring-brand"
                            />
                            <Package
                              className="h-3 w-3 shrink-0 text-ink-muted"
                              strokeWidth={1.75}
                            />
                            <span className="truncate text-ink">{item.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activePanel === "script" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onPreviewScript}
                  disabled={script.length === 0}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all",
                    script.length === 0
                      ? "cursor-not-allowed bg-canvas text-ink-muted/50"
                      : "bg-brand/10 text-brand hover:bg-brand/20",
                  )}
                >
                  <Clapperboard className="h-3.5 w-3.5" strokeWidth={1.75} />
                  预览此节点演出
                </button>
                <ScriptEditor
                  script={script}
                  roles={projectRoles}
                  nodes={nodes.map((n) => ({
                    id: n.id,
                    title: (n.data.title as string) || "未命名",
                  }))}
                  onChange={onScriptChange}
                  highlightIndex={highlightScriptIndex}
                />
              </div>
            )}
            {activePanel === "conditions" && (
              <div className="space-y-5">
                <ConditionEditor
                  conditions={conditions}
                  onChange={onConditionsChange}
                  roles={projectRoles}
                />
                <div className="border-t border-border pt-4">
                  <ConditionSimulator targets={simTargets} />
                </div>
              </div>
            )}
            {activePanel === "effects" && (
              <EffectEditor
                effects={effects}
                onChange={onEffectsChange}
                roles={projectRoles}
              />
            )}
          </div>
          <div
            className={cn(
              "border-t px-4 py-3",
              isNle ? "border-border bg-panel" : "border-border",
            )}
          >
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={onDeleteNode}
            >
              删除节点
            </Button>
          </div>
        </div>
      ) : selectedEdge ? (
        <div className="flex flex-1 flex-col">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">连线属性</h3>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label className={cn(labelSm, "mb-2 block")}>分支标签</label>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {EDGE_LABELS.map((l) => (
                  <button
                    key={l || "__empty"}
                    type="button"
                    onClick={() => onEdgeLabelChange(selectedEdge.id, l)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[11px] transition-all",
                      selectedEdge.label === l
                        ? "border-brand bg-brand text-white shadow-sm"
                        : "border-border text-ink-muted hover:border-ink-muted/30 hover:bg-canvas",
                    )}
                  >
                    {l || "无"}
                  </button>
                ))}
              </div>
              <Input
                value={String(selectedEdge.label || "")}
                onChange={(e) =>
                  onEdgeLabelChange(selectedEdge.id, e.target.value)
                }
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
              onClick={() => onDeleteEdge(selectedEdge.id)}
            >
              删除连线
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn("flex flex-1 items-center justify-center p-6", isNle && "min-h-0 overflow-y-auto")}>
          <div className="space-y-4 text-center">
            <div
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl",
                isNle ? "bg-panel-raised text-accent-soft" : "bg-brand/5 text-brand",
              )}
            >
              <Clapperboard className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div>
              <p className={cn("text-sm font-medium", isNle ? "text-ink" : "text-ink")}>
                {isNle ? "检查器" : "叙事画布"}
              </p>
              <p className={cn("mt-1 text-xs", isNle ? "text-ink-faint" : "text-ink-muted")}>
                {isNle ? "从左侧选择 Beat 开始剪辑" : "点击节点编辑属性"}
              </p>
            </div>
            {!isNle && (
            <div className="space-y-2 rounded-xl bg-canvas p-4 text-left text-[11px] text-ink-muted">
              <p>
                <strong>对话节点</strong> — 角色台词，连线分支
              </p>
              <p>
                <strong>锚点事件</strong> — 剧情关键转折点
              </p>
              <p>
                <strong>条件</strong> — 控制节点可见性
              </p>
              <p>
                <strong>效果</strong> — 记忆/标志/状态变化
              </p>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { PanelTab };
