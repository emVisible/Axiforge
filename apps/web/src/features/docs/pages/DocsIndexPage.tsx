import DocsMarkdown from "@/features/docs/components/DocsMarkdown";
import { getDocReadme } from "@/features/docs/docRegistry";

export default function DocsIndexPage() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <DocsMarkdown source={getDocReadme()} />
    </div>
  );
}
