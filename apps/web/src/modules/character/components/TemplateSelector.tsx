import { characterTemplates, type CharacterTemplate } from "@/lib/presets";
import { useEditorStore } from "@/stores/editorStore";

export default function TemplateSelector() {
  const { setDraft } = useEditorStore();

  const applyTemplate = (template: CharacterTemplate) => {
    const draft = useEditorStore.getState().draft;
    if (!draft) return;

    const newDraft = JSON.parse(JSON.stringify(draft));

    for (const [layerKey, fields] of Object.entries(template.data)) {
      if (newDraft[layerKey]) {
        for (const [fieldKey, value] of Object.entries(fields)) {
          if (newDraft[layerKey][fieldKey] !== undefined) {
            newDraft[layerKey][fieldKey] = value;
          }
        }
      }
    }

    if (template.data.anchor?.name && newDraft.anchor) {
      newDraft.anchor.name = template.data.anchor.name;
    }

    setDraft(newDraft);
  };

  return (
    <div className="mb-4">
      <p className="mb-3 text-sm text-ink-muted">
        从模板开始，快速填充六层设定。之后可以逐层调整。
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {characterTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => applyTemplate(t)}
            className="group rounded-xl border border-border p-3 text-left transition-all hover:border-brand/30 hover:bg-brand-muted/40"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-muted text-xs font-semibold text-brand">
              {t.name.slice(0, 1)}
            </div>
            <h4 className="text-sm font-medium text-ink group-hover:text-brand">
              {t.name}
            </h4>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-muted">
              {t.summary}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
