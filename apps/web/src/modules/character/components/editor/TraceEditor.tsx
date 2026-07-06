import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { Badge, Input, ToggleInput } from "@/components/ui";
import { layerPresets } from "@/lib/presets";

export default function TraceEditor() {
  const { draft, updateField } = useEditorStore();
  const [newEvent, setNewEvent] = useState("");
  if (!draft) return null;

  const addEvent = () => {
    const trimmed = newEvent.trim();
    if (!trimmed) return;
    updateField("trace.key_events", [...draft.trace.key_events, trimmed]);
    setNewEvent("");
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400">
        轨迹解释了「为什么TA会变成这样」——过去塑造现在。
      </p>
      <ToggleInput
        label="出身背景"
        value={draft.trace.background || ""}
        onChange={(v) => updateField("trace.background", v)}
        options={layerPresets.trace.background}
        placeholder="家庭、阶层、成长环境"
        type="textarea"
        rows={2}
      />
      <ToggleInput
        label="转折点"
        value={draft.trace.turning_point || ""}
        onChange={(v) => updateField("trace.turning_point", v)}
        options={layerPresets.trace.turning_point}
        placeholder="什么让TA成为现在的TA"
        type="textarea"
        rows={2}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          关键事件
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {draft.trace.key_events.map((event, i) => (
            <Badge
              key={i}
              variant="amber"
              onRemove={() =>
                updateField(
                  "trace.key_events",
                  draft.trace.key_events.filter((_, j) => j !== i),
                )
              }
            >
              {event}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addEvent())
            }
            placeholder="添加关键事件"
          />
          <button
            onClick={addEvent}
            className="px-4 py-2.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
