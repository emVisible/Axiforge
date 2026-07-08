import { useEffect, useState } from "react";

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

export default function DiscoverStatsBar() {
  const [stats, setStats] = useState<DiscoverStats>(defaultStats);

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
    { label: "场景模板", value: stats.scenes },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50"
        >
          <span className="font-medium text-white/80">{item.value}</span>
          <span className="ml-1.5">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
