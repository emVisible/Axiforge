import { Suspense, lazy } from "react";
import StudioModeFallback from "../../components/StudioModeFallback";

const LazyWriterStudioView = lazy(() => import("@/features/writer/components/WriterStudioView"));
import type { ProjectEditor } from "../../hooks/useProjectEditor";

export default function WriterWorkspace({ editor }: { editor: ProjectEditor }) {
  const {
    axsSource,
    projectRoles,
    roleNames,
    setAxsSource,
    setAxsDirty,
    saveWriter,
    saving,
    axsDirty,
    writerScrollLine,
    setWriterScrollLine,
    openBeatInFlow,
  } = editor;

  return (
<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
<Suspense fallback={<StudioModeFallback />}>
<LazyWriterStudioView
  source={axsSource}
  roles={Object.fromEntries(
    projectRoles.map((r) => [r.name, r.characterRefId]),
  )}
  roleNames={roleNames}
  onChange={(next) => {
    setAxsSource(next);
    setAxsDirty(true);
  }}
  onSave={saveWriter}
  saving={saving}
  dirty={axsDirty}
  scrollToLine={writerScrollLine}
  onBeatSelect={(beat) => setWriterScrollLine(beat.line)}
  onOpenInFlow={openBeatInFlow}
/>
</Suspense>
</div>
      
  );
}
