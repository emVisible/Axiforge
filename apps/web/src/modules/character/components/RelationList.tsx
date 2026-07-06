import { Link } from "react-router";
import { Network } from "lucide-react";
import { routes } from "@/lib/routes";
import { useRelations, useDeleteRelation } from "@/hooks/useRelations";
import { Button } from "@/components/ui";

interface RelationListProps {
  characterId: string;
}

export default function RelationList({ characterId }: RelationListProps) {
  const { data: relations, isLoading } = useRelations(characterId);
  const deleteRelation = useDeleteRelation(characterId);

  if (isLoading) return <p className="text-sm text-gray-400 py-4">加载中...</p>;

  if (!relations || relations.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
          <Network className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-gray-400 mb-5">还没有添加任何关系</p>
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
            className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 flex-shrink-0">
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
                className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate transition-colors"
              >
                {r.target_name}
              </Link>
              {r.target_essence && (
                <span className="text-xs text-gray-400 truncate hidden sm:inline">
                  {r.target_essence}
                </span>
              )}
            </div>
            <button
              onClick={() => deleteRelation.mutate(r.id)}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-sm flex-shrink-0 ml-2"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
