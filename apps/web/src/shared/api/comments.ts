import { apiClient } from "./client";
import type { CommentNode, CommentSort } from "@axiforge/ui";

export type { CommentNode, CommentSort };

export const commentsApi = {
  list: (params: {
    content_type: string;
    content_id: string;
    sort?: CommentSort;
    skip?: number;
    limit?: number;
  }) =>
    apiClient.get<{ items: CommentNode[]; total: number }>("/comments", {
      content_type: params.content_type,
      content_id: params.content_id,
      sort: params.sort,
      skip: params.skip,
      limit: params.limit,
    }),

  create: (body: {
    content_type: string;
    content_id: string;
    author_id: string;
    body: string;
    parent_id?: string;
  }) => apiClient.post<CommentNode>("/comments", body),

  remove: (commentId: string, authorId: string) =>
    apiClient.delete(
      `/comments/${commentId}?author_id=${encodeURIComponent(authorId)}`,
    ),

  report: (commentId: string, body: { reason: string; reporter_token?: string }) =>
    apiClient.post(`/comments/${commentId}/report`, body),
};
