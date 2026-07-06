import { useEditorStore } from "@/stores/editorStore";
import { ToggleInput } from "@/components/ui";
import { layerPresets } from "@/lib/presets";

export default function ContourEditor() {
  const { draft, updateField } = useEditorStore();
  if (!draft) return null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400">
        轮廓是角色最外层的信息——任何人都能一眼看到的。
      </p>
      <ToggleInput
        label="外貌特征"
        value={draft.contour.appearance || ""}
        onChange={(v) => updateField("contour.appearance", v)}
        options={layerPresets.contour.appearance}
        placeholder="发色、体型、标志特征"
      />
      <ToggleInput
        label="年龄/时代"
        value={draft.contour.age_era || ""}
        onChange={(v) => updateField("contour.age_era", v)}
        options={layerPresets.contour.age_era}
        placeholder="如「二十出头」"
      />
      <ToggleInput
        label="身份/职业"
        value={draft.contour.identity || ""}
        onChange={(v) => updateField("contour.identity", v)}
        options={layerPresets.contour.identity}
        placeholder="社会角色或职业"
      />
      <ToggleInput
        label="第一印象"
        value={draft.contour.first_impression || ""}
        onChange={(v) => updateField("contour.first_impression", v)}
        options={layerPresets.contour.first_impression}
        placeholder="陌生人见到TA的第一感觉"
        type="textarea"
        rows={2}
      />
    </div>
  );
}
