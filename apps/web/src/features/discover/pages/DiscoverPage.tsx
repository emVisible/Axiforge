import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import DiscoverProjectsTab from "@/features/discover/components/DiscoverProjectsTab";
import DiscoverCharactersTab from "@/features/discover/components/DiscoverCharactersTab";
import DiscoverItemsTab from "@/features/discover/components/DiscoverItemsTab";
import DiscoverScenesTab from "@/features/discover/components/DiscoverScenesTab";
import DiscoverStatsBar from "@/features/discover/components/DiscoverStatsBar";
import { SearchInput, SegmentedControl } from "@/shared/components/ui";

type DiscoverTab = "projects" | "characters" | "items" | "scenes";

const TABS: { value: DiscoverTab; label: string }[] = [
  { value: "projects", label: "剧本" },
  { value: "characters", label: "角色" },
  { value: "items", label: "道具" },
  { value: "scenes", label: "场景模板" },
];

const SEARCH_PLACEHOLDERS: Record<DiscoverTab, string> = {
  projects: "搜索作品标题或描述...",
  characters: "搜索角色名称或概括...",
  items: "搜索道具名称...",
  scenes: "搜索场景模板名称...",
};

function parseTab(raw: string | null): DiscoverTab {
  if (raw === "characters" || raw === "items" || raw === "scenes") return raw;
  return "projects";
}

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const [search, setSearch] = useState("");

  const setTab = (next: DiscoverTab) => {
    setSearchParams(next === "projects" ? {} : { tab: next }, { replace: true });
  };

  useEffect(() => {
    setSearch("");
  }, [tab]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">发现</h1>
        <p className="mt-1 text-sm text-white/40">
          浏览社区公开的剧本、角色、道具与场景模板
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={TABS}
          size="md"
          variant="dark"
        />
        <div className="w-full sm:ml-auto sm:max-w-xs">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder={SEARCH_PLACEHOLDERS[tab]}
            variant="dark"
            size="md"
            width="full"
          />
        </div>
      </div>

      <DiscoverStatsBar />

      {tab === "projects" && <DiscoverProjectsTab search={search} />}
      {tab === "characters" && <DiscoverCharactersTab search={search} />}
      {tab === "items" && <DiscoverItemsTab search={search} />}
      {tab === "scenes" && <DiscoverScenesTab search={search} />}
    </>
  );
}
