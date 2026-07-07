import {
  Clapperboard,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
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
} from "@/components/ui";
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
  script: Instruction[];
  onScriptChange: (s: Instruction[]) => void;
  projectRoles: ProjectRoleOption[];
  nodes: Node[];
  simTargets: SimTarget[];
  onPreviewScript: () => void;
  onDeleteNode: () => void;
  onEdgeLabelChange: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
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
  script,
  onScriptChange,
  projectRoles,
  nodes,
  simTargets,
  onPreviewScript,
  onDeleteNode,
  onEdgeLabelChange,
  onDeleteEdge,
}: NodeInspectorPanelProps) {
  return (
    <div className="flex w-80 flex-shrink-0 flex-col rounded-2xl border border-border bg-surface shadow-sm">
      {selectedNode ? (
        <>
          <div className="flex border-b border-border">
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
          <div className="border-t border-border px-4 py-3">
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={onDeleteNode}
            >
              删除节点
            </Button>
          </div>
        </>
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
                        : "border-border text-ink-muted hover:border-gray-300 hover:bg-canvas",
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
  );
}

export type { PanelTab };
