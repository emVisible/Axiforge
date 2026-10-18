import { Anchor, MessageSquare } from "lucide-react";
import { Handle, Position } from "reactflow";

import { cn } from "@/shared/components/ui";

function StoryNode({
  data,
  selected,
}: {
  data: Record<string, unknown>;
  selected: boolean;
}) {
  const title = (data.title as string) || "未命名";
  const description = (data.description as string) || "";
  const isAnchor = Boolean(data.is_anchor);
  const speaker = (data.speaker as string) || "";
  const hasConditions = Boolean(data.has_conditions);
  const hasEffects = Boolean(data.has_effects);
  const hasScript = Boolean(data.has_script);
  const stageTitle = (data.stage_title as string) || "";
  const stageBorder = (data.stage_border as string) || "border-border";
  const stageHeader = (data.stage_header as string) || "bg-panel";

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[280px] overflow-hidden rounded-xl border-2 bg-surface shadow-sm transition-[border-color,box-shadow] duration-200",
        selected
          ? "border-brand shadow-lg shadow-brand/15"
          : cn(stageBorder, "hover:border-border-strong"),
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!-top-1.5 !h-3 !w-3 !border-2 !border-surface !bg-brand"
      />
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border/60 px-3 py-2",
          isAnchor ? "bg-amber-500/15" : stageHeader,
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center">
          {isAnchor ? (
            <Anchor className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
          ) : (
            <MessageSquare
              className="h-3.5 w-3.5 text-ink-muted"
              strokeWidth={1.75}
            />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {hasScript && (
            <span className="rounded bg-sky-500/15 px-1 py-0.5 text-3xs text-sky-400">
              演出
            </span>
          )}
          {hasConditions && (
            <span className="rounded bg-violet-500/15 px-1 py-0.5 text-3xs text-violet-400">
              条件
            </span>
          )}
          {hasEffects && (
            <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-3xs text-emerald-400">
              效果
            </span>
          )}
          {isAnchor && (
            <span className="rounded bg-amber-500/20 px-1 py-0.5 text-3xs text-amber-500">
              锚点
            </span>
          )}
          {speaker && (
            <span className="rounded bg-brand-muted px-1 py-0.5 text-3xs text-brand">
              {speaker}
            </span>
          )}
          {stageTitle && (
            <span className="max-w-[72px] truncate rounded bg-panel px-1 py-0.5 text-3xs text-ink-faint">
              {stageTitle}
            </span>
          )}
        </div>
      </div>
      {description && (
        <div className="line-clamp-2 border-b border-border/60 bg-surface px-3 py-2 text-2xs leading-relaxed text-ink-muted">
          {description}
        </div>
      )}
      <div className="flex items-center justify-center bg-panel px-3 py-1.5">
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="!relative !bottom-auto !left-auto !right-auto !top-auto !h-3 !w-3 !translate-none !border-2 !border-surface !bg-brand"
        />
        <span className="ml-1 text-3xs text-ink-faint">输出</span>
      </div>
    </div>
  );
}

export const flowNodeTypes = { custom: StoryNode };
