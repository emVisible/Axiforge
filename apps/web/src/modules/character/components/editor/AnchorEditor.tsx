import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { Badge, ImageUpload, Input, ToggleInput } from "@/components/ui";
import TemplateSelector from "../TemplateSelector";
import { generateTagColor, layerPresets } from "@/lib/presets";

interface AnchorEditorProps {
  imagePath?: string;
  onImageChange?: (path: string) => void;
  isPublic?: boolean;
  onPublicChange?: (v: boolean) => void;
}

export default function AnchorEditor({
  imagePath,
  onImageChange,
  isPublic,
  onPublicChange,
}: AnchorEditorProps) {
  const { draft, updateField } = useEditorStore();
  const [tagInput, setTagInput] = useState("");
  if (!draft) return null;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !draft.anchor.tags.includes(t)) {
      updateField("anchor.tags", [...draft.anchor.tags, t]);
      setTagInput("");
    }
  };
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-5 p-4 bg-gray-50 rounded-xl">
        {onImageChange && (
          <ImageUpload value={imagePath || ""} onChange={onImageChange} />
        )}
        <div className="flex-1 space-y-3">
          <Input
            label="姓名/称谓"
            required
            value={draft.anchor.name}
            onChange={(e) => updateField("anchor.name", e.target.value)}
            placeholder="角色如何称呼"
          />
          {onPublicChange !== undefined && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => onPublicChange(e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              公开到角色大厅
            </label>
          )}
        </div>
      </div>

      <TemplateSelector />

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs text-gray-400 mb-4">
          逐层设定（预设选择或自定义输入）
        </p>
      </div>

      <ToggleInput
        label="概括"
        value={draft.anchor.essence}
        onChange={(v) => updateField("anchor.essence", v)}
        options={layerPresets.anchor.essence}
        placeholder="一句话概括角色 *"
        type="textarea"
        rows={2}
      />

      <ToggleInput
        label="描述"
        value={draft.anchor.summary || ""}
        onChange={(v) => updateField("anchor.summary", v)}
        options={[]}
        placeholder="卡片上显示的简短描述"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          标签
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="输入标签后按回车"
          />
          {tagInput.trim() && (
            <div className="flex items-center gap-2 mt-1 mb-2">
              <span className="text-xs text-gray-400">预览：</span>
              <span
                className="px-2.5 py-1 text-xs font-medium rounded-full border"
                style={{
                  color: generateTagColor(tagInput.trim()),
                  borderColor: generateTagColor(tagInput.trim()) + "40",
                  backgroundColor: generateTagColor(tagInput.trim()) + "10",
                }}
              >
                {tagInput.trim()}
              </span>
            </div>
          )}
          <button
            onClick={addTag}
            className="px-4 py-2.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {draft.anchor.tags.map((tag, i) => (
            <Badge
              key={i}
              variant="blue"
              onRemove={() =>
                updateField(
                  "anchor.tags",
                  draft.anchor.tags.filter((_, j) => j !== i),
                )
              }
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <ToggleInput
        label="人生主题"
        value={draft.anchor.theme || ""}
        onChange={(v) => updateField("anchor.theme", v)}
        options={layerPresets.anchor.theme}
        placeholder="「救赎」「成长」..."
      />
      <ToggleInput
        label="核心信念"
        value={draft.anchor.core_belief || ""}
        onChange={(v) => updateField("anchor.core_belief", v)}
        options={layerPresets.anchor.core_belief}
        placeholder="TA不可动摇地相信什么"
        type="textarea"
        rows={2}
      />
    </div>
  );
}
