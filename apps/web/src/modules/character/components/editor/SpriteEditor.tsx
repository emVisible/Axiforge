import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { ImageUpload, Input } from "@/components/ui";

// 常用表情预设，点选即可快速新增一档差分
const EXPRESSION_PRESETS = [
  "neutral",
  "smile",
  "happy",
  "sad",
  "angry",
  "surprised",
  "shy",
  "cry",
];

/**
 * 立绘 / 表情差分编辑（桥5·D3）
 *
 * 维护 character_data.sprites = { 表情key: 图片路径 }。
 * 演出脚本 show(char, expression) 命中 key 即换对应差分立绘。
 */
export default function SpriteEditor() {
  const { draft, updateField } = useEditorStore();
  const [newKey, setNewKey] = useState("");
  if (!draft) return null;

  const sprites: Record<string, string> = draft.sprites || {};
  const entries = Object.entries(sprites);

  const setSprites = (next: Record<string, string>) =>
    updateField("sprites", next);

  const addKey = (key: string) => {
    const k = key.trim();
    if (!k || sprites[k] !== undefined) return;
    setSprites({ ...sprites, [k]: "" });
    setNewKey("");
  };

  const setImage = (key: string, url: string) =>
    setSprites({ ...sprites, [key]: url });

  const rename = (oldKey: string, nextKey: string) => {
    const k = nextKey.trim();
    if (!k || k === oldKey || sprites[k] !== undefined) return;
    const next: Record<string, string> = {};
    for (const [kk, vv] of Object.entries(sprites))
      next[kk === oldKey ? k : kk] = vv;
    setSprites(next);
  };

  const remove = (key: string) => {
    const next = { ...sprites };
    delete next[key];
    setSprites(next);
  };

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl bg-blue-50/60 px-3 py-2.5 text-xs leading-relaxed text-blue-700">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span>
          为角色上传不同表情的立绘差分。演出脚本里
          <code className="mx-1 rounded bg-white px-1">立绘进场</code>
          选择的表情将直连这里的图片；未命中时回退到角色主立绘。
        </span>
      </p>

      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {entries.map(([key, url]) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-3"
            >
              <ImageUpload value={url} onChange={(u) => setImage(key, u)} />
              <input
                value={key}
                onChange={(e) => rename(key, e.target.value)}
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-center text-xs"
                aria-label="表情名"
              />
              <button
                type="button"
                onClick={() => remove(key)}
                className="text-[11px] text-gray-400 hover:text-red-500"
              >
                删除该差分
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="新表情名，如 smile"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addKey(newKey);
              }
            }}
          />
          <button
            type="button"
            onClick={() => addKey(newKey)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand/10 px-3 py-2 text-xs font-medium text-brand hover:bg-brand/20"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXPRESSION_PRESETS.filter((p) => sprites[p] === undefined).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addKey(p)}
              className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-500 hover:border-brand hover:text-brand"
            >
              + {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
