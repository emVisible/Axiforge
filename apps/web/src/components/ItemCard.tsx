
import type { AssetItemResponse } from "@/types/asset";

interface Props {
  item: AssetItemResponse;
  onDelete: () => void;
}

export default function ItemCard({ item, onDelete }: Props) {
  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs"
        >
          ×
        </button>
      </div>
      <p className="text-xs text-gray-400 line-clamp-2 mb-3">
        {item.description || "暂无描述"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded-full">
          {item.category}
        </span>
        <span
          className={`px-2 py-0.5 text-[10px] rounded-full ${
            item.rarity === "传说"
              ? "bg-amber-50 text-amber-600"
              : item.rarity === "稀有"
                ? "bg-blue-50 text-blue-600"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {item.rarity}
        </span>
        {item.effects.slice(0, 2).map((e) => (
          <span
            key={e}
            className="px-2 py-0.5 text-[10px] bg-[#3b3473]/5 text-[#3b3473] rounded-full"
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
