import {
  Badge,
  Button,
  Card,
} from "@axiforge/ui";
import { ExternalLink, User } from "lucide-react";
import type {
  AdminReport,
  AuthorModerationProfile,
  AdminCommentSnippet,
  AutoJudgement,
} from "@/api/adminClient";
import ModerationContextSections from "@/components/ModerationContextSections";
import {
  actionLabel,
  clauseLabel,
  formatReportTime,
  maskToken,
  targetTypeLabel,
  viaLabel,
  webDiscoverUrl,
} from "@/lib/moderation";

interface ModerationPreviewPanelProps {
  report: AdminReport | null;
  siblingCount?: number;
  siblingReports?: AdminReport[];
  relatedComments?: AdminCommentSnippet[];
  authorProfile?: AuthorModerationProfile | null;
  autoJudgement?: AutoJudgement | null;
  onDismiss: () => void;
  onTakeDown: () => void;
  onHideComment?: (commentId: string) => void;
  hidingCommentId?: string | null;
  busy?: boolean;
}

export default function ModerationPreviewPanel({
  report,
  siblingCount = 0,
  siblingReports = [],
  relatedComments = [],
  authorProfile,
  autoJudgement,
  onDismiss,
  onTakeDown,
  onHideComment,
  hidingCommentId,
  busy,
}: ModerationPreviewPanelProps) {
  if (!report) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center border-dashed bg-surface/50">
        <p className="text-sm text-ink-muted">从左侧选择一条举报以审阅内容</p>
      </Card>
    );
  }

  const p = report.target_preview;
  const discoverUrl = webDiscoverUrl(p.discover_path || p.parent_path);
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
          <Badge variant="brand">{targetTypeLabel[report.target_type] || report.target_type}</Badge>
          {p.content_status && (
            <Badge variant={statusVariant}>{p.content_status}</Badge>
          )}
          {!p.exists && <Badge variant="rose">目标缺失</Badge>}
          {p.violation_count > 0 && (
            <Badge variant="amber">历史违规 {p.violation_count}</Badge>
          )}
          {siblingCount > 1 && (
            <Badge variant="purple">同目标举报 ×{siblingCount}</Badge>
          )}
        </div>
        <h2 className="mt-2 text-lg font-semibold text-ink">{p.title}</h2>
        {p.parent_title && (
          <p className="mt-0.5 text-xs text-ink-muted">
            所属：{p.parent_title}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {p.cover_image && (
          <div className="overflow-hidden rounded-lg border border-border bg-panel">
            <img
              src={p.cover_image}
              alt=""
              className="max-h-40 w-full object-cover"
            />
          </div>
        )}

        <section>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            被审内容
          </p>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-canvas px-3 py-2 text-sm leading-relaxed text-ink">
            {p.excerpt || "（无摘要）"}
          </p>
        </section>

        <section>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            举报理由
          </p>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-ink">
            {report.reason}
          </p>
          {siblingReports.length > 1 && (
            <ul className="mt-2 space-y-1">
              {siblingReports
                .filter((r) => r.id !== report.id)
                .map((r) => (
                  <li
                    key={r.id}
                    className="rounded border border-border bg-canvas px-2 py-1.5 text-xs text-ink-muted"
                  >
                    <span className="text-[10px] text-ink-faint">
                      {formatReportTime(r.created_at)}
                    </span>
                    <p className="mt-0.5 text-ink">{r.reason}</p>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              作者 {p.author_display || p.author_id || "—"}
              {p.author_strike_count > 0 && (
                <span className="ml-1 text-amber-600">· strike {p.author_strike_count}</span>
              )}
              {p.author_is_banned && (
                <span className="ml-1 text-rose-600">· 已封禁</span>
              )}
            </span>
          </div>
          <div>举报人 {maskToken(report.reporter_token)}</div>
          <div>提交 {formatReportTime(report.created_at)}</div>
          <div className="font-mono text-[10px]">ID {report.target_id}</div>
        </section>

        {autoJudgement && <AutoJudgementStrip judgement={autoJudgement} />}

        <ModerationContextSections
          comments={relatedComments}
          author={authorProfile}
          onHideComment={onHideComment}
          hidingCommentId={hidingCommentId}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-raised px-4 py-3">
        <span className="text-[10px] text-ink-faint">j/k 切换 · d 驳回 · t 下架</span>
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
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" disabled={busy} onClick={onDismiss}>
            驳回举报
          </Button>
          <Button size="sm" variant="danger" disabled={busy || !p.exists} onClick={onTakeDown}>
            下架内容
          </Button>
        </div>
      </div>
    </Card>
  );
}


/**
 * 机器结论条。放在举报元信息之下、评论区之上——它是运营读这条举报时的第一屏信息。
 *
 * 明确标出"有没有执行资格"与"是否校准"：只有两者都成立，系统才会自己动手；
 * 否则它只是把一个建议递到人面前。运营需要知道自己在替谁做最后那一步。
 */
function AutoJudgementStrip({ judgement }: { judgement: AutoJudgement }) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs uppercase tracking-wide text-ink-faint">自动判断</span>
        <span className="text-xs font-medium">{actionLabel(judgement.final_action)}</span>
        <span className="text-2xs text-ink-muted">{viaLabel(judgement.via)}</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="rounded-full border border-border px-1.5 py-0.5 text-2xs">
            {judgement.engine}
          </span>
          {!judgement.calibrated && (
            <span className="rounded-full border border-amber-500/40 px-1.5 py-0.5 text-2xs text-amber-600">
              未校准
            </span>
          )}
          {judgement.authoritative && (
            <span className="rounded-full border border-emerald-500/40 px-1.5 py-0.5 text-2xs text-emerald-600">
              有执行资格
            </span>
          )}
        </span>
      </div>
      {judgement.clause_ids.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {judgement.clause_ids.map((c) => (
            <span
              key={c}
              className="rounded-full bg-brand-muted px-2 py-0.5 text-2xs text-brand"
            >
              {clauseLabel(c)}
            </span>
          ))}
        </div>
      )}
      {judgement.reasons.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-2xs text-ink-muted">
          {judgement.reasons.slice(0, 4).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <div className="mt-1 text-2xs text-ink-faint">
        置信 {judgement.confidence === null ? "—" : `${(judgement.confidence * 100).toFixed(0)}%`}
        <span className="mx-1">·</span>
        {judgement.policy_version} / {judgement.questions_version}
      </div>
    </section>
  );
}
