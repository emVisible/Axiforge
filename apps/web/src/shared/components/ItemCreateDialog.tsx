
import { useState } from "react";
import type { AssetItemCreate } from "@/shared/types/asset";
import {
  Button,
  Input,
  Modal,
  ModalActions,
  Select,
  Textarea,
} from "@/shared/components/ui";

const ITEM_CATEGORIES = ["日常", "魔幻", "科技", "关键道具"];
const ITEM_RARITIES = ["普通", "稀有", "传说"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssetItemCreate) => void;
  loading?: boolean;
}

export default function ItemCreateDialog({
  isOpen,
  onClose,
  onCreate,
  loading,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "日常",
    rarity: "普通",
    effectInput: "",
    effects: [] as string[],
  });

  const addEffect = () => {
    const e = form.effectInput.trim();
    if (e && !form.effects.includes(e))
      setForm({ ...form, effects: [...form.effects, e], effectInput: "" });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onCreate({
      name: form.name.trim(),
      description: form.description,
      category: form.category,
      rarity: form.rarity,
      effects: form.effects,
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="新建道具"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "创建中..." : "创建"}
          loading={loading}
          disabled={!form.name.trim()}
        />
      }
    >
      <div className="space-y-3">
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="道具名称"
        />
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="描述"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={form.rarity}
            onChange={(e) => setForm({ ...form, rarity: e.target.value })}
          >
            {ITEM_RARITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-1 flex gap-2">
            <Input
              value={form.effectInput}
              onChange={(e) =>
                setForm({ ...form, effectInput: e.target.value })
              }
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addEffect())
              }
              placeholder="添加效果标签"
              className="text-xs"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addEffect}>
              添加
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {form.effects.map((e) => (
              <span
                key={e}
                className="flex items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-xs text-brand"
              >
                {e}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      effects: form.effects.filter((x) => x !== e),
                    })
                  }
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
