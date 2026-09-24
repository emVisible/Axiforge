import { characterTemplates, type CharacterTemplate } from "@/shared/lib/presets";
import { useEditorStore } from "@/shared/stores/editorStore";

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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {characterTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t)}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-all hover:border-brand/30 hover:bg-brand-muted/40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-xs font-semibold text-brand">
              {t.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-ink group-hover:text-brand">
                {t.name}
              </h4>
              <p className="mt-0.5 line-clamp-1 text-2xs text-ink-muted">
                {t.summary}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
