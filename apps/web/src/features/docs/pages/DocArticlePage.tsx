import { Link, useParams } from "react-router";
import { ErrorDisplay } from "@/shared/components/ui";
import DocsMarkdown from "@/features/docs/components/DocsMarkdown";
import { getDocBySlug } from "@/features/docs/docRegistry";
import { routes } from "@/shared/lib/routes";

export default function DocArticlePage() {
  const { "*": splat } = useParams();
  const slug = (splat ?? "").replace(/\/$/, "");
  const content = getDocBySlug(slug);

  if (!content) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8">
        <ErrorDisplay message="未找到该文档页面" />
        <Link to={routes.docs} className="mt-4 inline-block text-sm text-brand hover:underline">
          返回文档首页
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <DocsMarkdown source={content} />
    </div>
  );
}
