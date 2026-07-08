import { Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/shared/components/ui";

export interface GlossaryItem {
  id: string;
  term: string;
  definition: string;
}

interface GlossaryEditorProps {
  items: GlossaryItem[];
  onChange: (items: GlossaryItem[]) => void;
}

export default function GlossaryEditor({ items, onChange }: GlossaryEditorProps) {
  const add = () => {
    onChange([
      ...items,
      { id: `g${Date.now()}`, term: "", definition: "" },
    ]);
  };

  const patch = (id: string, field: "term" | "definition", value: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">
        玩家在对话中可用 <code className="rounded bg-surface px-1">[[术语]]</code>{" "}
        标注可点击名词；档案面板同步展示。
      </p>
      {items.map((item) => (
        <div
          key={item.id}
          className="space-y-2 rounded-xl border border-border bg-surface/50 p-3"
        >
          <div className="flex gap-2">
            <Input
              value={item.term}
              onChange={(e) => patch(item.id, "term", e.target.value)}
              placeholder="术语名"
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="shrink-0 rounded-lg p-2 text-ink-muted hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <Textarea
            value={item.definition}
            onChange={(e) => patch(item.id, "definition", e.target.value)}
            placeholder="解释说明"
            rows={2}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        添加术语
      </button>
    </div>
  );
}
