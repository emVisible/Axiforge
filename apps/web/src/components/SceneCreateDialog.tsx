
import { useState } from "react";
import type { AssetSceneCreate } from "@/types/asset";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssetSceneCreate) => void;
  loading?: boolean;
}

export default function SceneCreateDialog({
  isOpen,
  onClose,
  onCreate,
  loading,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    atmosphere: "",
    era: "",
    world_setting: "",
    rules: "",
    tagInput: "",
    tags: [] as string[],
  });

  if (!isOpen) return null;

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t))
      setForm({ ...form, tags: [...form.tags, t], tagInput: "" });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onCreate({
      name: form.name.trim(),
      description: form.description,
      location: form.location || undefined,
      atmosphere: form.atmosphere || undefined,
      era: form.era || undefined,
      world_setting: form.world_setting || undefined,
      rules: form.rules || undefined,
      tags: form.tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">新建场景</h3>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="场景名称"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="场景描述"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="地点"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
            />
            <input
              value={form.era}
              onChange={(e) => setForm({ ...form, era: e.target.value })}
              placeholder="时代"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
            />
          </div>
          <input
            value={form.atmosphere}
            onChange={(e) => setForm({ ...form, atmosphere: e.target.value })}
            placeholder="氛围（如：阴森、温暖、肃杀）"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
          />
          <input
            value={form.world_setting}
            onChange={(e) =>
              setForm({ ...form, world_setting: e.target.value })
            }
            placeholder="所属世界观"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
          />
          <input
            value={form.rules}
            onChange={(e) => setForm({ ...form, rules: e.target.value })}
            placeholder="场景规则"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
          />
          <div>
            <div className="flex gap-2 mb-1">
              <input
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="添加标签"
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473]"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs bg-[#3b3473]/5 text-[#3b3473] rounded-full flex items-center gap-1"
                >
                  {t}
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        tags: form.tags.filter((x) => x !== t),
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
