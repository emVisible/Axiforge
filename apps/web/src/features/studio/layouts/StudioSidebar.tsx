import StudioNavContent from "@/features/studio/layouts/StudioNavContent";

export default function StudioSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface/50 md:block">
      <StudioNavContent className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-4" />
    </aside>
  );
}
