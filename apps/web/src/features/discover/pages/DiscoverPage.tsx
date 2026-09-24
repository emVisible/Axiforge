import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import DiscoverGrovePanel from "@/features/discover/components/DiscoverGrovePanel";
import DiscoverProjectsTab from "@/features/discover/components/DiscoverProjectsTab";
import DiscoverCharactersTab from "@/features/discover/components/DiscoverCharactersTab";
import DiscoverItemsTab from "@/features/discover/components/DiscoverItemsTab";
import DiscoverScenesTab from "@/features/discover/components/DiscoverScenesTab";
import DiscoverTopicsBar from "@/features/discover/components/DiscoverTopicsBar";
import { PageHeader, SearchInput, SegmentedControl } from "@/shared/components/ui";
import CloudFeatureNotice from "@/shared/components/CloudFeatureNotice";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

type DiscoverTab = "projects" | "characters" | "items" | "scenes";

const TABS: { value: DiscoverTab; label: string }[] = [
  { value: "projects", label: "剧本" },
  { value: "characters", label: "角色" },
  { value: "items", label: "道具" },
  { value: "scenes", label: "场景" },
];

const SEARCH_PLACEHOLDERS: Record<DiscoverTab, string> = {
  projects: "搜索作品标题或描述...",
  characters: "搜索角色名称或概括...",
  items: "搜索道具名称...",
  scenes: "搜索场景名称...",
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

  // 桌面离线直接输 URL 进来时，给一句准确说明而不是空白的作品街
  if (isLocalOnlyDeployment()) {
    return (
      <>
        <PageHeader dense title="发现" description="公开作品与创作者" />
        <CloudFeatureNotice feature="发现页" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        dense
        title="发现"
        description="浏览社区公开的剧本、角色、道具与场景"
      />

      <DiscoverGrovePanel />

      <DiscoverTopicsBar />

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={TABS}
          size="md"
        />
        <div className="w-full sm:ml-auto sm:max-w-xs">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder={SEARCH_PLACEHOLDERS[tab]}
            size="md"
            width="full"
          />
        </div>
      </div>

      {tab === "projects" && <DiscoverProjectsTab search={search} />}
      {tab === "characters" && <DiscoverCharactersTab search={search} />}
      {tab === "items" && <DiscoverItemsTab search={search} />}
      {tab === "scenes" && <DiscoverScenesTab search={search} />}
    </>
  );
}
