
import type { AssetItemResponse } from "@/shared/types/asset";

interface Props {
  item: AssetItemResponse;
  onDelete: () => void;
}

export default function ItemCard({ item, onDelete }: Props) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-ink">{item.name}</h3>
        <button
          onClick={onDelete}
          className="text-xs text-ink-muted opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
        >
          ×
        </button>
      </div>
      <p className="mb-3 line-clamp-2 text-xs text-ink-muted">
        {item.description || "暂无描述"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-canvas px-2 py-0.5 text-3xs text-ink-muted">
          {item.category}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-3xs ${
            item.rarity === "传说"
              ? "bg-amber-50 text-amber-600"
              : item.rarity === "稀有"
                ? "bg-brand-muted text-brand"
                : "bg-canvas text-ink-muted"
          }`}
        >
          {item.rarity}
        </span>
        {item.effects.slice(0, 2).map((e) => (
          <span
            key={e}
            className="rounded-full bg-brand-muted px-2 py-0.5 text-3xs text-brand"
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
