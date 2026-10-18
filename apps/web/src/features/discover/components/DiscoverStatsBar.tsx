import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/shared/components/ui";

import { projectApi, itemApi, sceneAssetApi } from "@/shared/api/editor";
import { characterApi } from "@/shared/api/characters";

interface DiscoverStats {
  projects: number;
  characters: number;
  items: number;
  scenes: number;
}

const defaultStats: DiscoverStats = {
  projects: 0,
  characters: 0,
  items: 0,
  scenes: 0,
};

interface DiscoverStatsBarProps {
  variant?: "standalone" | "inline";
  collapsible?: boolean;
}

export default function DiscoverStatsBar({
  variant = "standalone",
  collapsible = false,
}: DiscoverStatsBarProps) {
  const [stats, setStats] = useState<DiscoverStats>(defaultStats);
  const [collapsed, setCollapsed] = useState(false);
  const inline = variant === "inline";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      projectApi.discover({ skip: 0, limit: 1 }),
      characterApi.listPublic({ skip: 0, limit: 1 }),
      itemApi.discover({ skip: 0, limit: 1 }),
      sceneAssetApi.discover({ skip: 0, limit: 1 }),
    ])
      .then(([projects, characters, items, scenes]) => {
        if (cancelled) return;
        setStats({
          projects: projects.total,
          characters: characters.total,
          items: items.total,
          scenes: scenes.total,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { label: "公开剧本", value: stats.projects },
    { label: "公开角色", value: stats.characters },
    { label: "公开道具", value: stats.items },
    { label: "公开场景", value: stats.scenes },
  ];

  const chipClass = inline
    ? "rounded-full border border-border bg-panel px-2.5 py-1 text-3xs text-ink-muted"
    : "rounded-full border border-border bg-panel px-3 py-1.5 text-xs text-ink-muted";

  return (
    <div
      className={cn(
        inline ? "flex flex-wrap items-center justify-end gap-1.5" : "mb-5 flex flex-wrap gap-2",
      )}
    >
      {collapsible && inline && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="mr-1 flex items-center gap-0.5 text-3xs text-ink-faint hover:text-ink-muted"
          aria-expanded={!collapsed}
        >
          统计
          {collapsed ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </button>
      )}
      {(!collapsible || !collapsed) &&
        items.map((item) => (
          <div key={item.label} className={chipClass}>
            <span className="font-medium text-ink">{item.value}</span>
            <span className="ml-1">{item.label}</span>
          </div>
        ))}
    </div>
  );
}
