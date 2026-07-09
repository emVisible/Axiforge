import { useCallback, useEffect, useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";

import { ginkgoApi, type AchievementDef } from "@/shared/api/ginkgo";
import { Button, CheckboxField, Input, Textarea, cn, labelSm } from "@/shared/components/ui";

interface AchievementPanelProps {
  projectId: string;
}

const CONDITION_PRESETS = [
  { label: "完成节点", type: "node_completed" as const },
  { label: "记忆变量", type: "memory" as const },
  { label: "标志", type: "flag" as const },
  { label: "手动授予", type: "manual" as const },
];

export default function AchievementPanel({ projectId }: AchievementPanelProps) {
  const [items, setItems] = useState<AchievementDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ginkgoApi.list(projectId);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    setBusy(true);
    try {
      const key = `ach_${Date.now().toString(36)}`;
      await ginkgoApi.create(projectId, {
        key,
        title: "新成就",
        description: "",
        condition: { type: "node_completed", value: "" },
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const save = async (item: AchievementDef, patch: Partial<AchievementDef>) => {
    await ginkgoApi.update(item.id, patch);
    await refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("删除此成就？")) return;
    await ginkgoApi.remove(id);
    await refresh();
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-ink-muted">
          项目成就：Beat 完成时按条件自动解锁，也可用于分支 gating。
        </p>
        <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} loading={busy} onClick={add}>
          添加
        </Button>
      </div>

      {loading && <p className="text-xs text-ink-faint">加载中…</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-ink-muted">
          还没有成就定义
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[10px] font-medium text-brand">
              <Star className="h-3 w-3" />
              {item.key}
            </span>
            <button
              type="button"
              onClick={() => void remove(item.id)}
              className="text-ink-muted hover:text-danger"
              aria-label="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input
            label="标题"
            value={item.title}
            onChange={(e) => void save(item, { title: e.target.value })}
          />
          <Textarea
            label="描述"
            rows={2}
            value={item.description}
            onChange={(e) => void save(item, { description: e.target.value })}
          />
          <div>
            <label className={cn(labelSm, "mb-1 block")}>解锁条件</label>
            <select
              className="w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-xs"
              value={(item.condition as { type?: string })?.type ?? "node_completed"}
              onChange={(e) => {
                const type = e.target.value;
                const condition =
                  type === "manual"
                    ? {}
                    : type === "node_completed"
                      ? { type, value: "" }
                      : { type, key: "", operator: "eq", value: true };
                void save(item, { condition });
              }}
            >
              {CONDITION_PRESETS.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {(item.condition as { type?: string })?.type === "node_completed" && (
            <Input
              label="Beat ID"
              value={String((item.condition as { value?: string }).value ?? "")}
              onChange={(e) =>
                void save(item, {
                  condition: { type: "node_completed", value: e.target.value },
                })
              }
              placeholder="节点 UUID"
            />
          )}
          <CheckboxField
            checked={item.is_public}
            onChange={(checked) => void save(item, { is_public: checked })}
            label="公开到作者页徽章"
          />
        </div>
      ))}
    </div>
  );
}
