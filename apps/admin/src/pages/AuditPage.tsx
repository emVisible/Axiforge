import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  EmptyState,
  ErrorDisplay,
  LoadingSpinner,
  PageHeader,
  Pagination,
} from "@axiforge/ui";
import { adminApi, type AuditLog, type PaginatedResponse } from "@/api/adminClient";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { useAdminList } from "@/hooks/useAdminList";

const PAGE_SIZE = 30;

const ACTION_FILTERS = [
  { value: "", label: "全部动作" },
  { value: "report.take_down", label: "举报下架" },
  { value: "report.dismiss", label: "举报驳回" },
  { value: "comment.hide", label: "评论隐藏" },
  { value: "project.status", label: "作品状态" },
  { value: "character.status", label: "角色状态" },
] as const;

export default function AuditPage() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data, loading, error, reload } = useAdminList<PaginatedResponse<AuditLog>>({
    queryKey: adminQueryKeys.auditLogs(page, action || undefined),
    fetcher: () =>
      adminApi.auditLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        action: action || undefined,
      }),
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="审计日志" description="所有敏感操作与管理员动作的留痕" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-xs text-ink-muted" htmlFor="audit-action-filter">
          动作筛选
        </label>
        <select
          id="audit-action-filter"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-ink"
        >
          {ACTION_FILTERS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} onRetry={reload} />}
      {data && !data.items.length && !error && (
        <EmptyState title="暂无审计记录" />
      )}
      {data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((log) => {
            const hasDetail = log.detail && Object.keys(log.detail).length > 0;
            const isOpen = expanded.has(log.id);
            return (
              <Card key={log.id} padding="sm">
                <button
                  type="button"
                  onClick={() => hasDetail && toggle(log.id)}
                  className={`flex w-full flex-wrap items-baseline gap-2 text-left ${
                    hasDetail ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  {hasDetail ? (
                    isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
                    )
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                  <span className="font-medium text-ink">{log.action}</span>
                  <span className="text-xs text-ink-muted">{log.actor}</span>
                  <span className="text-xs text-ink-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  {log.target_type && (
                    <span className="text-xs text-ink-muted">
                      · {log.target_type} / {log.target_id}
                    </span>
                  )}
                </button>
                {hasDetail && isOpen && (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 text-xs text-ink-muted">
                    {JSON.stringify(log.detail, null, 2)}
                  </pre>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {data && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
