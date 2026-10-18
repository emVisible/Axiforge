import { Link } from "react-router";
import { Network } from "lucide-react";
import { routes } from "@/shared/lib/routes";
import { useRelations, useDeleteRelation } from "@/shared/hooks/useRelations";
import { Button } from "@/shared/components/ui";

interface RelationListProps {
  characterId: string;
}

export default function RelationList({ characterId }: RelationListProps) {
  const { data: relations, isLoading } = useRelations(characterId);
  const deleteRelation = useDeleteRelation(characterId);

  if (isLoading) return <p className="text-sm text-ink-muted py-4">加载中...</p>;

  if (!relations || relations.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
          <Network className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-ink-muted mb-5">还没有添加任何关系</p>
        <Button
          size="sm"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-add-relation"));
          }}
        >
          + 添加第一个关系
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {relations.map((r) => {
        // 确定对方的 ID 和方向
        const otherId = r.direction === "out" ? r.target_id : r.source_id;

        return (
          <div
            key={r.id}
            className="flex items-center justify-between py-2.5 px-4 bg-canvas rounded-xl group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-medium text-ink-muted bg-surface px-2 py-0.5 rounded-full border border-border flex-shrink-0">
                {r.relation_name === "Fork" ? "Forked from" : r.relation_name}
                {r.is_mutual && " ⇄"}
                {!r.is_mutual &&
                  r.direction === "out" &&
                  r.relation_name !== "Fork" &&
                  " →"}
                {!r.is_mutual && r.direction === "in" && " ← "}
              </span>
              <Link
                to={routes.characters.detail(otherId)}
                className="text-sm font-medium text-ink hover:text-brand truncate transition-colors"
              >
                {r.target_name}
              </Link>
              {r.target_essence && (
                <span className="text-xs text-ink-muted truncate hidden sm:inline">
                  {r.target_essence}
                </span>
              )}
            </div>
            <button
              onClick={() => deleteRelation.mutate(r.id)}
              className="text-ink-muted/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-[opacity,color] text-sm flex-shrink-0 ml-2"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
