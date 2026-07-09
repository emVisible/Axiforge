import { Link } from "react-router";
import {
  Badge,
  Button,
  Card,
  ErrorDisplay,
  LoadingSpinner,
} from "@axiforge/ui";
import { ExternalLink } from "lucide-react";
import { adminApi } from "@/api/adminClient";
import ModerationContextSections from "@/components/ModerationContextSections";
import { useAdminList } from "@/hooks/useAdminList";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { targetTypeLabel, webDiscoverUrl } from "@/lib/moderation";

interface ContentInspectPanelProps {
  targetType: "project" | "character";
  targetId: string;
  title: string;
  onTakeDown?: () => void;
  busy?: boolean;
}

export default function ContentInspectPanel({
  targetType,
  targetId,
  title,
  onTakeDown,
  busy,
}: ContentInspectPanelProps) {
  const { data, loading, error, reload } = useAdminList({
    queryKey: adminQueryKeys.moderation(targetType, targetId),
    fetcher: () => adminApi.moderationContext(targetType, targetId),
  });

  if (loading) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center">
        <LoadingSpinner />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <ErrorDisplay message={error} onRetry={reload} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center border-dashed">
        <p className="text-sm text-ink-muted">选择一行以检视内容</p>
      </Card>
    );
  }

  const p = data.target_preview;
  const discoverUrl = webDiscoverUrl(p.discover_path);
  const statusVariant =
    p.content_status === "taken_down" || p.content_status === "hidden"
      ? "rose"
      : p.content_status === "visible" || p.content_status === "published"
        ? "emerald"
        : "amber";

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border bg-surface-raised px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{targetTypeLabel[targetType]}</Badge>
          {p.content_status && <Badge variant={statusVariant}>{p.content_status}</Badge>}
          {p.violation_count > 0 && (
            <Badge variant="amber">历史违规 {p.violation_count}</Badge>
          )}
        </div>
        <h2 className="mt-2 text-lg font-semibold text-ink">{title || p.title}</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {p.cover_image && (
          <div className="overflow-hidden rounded-lg border border-border bg-panel">
            <img src={p.cover_image} alt="" className="max-h-40 w-full object-cover" />
          </div>
        )}

        <section>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            内容摘要
          </p>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-canvas px-3 py-2 text-sm leading-relaxed text-ink">
            {p.excerpt || "（无摘要）"}
          </p>
        </section>

        <ModerationContextSections
          comments={data.related_comments}
          author={data.author_profile}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-raised px-4 py-3">
        {discoverUrl && (
          <a
            href={discoverUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
          >
            在主站打开
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {p.author_id && (
          <Link
            to={`/users?creator_id=${encodeURIComponent(p.author_id)}`}
            className="text-xs text-brand hover:underline"
          >
            作者档案
          </Link>
        )}
        {onTakeDown && p.content_status !== "taken_down" && (
          <Button
            size="sm"
            variant="danger"
            className="ml-auto"
            disabled={busy}
            onClick={onTakeDown}
          >
            强制下架
          </Button>
        )}
      </div>
    </Card>
  );
}
