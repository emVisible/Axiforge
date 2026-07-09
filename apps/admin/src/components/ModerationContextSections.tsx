import { Link } from "react-router";
import { Badge, Button } from "@axiforge/ui";
import type { AdminCommentSnippet, AuthorModerationProfile } from "@/api/adminClient";
import { formatReportTime } from "@/lib/moderation";

interface ModerationContextSectionsProps {
  comments: AdminCommentSnippet[];
  author: AuthorModerationProfile | null | undefined;
  onHideComment?: (commentId: string) => void;
  hidingCommentId?: string | null;
}

export default function ModerationContextSections({
  comments,
  author,
  onHideComment,
  hidingCommentId,
}: ModerationContextSectionsProps) {
  return (
    <>
      {author && (
        <section className="rounded-lg border border-border bg-canvas p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            作者画像
          </p>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium text-ink">
                {author.display_name || author.creator_id}
              </p>
              {author.email && (
                <p className="text-xs text-ink-muted">{author.email}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-muted">
                <span>作品 {author.project_count}</span>
                <span>角色 {author.character_count}</span>
                <span>违规 {author.violation_count}</span>
                {author.strike_count > 0 && (
                  <span className="text-amber-600">strike {author.strike_count}</span>
                )}
                {author.is_banned && (
                  <Badge variant="rose" size="sm">
                    已封禁
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/users?creator_id=${encodeURIComponent(author.creator_id)}`}
                className="text-xs text-brand hover:underline"
              >
                用户管理
              </Link>
              <Link
                to={`/violations?creator_id=${encodeURIComponent(author.creator_id)}`}
                className="text-xs text-brand hover:underline"
              >
                违规记录
              </Link>
            </div>
          </div>
        </section>
      )}

      {comments.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            关联评论（最近 {comments.length} 条）
          </p>
          <ul className="space-y-2">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-muted">{c.author_id}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={c.status === "visible" ? "emerald" : "rose"}
                      size="sm"
                    >
                      {c.status}
                    </Badge>
                    <span className="text-[10px] text-ink-faint">
                      {formatReportTime(c.created_at)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-ink">{c.body}</p>
                {c.status === "visible" && onHideComment && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-7 text-[10px] text-rose-600"
                    disabled={hidingCommentId === c.id}
                    onClick={() => onHideComment(c.id)}
                  >
                    下架评论
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
