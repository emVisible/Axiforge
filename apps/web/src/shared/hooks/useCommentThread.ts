import { useCallback, useEffect, useState } from "react";

import { commentsApi, type CommentNode, type CommentSort } from "@/shared/api/comments";

export function useCommentThread(
  contentType: string,
  contentId: string,
  sort: CommentSort = "recent",
) {
  const [items, setItems] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const data = await commentsApi.list({
        content_type: contentType,
        content_id: contentId,
        sort,
      });
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId, sort]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async (authorId: string, body: string, parentId?: string) => {
    setSubmitting(true);
    try {
      await commentsApi.create({
        content_type: contentType,
        content_id: contentId,
        author_id: authorId,
        body,
        parent_id: parentId,
      });
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (commentId: string, authorId: string) => {
    await commentsApi.remove(commentId, authorId);
    await refresh();
  };

  const report = async (commentId: string, reason: string, reporterToken?: string) => {
    await commentsApi.report(commentId, {
      reason,
      reporter_token: reporterToken,
    });
  };

  return { items, loading, submitting, create, remove, report, refresh };
}
