import { useEditorStore } from "@/shared/stores/editorStore";
import { ToggleInput } from "@/shared/components/ui";
import { layerPresets } from "@/shared/lib/presets";

export default function DemeanorEditor() {
  const { draft, updateField } = useEditorStore();
  if (!draft) return null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        举止需要观察才能了解——相处后能注意到的行为模式。
      </p>
      <ToggleInput
        label="说话方式"
        value={draft.demeanor.speech_style || ""}
        onChange={(v) => updateField("demeanor.speech_style", v)}
        options={layerPresets.demeanor.speech_style}
        placeholder="语气、节奏、风格"
      />
      <ToggleInput
        label="习惯/癖好"
        value={draft.demeanor.habits || ""}
        onChange={(v) => updateField("demeanor.habits", v)}
        options={layerPresets.demeanor.habits}
        placeholder="下意识的小动作"
      />
      <ToggleInput
        label="常见反应"
        value={draft.demeanor.typical_reaction || ""}
        onChange={(v) => updateField("demeanor.typical_reaction", v)}
        options={layerPresets.demeanor.typical_reaction}
        placeholder="遇到事情时的第一反应"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="情绪外露程度"
        value={draft.demeanor.expressiveness || ""}
        onChange={(v) => updateField("demeanor.expressiveness", v)}
        options={layerPresets.demeanor.expressiveness}
        placeholder="内敛 ↔ 外放"
      />
    </div>
  );
}
