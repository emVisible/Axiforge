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
  const stageHeader = (data.stage_header as string) || "bg-canvas";

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[280px] rounded-xl border-2 shadow-sm transition-all duration-200",
        selected
          ? "border-brand bg-surface shadow-lg shadow-brand/10"
          : cn(stageBorder, "bg-surface hover:border-ink-muted/30"),
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!-top-1.5 !h-3 !w-3 !border-2 !border-surface !bg-brand"
      />
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-[10px] px-4 py-2.5",
          isAnchor ? "bg-amber-50" : stageHeader,
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center">
          {isAnchor ? (
            <Anchor className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
          ) : (
            <MessageSquare
              className="h-3.5 w-3.5 text-ink-muted"
              strokeWidth={1.75}
            />
          )}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-ink">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {hasScript && (
            <span className="rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-600">
              演出
            </span>
          )}
          {hasConditions && (
            <span className="rounded bg-purple-100 px-1 py-0.5 text-[9px] text-purple-600">
              条件
            </span>
          )}
          {hasEffects && (
            <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] text-emerald-600">
              效果
            </span>
          )}
          {isAnchor && (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-600">
              锚点
            </span>
          )}
          {speaker && (
            <span className="rounded bg-brand/10 px-1 py-0.5 text-[9px] text-brand">
              {speaker}
            </span>
          )}
          {stageTitle && (
            <span className="max-w-[72px] truncate rounded bg-black/5 px-1 py-0.5 text-[9px] text-ink-muted">
              {stageTitle}
            </span>
          )}
        </div>
      </div>
      {description && (
        <div className="line-clamp-2 border-t border-border/60 px-4 py-2 text-[11px] leading-relaxed text-ink-muted">
          {description}
        </div>
      )}
      <div className="flex items-center justify-center border-t border-border px-3 py-1.5">
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="!relative !bottom-auto !left-auto !right-auto !top-auto !h-3 !w-3 !translate-none !border-2 !border-surface !bg-brand"
        />
        <span className="ml-1 text-[10px] text-ink-muted">输出</span>
      </div>
    </div>
  );
}

export const flowNodeTypes = { custom: StoryNode };
