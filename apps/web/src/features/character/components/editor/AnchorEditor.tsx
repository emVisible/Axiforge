import { useState } from "react";
import { useEditorStore } from "@/shared/stores/editorStore";
import { Badge, ImageUpload, Input, ToggleInput } from "@/shared/components/ui";
import TemplateSelector from "../TemplateSelector";
import { generateTagColor, layerPresets } from "@/shared/lib/presets";

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
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4 sm:flex-row sm:items-stretch">
        {onImageChange && (
          <div className="h-32 w-full shrink-0 sm:h-auto sm:w-36">
            <ImageUpload
              fill
              value={imagePath || ""}
              onChange={onImageChange}
              className="h-full"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <Input
            label="姓名/称谓"
            required
            value={draft.anchor.name}
            onChange={(e) => updateField("anchor.name", e.target.value)}
            placeholder="角色如何称呼"
          />
          {onPublicChange !== undefined && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => onPublicChange(e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand/30"
              />
              公开到角色大厅
            </label>
          )}
        </div>
      </div>

      <TemplateSelector />

      <div className="border-t border-border pt-5">
        <p className="text-xs text-ink-muted mb-4">
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
        <label className="block text-sm font-medium text-ink mb-1.5">
          标签
        </label>
        <div className="mb-2 flex items-center gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="输入标签后按回车"
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink transition-colors hover:bg-panel"
          >
            添加
          </button>
        </div>
        {tagInput.trim() && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-ink-muted">预览：</span>
            <span
              className="rounded-full border px-2.5 py-1 text-xs font-medium"
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
