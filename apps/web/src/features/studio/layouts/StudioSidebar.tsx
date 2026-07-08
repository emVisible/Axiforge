import StudioNavContent from "@/features/studio/layouts/StudioNavContent";
import { cn } from "@/shared/components/ui";

interface StudioSidebarProps {
  rail?: boolean;
}

export default function StudioSidebar({ rail = false }: StudioSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border bg-surface/80 transition-[width] duration-200 md:block",
        rail ? "w-12" : "w-56",
      )}
    >
      <StudioNavContent
        rail={rail}
        className={cn(
          "sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-3",
          rail ? "px-1" : "",
        )}
      />
    </aside>
  );
}
