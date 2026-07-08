import { useEditorStore } from "@/shared/stores/editorStore";
import { ToggleInput } from "@/shared/components/ui";
import { layerPresets } from "@/shared/lib/presets";

export default function PsycheEditor() {
  const { draft, updateField } = useEditorStore();
  if (!draft) return null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        内心需要深入交往才能触及——不是TA说什么，而是TA为什么这么说。
      </p>
      <ToggleInput
        label="深层欲望"
        value={draft.psyche.desire || ""}
        onChange={(v) => updateField("psyche.desire", v)}
        options={layerPresets.psyche.desire}
        placeholder="真正想要什么"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="核心恐惧"
        value={draft.psyche.fear || ""}
        onChange={(v) => updateField("psyche.fear", v)}
        options={layerPresets.psyche.fear}
        placeholder="最怕什么"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="内在矛盾"
        value={draft.psyche.conflict || ""}
        onChange={(v) => updateField("psyche.conflict", v)}
        options={layerPresets.psyche.conflict}
        placeholder="什么让TA纠结"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="自我认知"
        value={draft.psyche.self_perception || ""}
        onChange={(v) => updateField("psyche.self_perception", v)}
        options={layerPresets.psyche.self_perception}
        placeholder="TA眼中的自己"
        type="textarea"
        rows={2}
      />
    </div>
  );
}
