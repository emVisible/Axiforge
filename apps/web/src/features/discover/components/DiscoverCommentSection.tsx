import { getCreatorId } from "@/shared/lib/creatorId";
import { getPlayerToken } from "@/shared/lib/playerToken";
import { useCommentThread } from "@/shared/hooks/useCommentThread";
import { CommentThread, cn, useCardTheme, type CommentSort } from "@/shared/components/ui";
import { useState } from "react";

type ContentType = "project" | "character" | "item" | "scene";

interface DiscoverCommentSectionProps {
  contentType: ContentType;
  contentId: string;
  disabled?: boolean;
  className?: string;
}

export default function DiscoverCommentSection({
  contentType,
  contentId,
  disabled = false,
  className,
}: DiscoverCommentSectionProps) {
  const t = useCardTheme();
  const [sort, setSort] = useState<CommentSort>("recent");
  const authorId = getCreatorId();
  const { items, loading, submitting, create, remove, report } =
    useCommentThread(contentType, contentId, sort);

  if (disabled) {
    return (
      <div className={cn("rounded-2xl border p-6 text-sm text-ink-muted", t.muted, className)}>
        创作者已关闭此内容的评论
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-6", t.muted, className)}>
      <CommentThread
        items={items}
        sort={sort}
        onSortChange={setSort}
        loading={loading}
        submitting={submitting}
        currentAuthorId={authorId}
        onSubmit={async (body, parentId) => {
          await create(authorId, body, parentId);
        }}
        onDelete={async (commentId) => {
          await remove(commentId, authorId);
        }}
        onReport={async (commentId) => {
          const reason = window.prompt("举报原因（简要说明）");
          if (!reason?.trim()) return;
          try {
            await report(commentId, reason.trim(), getPlayerToken());
            window.alert("已收到举报，感谢反馈");
          } catch {
            window.alert("举报提交失败");
          }
        }}
      />
    </div>
  );
}
