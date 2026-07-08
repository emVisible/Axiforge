import { useState } from "react";
import { Flag, MessageSquare, Trash2 } from "lucide-react";

import Button from "./Button";
import SegmentedControl from "./SegmentedControl";
import Textarea from "./Textarea";
import type { SurfaceTheme } from "./cardTheme";
import { cardTheme } from "./cardTheme";
import { cn } from "./formStyles";

export interface CommentNode {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  reply_count: number;
  replies?: CommentNode[];
}

export type CommentSort = "recent" | "hot";

interface CommentThreadProps {
  items: CommentNode[];
  sort: CommentSort;
  onSortChange: (sort: CommentSort) => void;
  onSubmit: (body: string, parentId?: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onReport?: (id: string) => void | Promise<void>;
  currentAuthorId?: string;
  theme?: SurfaceTheme;
  loading?: boolean;
  submitting?: boolean;
  className?: string;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function CommentComposer({
  theme,
  placeholder,
  onSubmit,
  submitting,
}: {
  theme: SurfaceTheme;
  placeholder: string;
  onSubmit: (body: string) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    const text = body.trim();
    if (!text) return;
    await onSubmit(text);
    setBody("");
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={theme === "dark" ? "border-white/10 bg-white/5 text-white/90" : ""}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          tone={theme}
          loading={submitting}
          onClick={() => void handleSubmit()}
        >
          发表
        </Button>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  theme,
  currentAuthorId,
  onReply,
  onDelete,
  onReport,
  nested = false,
}: {
  comment: CommentNode;
  theme: SurfaceTheme;
  currentAuthorId?: string;
  onReply: (parentId: string, body: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onReport?: (id: string) => void | Promise<void>;
  nested?: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const t = cardTheme[theme];
  const isOwner = currentAuthorId && comment.author_id === currentAuthorId;

  return (
    <div className={cn("rounded-xl border p-3", t.surfaceStatic, nested && "ml-6 mt-2")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs", t.meta)}>
            {comment.author_id.replace(/^creator-/, "创作者 ")}
            <span className="mx-1.5 opacity-40">·</span>
            {formatTime(comment.created_at)}
          </p>
          <p className={cn("mt-1.5 whitespace-pre-wrap text-sm", t.title)}>
            {comment.body}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {!nested && (
            <Button
              size="sm"
              variant="ghost"
              tone={theme}
              onClick={() => setReplyOpen((v) => !v)}
            >
              回复
            </Button>
          )}
          {isOwner && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              tone={theme}
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => void onDelete(comment.id)}
              aria-label="删除评论"
            >
              <span className="sr-only">删除</span>
            </Button>
          )}
          {onReport && !isOwner && (
            <Button
              size="sm"
              variant="ghost"
              tone={theme}
              icon={<Flag className="h-3.5 w-3.5" />}
              onClick={() => void onReport(comment.id)}
              aria-label="举报评论"
            >
              <span className="sr-only">举报</span>
            </Button>
          )}
        </div>
      </div>
      {replyOpen && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <CommentComposer
            theme={theme}
            placeholder="写下回复…"
            onSubmit={(body) => onReply(comment.id, body)}
          />
        </div>
      )}
      {comment.replies?.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          theme={theme}
          currentAuthorId={currentAuthorId}
          onReply={onReply}
          onDelete={onDelete}
          onReport={onReport}
          nested
        />
      ))}
    </div>
  );
}

export default function CommentThread({
  items,
  sort,
  onSortChange,
  onSubmit,
  onDelete,
  onReport,
  currentAuthorId,
  theme = "light",
  loading = false,
  submitting = false,
  className = "",
}: CommentThreadProps) {
  const t = cardTheme[theme];

  const handleReply = async (parentId: string, body: string) => {
    await onSubmit(body, parentId);
  };

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className={cn("h-4 w-4", t.meta)} strokeWidth={1.75} />
          <h2 className={cn("text-base font-semibold", t.title)}>讨论</h2>
        </div>
        <SegmentedControl
          variant={theme}
          value={sort}
          onChange={(v) => onSortChange(v as CommentSort)}
          options={[
            { value: "recent", label: "最新" },
            { value: "hot", label: "最热" },
          ]}
        />
      </div>

      <CommentComposer
        theme={theme}
        placeholder="发表你的看法…"
        onSubmit={(body) => onSubmit(body)}
        submitting={submitting}
      />

      {loading ? (
        <p className={cn("text-sm", t.meta)}>加载评论中…</p>
      ) : items.length === 0 ? (
        <p className={cn("text-sm", t.meta)}>还没有评论，来抢沙发吧。</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CommentRow
              key={item.id}
              comment={item}
              theme={theme}
              currentAuthorId={currentAuthorId}
              onReply={handleReply}
              onDelete={onDelete}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </section>
  );
}
