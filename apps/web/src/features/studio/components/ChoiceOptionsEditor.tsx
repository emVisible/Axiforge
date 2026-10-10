import { useId } from "react";
import type { ChoiceOption } from "@axiforge/core";
import { cn, labelSm } from "@/shared/components/ui";

interface NodeOption {
  id: string;
  title: string;
}

interface ChoiceOptionsEditorProps {
  options: ChoiceOption[];
  nodes: NodeOption[];
  onChange: (next: ChoiceOption[]) => void;
}

export default function ChoiceOptionsEditor({
  options,
  nodes,
  onChange,
}: ChoiceOptionsEditorProps) {
  const groupLabelId = useId();
  const setOption = (optionIndex: number, nextOption: ChoiceOption) =>
    onChange(options.map((option, index) => (index === optionIndex ? nextOption : option)));

  return (
    <div role="group" aria-labelledby={groupLabelId} className="space-y-2">
      <div id={groupLabelId} className={cn(labelSm, "block")}>
        分支选项
      </div>
      {options.map((option, optionIndex) => (
        <div key={optionIndex} className="rounded-lg border border-border/70 bg-canvas/40 p-2">
          <div className="mb-1.5 flex items-center gap-1.5">
            <input
              className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs"
              aria-label={`选项 ${optionIndex + 1} 文本`}
              value={option.label}
              onChange={(event) => setOption(optionIndex, { ...option, label: event.target.value })}
              placeholder="选项文本"
            />
            <button
              type="button"
              onClick={() => onChange(options.filter((_option, index) => index !== optionIndex))}
              className="px-1 text-red-400 hover:text-red-600"
              aria-label="删除选项"
            >
              ✕
            </button>
          </div>
          <select
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-2xs text-ink-muted"
            aria-label={`选项 ${optionIndex + 1} 跳转目标`}
            value={option.to ?? ""}
            onChange={(event) => setOption(optionIndex, { ...option, to: event.target.value || null })}
          >
            <option value="">跳转：按标签匹配连线（默认）</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                跳转到：{node.title}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, { label: "" }])}
        className="rounded-lg border border-dashed border-border px-2.5 py-1 text-2xs text-ink-muted hover:border-brand hover:text-brand"
      >
        + 添加选项
      </button>
    </div>
  );
}