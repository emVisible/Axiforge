import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  DataTable,
  ErrorDisplay,
  PageHeader,
  Pagination,
  type DataTableColumn,
} from "@axiforge/ui";
import { adminApi, type AdminViolation, type PaginatedResponse } from "@/api/adminClient";
import { useAdminList } from "@/hooks/useAdminList";

const PAGE_SIZE = 30;

export default function ViolationsPage() {
  const [searchParams] = useSearchParams();
  const creatorFilter = searchParams.get("creator_id");
  const [page, setPage] = useState(0);

  const { data, loading, error, reload } = useAdminList<PaginatedResponse<AdminViolation>>({
    fetcher: () =>
      adminApi.violations(creatorFilter || undefined, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    deps: [creatorFilter, page],
  });

  const columns: DataTableColumn<AdminViolation>[] = [
    {
      key: "time",
      header: "时间",
      className: "whitespace-nowrap text-xs text-ink-muted",
      render: (v) => new Date(v.created_at).toLocaleString(),
    },
    {
      key: "subject",
      header: "对象",
      render: (v) => (
        <>
          <span className="text-xs text-ink-muted">{v.subject_type}</span>
          <span className="ml-1 font-mono text-xs">{v.subject_id}</span>
        </>
      ),
    },
    {
      key: "author",
      header: "作者",
      className: "font-mono text-xs text-ink-muted",
      render: (v) => v.author_id || "—",
    },
    { key: "clause", header: "条款", render: (v) => v.clause },
    { key: "actor", header: "处理人", className: "text-ink-muted", render: (v) => v.actor },
    {
      key: "note",
      header: "备注",
      className: "max-w-xs truncate text-ink-muted",
      render: (v) => v.note || "—",
    },
  ];

  return (
    <div>
      <PageHeader
        title="违规记录"
        description="内容下架等操作产生的 strike 关联记录"
        meta={
          creatorFilter && (
            <span className="text-sm text-ink-muted">
              筛选作者：<span className="font-mono text-xs">{creatorFilter}</span>
              <Link to="/violations" className="ml-2 text-brand hover:underline">
                清除筛选
              </Link>
            </span>
          )
        }
      />
      {error && <ErrorDisplay message={error} onRetry={reload} />}
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(v) => v.id}
        loading={loading}
        emptyTitle="暂无违规记录"
      />
      {data && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
