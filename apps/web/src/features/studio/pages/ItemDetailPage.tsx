import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Trash2 } from "lucide-react";

import Shell from "@/shared/components/Shell";
import Toast from "@/shared/components/Toast";
import { itemApi } from "@/shared/api/editor";
import {
  BackLink,
  Badge,
  Button,
  CheckboxField,
  DetailEditPanel,
  DetailPanel,
  FormActions,
  Input,
  Select,
  TagEditor,
  Textarea,
} from "@/shared/components/ui";
import type { AssetItemResponse } from "@/shared/types/asset";

const ITEM_CATEGORIES = ["日常", "魔幻", "科技", "关键道具"];
const ITEM_RARITIES = ["普通", "稀有", "传说"];

const rarityVariant = (rarity: string) => {
  if (rarity === "传说") return "amber" as const;
  if (rarity === "稀有") return "blue" as const;
  return "default" as const;
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<AssetItemResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [effectInput, setEffectInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchItem = async () => {
    const data = await itemApi.get(id!);
    setItem(data);
  };
  useEffect(() => {
    fetchItem();
  }, [id]);

  const showToast = (m: string, t: "success" | "error" = "success") => {
    setToast({ message: m, type: t });
    setTimeout(() => setToast(null), 2500);
  };

  if (!item)
    return (
      <Shell>
        <p className="py-20 text-center text-sm text-ink-muted">加载中...</p>
      </Shell>
    );

  const openEdit = () => {
    setForm({
      ...item,
      effects: item.effects || [],
      mechanism_tags: item.mechanism_tags || [],
    });
    setEditing(true);
  };

  const addEffect = () => {
    const v = effectInput.trim();
    if (v && !(form.effects || []).includes(v)) {
      setForm((p) => ({ ...p, effects: [...(p.effects || []), v] }));
      setEffectInput("");
    }
  };
  const addTag = () => {
    const v = tagInput.trim();
    if (v && !(form.mechanism_tags || []).includes(v)) {
      setForm((p) => ({
        ...p,
        mechanism_tags: [...(p.mechanism_tags || []), v],
      }));
      setTagInput("");
    }
  };

  const save = async () => {
    await itemApi.update(id!, form);
    setItem({ ...item, ...form });
    setEditing(false);
    showToast("已保存");
  };

  const handleDelete = async () => {
    if (!confirm("删除？")) return;
    await itemApi.delete(id!);
    navigate("/studio/items");
  };

  return (
    <Shell>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <BackLink to="/studio/items">道具列表</BackLink>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
          onClick={handleDelete}
        >
          删除
        </Button>
      </div>

      {editing ? (
        <DetailEditPanel>
          <Input
            label="名称"
            value={form.name || ""}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Textarea
            label="描述"
            value={form.description || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="分类"
              value={form.category || "日常"}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              label="稀有度"
              value={form.rarity || "普通"}
              onChange={(e) =>
                setForm((p) => ({ ...p, rarity: e.target.value }))
              }
            >
              {ITEM_RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <TagEditor
            label="机制标签"
            tags={form.mechanism_tags || []}
            input={tagInput}
            onInputChange={setTagInput}
            onAdd={addTag}
            onRemove={(t) =>
              setForm((p) => ({
                ...p,
                mechanism_tags: (p.mechanism_tags || []).filter(
                  (x: string) => x !== t,
                ),
              }))
            }
            placeholder="如：骰子、好感度"
            variant="amber"
          />
          <TagEditor
            label="效果标签"
            tags={form.effects || []}
            input={effectInput}
            onInputChange={setEffectInput}
            onAdd={addEffect}
            onRemove={(e) =>
              setForm((p) => ({
                ...p,
                effects: (p.effects || []).filter((x: string) => x !== e),
              }))
            }
            placeholder="如：治疗、伤害"
            variant="brand"
          />
          <CheckboxField
            checked={!!form.is_public}
            onChange={(checked) =>
              setForm((p) => ({ ...p, is_public: checked }))
            }
            label="公开到 Discover"
          />
          <FormActions onSave={save} onCancel={() => setEditing(false)} />
        </DetailEditPanel>
      ) : (
        <DetailPanel
          title={item.name}
          description={item.description || "暂无描述"}
          onEdit={openEdit}
          editLabel="编辑"
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="default">{item.category}</Badge>
            <Badge variant={rarityVariant(item.rarity)}>{item.rarity}</Badge>
            <Badge variant={item.is_public ? "emerald" : "default"}>
              {item.is_public ? "公开" : "私有"}
            </Badge>
            {(item.ref_count ?? 0) > 0 && (
              <Badge variant="default" size="sm">
                {item.ref_count} 个剧本引用
              </Badge>
            )}
          </div>
          {(item.mechanism_tags?.length || 0) > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {item.mechanism_tags.map((t) => (
                <Badge key={t} variant="amber" size="sm">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {item.effects.map((e) => (
              <Badge key={e} variant="brand" size="sm">
                {e}
              </Badge>
            ))}
          </div>
        </DetailPanel>
      )}
    </Shell>
  );
}
