import { useEditorStore } from "@/shared/stores/editorStore";
import { ToggleInput } from "@/shared/components/ui";
import { layerPresets } from "@/shared/lib/presets";

export default function BondEditor() {
  const { draft, updateField } = useEditorStore();
  if (!draft) return null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        羁绊定义了角色与他人连接的方式——没有人是孤岛。
      </p>
      <ToggleInput
        label="对他人的基本态度"
        value={draft.bond.attitude_to_others || ""}
        onChange={(v) => updateField("bond.attitude_to_others", v)}
        options={layerPresets.bond.attitude_to_others}
        placeholder="开放信任 ↔ 防备疏离"
      />
      <ToggleInput
        label="亲密关系模式"
        value={draft.bond.intimate_pattern || ""}
        onChange={(v) => updateField("bond.intimate_pattern", v)}
        options={layerPresets.bond.intimate_pattern}
        placeholder="在亲密关系中如何表现"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="敌对关系模式"
        value={draft.bond.hostile_pattern || ""}
        onChange={(v) => updateField("bond.hostile_pattern", v)}
        options={layerPresets.bond.hostile_pattern}
        placeholder="面对冲突时的策略"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="群体中的角色"
        value={draft.bond.group_role || ""}
        onChange={(v) => updateField("bond.group_role", v)}
        options={layerPresets.bond.group_role}
        placeholder="领袖、独狼、粘合剂…"
      />
    </div>
  );
}
