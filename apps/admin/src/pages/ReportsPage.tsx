import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorDisplay,
  LoadingSpinner,
  PageHeader,
  useToast,
} from "@axiforge/ui";
import { adminApi, type AdminReport } from "@/api/adminClient";
import { useAdminList } from "@/hooks/useAdminList";

interface PendingAction {
  report: AdminReport;
  action: "dismiss" | "take_down";
}

export default function ReportsPage() {
  const { data: items, loading, error, setError, reload } = useAdminList<AdminReport[]>({
    fetcher: () => adminApi.reports("pending"),
  });
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const { showToast } = useToast();

  const resolve = async (note?: string) => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminApi.resolveReport(pending.report.id, pending.action, note);
      showToast(pending.action === "take_down" ? "已下架并记录违规" : "已驳回该举报", "success");
      setPending(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="审核队列" description="处理用户提交的内容举报" />
      {loading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} onRetry={reload} />}
      {items && !items.length && !error && (
        <EmptyState title="暂无待审举报" description="所有举报都已处理完毕" />
      )}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="amber">{r.target_type}</Badge>
                    <span className="font-mono text-xs text-ink-muted">{r.target_id}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink">{r.reason}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPending({ report: r, action: "dismiss" })}
                  >
                    驳回
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setPending({ report: r, action: "take_down" })}
                  >
                    下架
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={resolve}
        title={pending?.action === "take_down" ? "确认下架该内容？" : "确认驳回该举报？"}
        description={
          pending?.action === "take_down"
            ? "下架会同时记录一次违规，并给作者累计一次 strike。"
            : "驳回后该举报将标记为已处理。"
        }
        confirmLabel={pending?.action === "take_down" ? "确认下架" : "确认驳回"}
        danger={pending?.action === "take_down"}
        withNote
        notePlaceholder="处理备注（可选，将写入审计日志）"
        loading={busy}
      />
    </div>
  );
}
