import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  ErrorDisplay,
  Input,
  PageHeader,
  Pagination,
  useToast,
  type DataTableColumn,
} from "@axiforge/ui";
import { adminApi, type AdminUser, type PaginatedResponse } from "@/api/adminClient";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { useAdminList } from "@/hooks/useAdminList";

const PAGE_SIZE = 20;

type PendingAction =
  | { type: "ban"; user: AdminUser }
  | { type: "reset_strikes"; user: AdminUser };

export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const creatorFilter = searchParams.get("creator_id");
  const [page, setPage] = useState(0);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const { data, loading, error, setError, reload } = useAdminList<PaginatedResponse<AdminUser>>({
    queryKey: adminQueryKeys.users(page, creatorFilter || undefined, q || undefined),
    fetcher: () =>
      adminApi.users({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        creator_id: creatorFilter || undefined,
        q: q || undefined,
      }),
  });
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const confirmAction = async (note?: string) => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.type === "ban") {
        await adminApi.banUser(pending.user.id, !pending.user.is_banned, note);
        showToast(pending.user.is_banned ? "已解封该用户" : "已封禁该用户", "success");
      } else {
        await adminApi.resetStrikes(pending.user.id, 0, note);
        showToast("已清零 strike", "success");
      }
      setPending(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<AdminUser>[] = [
    { key: "name", header: "显示名", render: (u) => u.display_name || u.creator_id },
    {
      key: "email",
      header: "邮箱",
      render: (u) => <span className="text-ink-muted">{u.email || "—"}</span>,
    },
    { key: "role", header: "角色", render: (u) => u.role },
    { key: "strikes", header: "Strike", render: (u) => u.strike_count },
    {
      key: "status",
      header: "状态",
      render: (u) =>
        u.is_banned ? (
          <Badge variant="rose">已封禁</Badge>
        ) : (
          <Badge variant="emerald">正常</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPending({ type: "ban", user: u })}>
            {u.is_banned ? "解封" : "封禁"}
          </Button>
          {u.strike_count > 0 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPending({ type: "reset_strikes", user: u })}
              >
                清零 Strike
              </Button>
              <Link
                to={`/violations?creator_id=${encodeURIComponent(u.creator_id)}`}
                className="inline-flex items-center rounded-md px-2 py-1 text-xs text-brand hover:underline"
              >
                违规记录
              </Link>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="用户管理"
        description={
          creatorFilter
            ? `筛选 creator_id：${creatorFilter}`
            : "查看用户档案，处理封禁与 strike"
        }
      />
      {!creatorFilter && (
        <div className="mb-3 max-w-xs">
          <Input
            placeholder="搜索邮箱 / 显示名 / creator_id…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
        </div>
      )}
      {error && <ErrorDisplay message={error} onRetry={reload} />}
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(u) => u.id}
        loading={loading}
        emptyTitle="暂无用户"
      />
      {data && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmAction}
        title={
          pending?.type === "ban"
            ? pending.user.is_banned
              ? "确认解封该用户？"
              : "确认封禁该用户？"
            : "确认清零 Strike？"
        }
        description={
          pending
            ? `目标用户：${pending.user.display_name || pending.user.creator_id}`
            : undefined
        }
        danger={pending?.type === "ban" && !pending.user.is_banned}
        withNote
        notePlaceholder="操作备注（可选，将写入审计日志）"
        loading={busy}
      />
    </div>
  );
}
