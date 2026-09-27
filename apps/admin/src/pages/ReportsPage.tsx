import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorDisplay,
  LoadingSpinner,
  PageHeader,
  SegmentedControl,
  useToast,
} from "@axiforge/ui";
import {
  adminApi,
  type AdminCommentSnippet,
  type AdminReport,
  type AuthorModerationProfile,
  type AutoJudgement,
} from "@/api/adminClient";
import ModerationPreviewPanel from "@/components/ModerationPreviewPanel";
import { useAdminInvalidation, useAdminList } from "@/hooks/useAdminList";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import {
  countSiblingReports,
  formatReportTime,
  reportSummaryLine,
  reportTargetKey,
  targetTypeLabel,
} from "@/lib/moderation";

type ReportTab = "pending" | "resolved" | "dismissed";

interface PendingAction {
  report: AdminReport;
  action: "dismiss" | "take_down";
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: items, loading, error, setError, reload } = useAdminList<AdminReport[]>({
    queryKey: adminQueryKeys.reports(tab),
    fetcher: () => adminApi.reports(tab),
  });
  const { invalidateStats } = useAdminInvalidation();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [contextComments, setContextComments] = useState<AdminCommentSnippet[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorModerationProfile | null>(null);
  const [autoJudgement, setAutoJudgement] = useState<AutoJudgement | null>(null);
  const [hidingCommentId, setHidingCommentId] = useState<string | null>(null);
  const { showToast } = useToast();

  const selected = items?.find((r) => r.id === selectedId) ?? items?.[0] ?? null;

  const siblingCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of items ?? []) {
      const key = reportTargetKey(r);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const siblingTotal = selected ? countSiblingReports(items ?? [], selected) : 0;

  const siblingReports = useMemo(() => {
    if (!selected || !items?.length) return [];
    const key = reportTargetKey(selected);
    return items.filter((r) => reportTargetKey(r) === key);
  }, [items, selected]);

  useEffect(() => {
    if (items?.length && !items.some((r) => r.id === selectedId)) {
      setSelectedId(items[0].id);
    }
    if (!items?.length) setSelectedId(null);
  }, [items, selectedId]);

  const loadContext = useCallback(async (report: AdminReport | null) => {
    if (!report) {
      setContextComments([]);
      setAuthorProfile(null);
      setAutoJudgement(null);
      return;
    }
    try {
      const ctx = await adminApi.moderationContext(report.target_type, report.target_id);
      setContextComments(ctx.related_comments);
      setAuthorProfile(ctx.author_profile);
      setAutoJudgement(ctx.auto_judgement);
    } catch {
      setContextComments([]);
      setAuthorProfile(null);
    }
  }, []);

  useEffect(() => {
    void loadContext(selected);
  }, [selected, loadContext]);

  const selectByOffset = useCallback(
    (delta: number) => {
      if (!items?.length || !selected) return;
      const idx = items.findIndex((r) => r.id === selected.id);
      const next = items[idx + delta];
      if (next) setSelectedId(next.id);
    },
    [items, selected],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pending || busy) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "j") {
        e.preventDefault();
        selectByOffset(1);
      } else if (e.key === "k") {
        e.preventDefault();
        selectByOffset(-1);
      } else if (e.key === "d" && selected && tab === "pending") {
        e.preventDefault();
        setPending({ report: selected, action: "dismiss" });
      } else if (e.key === "t" && selected && tab === "pending") {
        e.preventDefault();
        setPending({ report: selected, action: "take_down" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, busy, selectByOffset, selected, tab]);

  const resolve = async (note?: string) => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminApi.resolveReport(pending.report.id, pending.action, note);
      const batchHint =
        siblingTotal > 1 ? `（含同目标 ${siblingTotal} 条）` : "";
      showToast(
        (pending.action === "take_down" ? "已下架并记录违规" : "已驳回该举报") + batchHint,
        "success",
      );
      setPending(null);
      reload();
      invalidateStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const hideComment = async (commentId: string) => {
    setHidingCommentId(commentId);
    try {
      await adminApi.hideComment(commentId);
      showToast("评论已下架", "success");
      if (selected) await loadContext(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "下架评论失败");
    } finally {
      setHidingCommentId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col">
      <PageHeader
        dense
        title="审核工作台"
        description="左侧队列 · 右侧被审内容与作者上下文 · 一站式处理"
        action={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            size="sm"
            options={[
              { value: "pending", label: "待处理" },
              { value: "resolved", label: "已下架" },
              { value: "dismissed", label: "已驳回" },
            ]}
          />
        }
      />

      {loading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} onRetry={reload} />}

      {items && !items.length && !error && (
        <EmptyState title="队列为空" description="当前状态下没有举报记录" />
      )}

      {items && items.length > 0 && (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-3 py-2 text-xs text-ink-muted">
              {items.length} 条
              {tab === "pending" && siblingCounts.size < items.length && (
                <span className="ml-2 text-ink-faint">
                  · {siblingCounts.size} 个目标
                </span>
              )}
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {items.map((r) => {
                const active = r.id === selected?.id;
                const dup = siblingCounts.get(reportTargetKey(r)) ?? 1;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full border-b border-border px-3 py-3 text-left transition-colors ${
                        active ? "bg-brand-muted" : "hover:bg-canvas"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="default" size="sm">
                          {targetTypeLabel[r.target_type] || r.target_type}
                        </Badge>
                        {dup > 1 && (
                          <Badge variant="amber" size="sm">
                            ×{dup}
                          </Badge>
                        )}
                        <span className="text-[10px] text-ink-faint">
                          {formatReportTime(r.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-ink">
                        {reportSummaryLine(r)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{r.reason}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <ModerationPreviewPanel
            report={selected}
            siblingCount={siblingTotal}
            siblingReports={siblingReports}
            relatedComments={contextComments}
            authorProfile={authorProfile}
            autoJudgement={autoJudgement}
            busy={busy}
            hidingCommentId={hidingCommentId}
            onHideComment={tab === "pending" ? hideComment : undefined}
            onDismiss={() => selected && setPending({ report: selected, action: "dismiss" })}
            onTakeDown={() => selected && setPending({ report: selected, action: "take_down" })}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={resolve}
        title={pending?.action === "take_down" ? "确认下架该内容？" : "确认驳回该举报？"}
        description={
          pending?.action === "take_down"
            ? `下架会记录违规，并给作者累计 strike。请确认已在右侧审阅内容。${
                siblingTotal > 1
                  ? ` 另有 ${siblingTotal - 1} 条针对同一内容的举报将一并处理。`
                  : ""
              }`
            : `驳回后该举报将标记为已处理。${
                siblingTotal > 1
                  ? ` 另有 ${siblingTotal - 1} 条针对同一内容的举报将一并驳回。`
                  : ""
              }`
        }
        confirmLabel={pending?.action === "take_down" ? "确认下架" : "确认驳回"}
        danger={pending?.action === "take_down"}
        withNote
        notePlaceholder="处理备注（可选，写入审计日志）"
        loading={busy}
      />
    </div>
  );
}
