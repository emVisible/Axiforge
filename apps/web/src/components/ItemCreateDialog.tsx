
import { useState } from "react";
import type { AssetItemCreate } from "@/types/asset";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">新建道具</h3>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="道具名称"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
            >
              {ITEM_RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex gap-2 mb-1">
              <input
                value={form.effectInput}
                onChange={(e) =>
                  setForm({ ...form, effectInput: e.target.value })
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addEffect())
                }
                placeholder="添加效果标签"
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
              />
              <button
                onClick={addEffect}
                className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.effects.map((e) => (
                <span
                  key={e}
                  className="px-2 py-0.5 text-xs bg-[#3b3473]/5 text-[#3b3473] rounded-full flex items-center gap-1"
                >
                  {e}
                  <button
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
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || loading}
              className="px-4 py-2 text-sm bg-[#3b3473] text-white rounded-lg hover:bg-[#4a4380] disabled:opacity-50"
            >
              {loading ? "创建中..." : "创建"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
