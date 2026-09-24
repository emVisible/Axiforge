import { Anchor, MessageSquare } from "lucide-react";

import { cn, labelSm } from "@/shared/components/ui";

const DRAGGABLE_LABELS = [
  {
    label: "对话节点",
    icon: MessageSquare,
    color:
      "border-border bg-surface text-ink-muted shadow-sm hover:border-ink-muted/30 hover:bg-canvas",
  },
  {
    label: "锚点事件",
    icon: Anchor,
    color:
      "border-amber-400/40 bg-amber-500/10 text-amber-500 shadow-sm hover:bg-amber-500/20",
  },
];

export default function FlowNodePalette() {
  return (
    <div className="w-36 flex-shrink-0 space-y-3">
      <p className={cn(labelSm, "px-1")}>节点类型</p>
      {DRAGGABLE_LABELS.map((item) => {
        const DragIcon = item.icon;
        return (
          <div
            key={item.label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", item.label);
            }}
            className={`cursor-grab rounded-xl border-2 border-dashed px-4 py-3 text-center text-xs transition-all hover:border-solid active:cursor-grabbing ${item.color}`}
          >
            <DragIcon className="mx-auto mb-1 h-4 w-4" strokeWidth={1.75} />
            {item.label}
          </div>
        );
      })}
      <div className="border-t border-border pt-4">
        <p className={cn(labelSm, "mb-2 px-1")}>操作提示</p>
        <div className="space-y-2 text-3xs text-ink-muted">
          <p>拖入节点到画布</p>
          <p>从端口拖线连接</p>
          <p>滚轮缩放画布</p>
          <p>Ctrl+Z 撤销</p>
          <p>Delete 删除选中</p>
          <p>全剧本：泳道着色</p>
          <p>「整理布局」按舞台分列</p>
        </div>
      </div>
    </div>
  );
}
