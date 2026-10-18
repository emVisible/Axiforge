import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { GitFork, MessageCircle, Play, Sparkles, TrendingUp } from "lucide-react";

import { discoverApi, type DiscoverDashboard } from "@/shared/api/creator";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import { CoverCard, LoadingSpinner } from "@/shared/components/ui";

export default function DiscoverGrovePanel() {
  const navigate = useNavigate();
  const [data, setData] = useState<DiscoverDashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    discoverApi
      .dashboard()
      .then((res) => {
        setData(res);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <div className="mb-6 flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "error" || !data) return null;

  const counts = [
    { label: "公开剧本", value: data.counts.projects },
    { label: "公开角色", value: data.counts.characters },
    { label: "公开道具", value: data.counts.items },
    { label: "公开场景", value: data.counts.scenes },
  ];

  const activity = [
    { label: "7日游玩", value: data.activity_7d.plays, icon: Play },
    { label: "7日 Fork", value: data.activity_7d.forks, icon: GitFork },
    { label: "7日评论", value: data.activity_7d.comments, icon: MessageCircle },
  ];

  return (
    <section className="mb-6 rounded-xl border border-border bg-surface/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            Grove 概览
          </div>
          <p className="text-sm text-ink-muted">
            社区公开库与近 7 日活跃一屏总览
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activity.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-2.5 py-1 text-3xs text-ink-muted"
            >
              <Icon className="h-3 w-3 text-ink-faint" />
              <span className="font-medium text-ink">{value}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {counts.map((item) => (
          <div
            key={item.label}
            className="rounded-full border border-border bg-panel px-2.5 py-1 text-3xs text-ink-muted"
          >
            <span className="font-medium text-ink">{item.value}</span>
            <span className="ml-1">{item.label}</span>
          </div>
        ))}
      </div>

      {data.trending_projects.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-faint">
            <TrendingUp className="h-3.5 w-3.5" />
            热门作品
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {data.trending_projects.map((p) => (
              <CoverCard
                key={p.id}
                density="compact"
                title={p.title}
                description={p.description?.slice(0, 40) || "公开作品"}
                onClick={() => navigate(routes.discoverProject(p.id))}
                cover={
                  p.cover_image ? (
                    <img
                      src={getImageUrl(p.cover_image) || ""}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-panel-raised">
                      <Play className="h-6 w-6 opacity-40" strokeWidth={1.5} />
                    </div>
                  )
                }
                footer={
                  <span className="text-3xs text-ink-faint">
                    {p.play_count} 次游玩
                  </span>
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
