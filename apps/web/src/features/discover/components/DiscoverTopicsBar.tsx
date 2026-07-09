import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Hash } from "lucide-react";

import { discoverApi, type TopicSummary } from "@/shared/api/creator";
import { routes } from "@/shared/lib/routes";

export default function DiscoverTopicsBar() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);

  useEffect(() => {
    discoverApi.topics().then((res) => setTopics(res.items.slice(0, 12))).catch(() => {});
  }, []);

  if (!topics.length) return null;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-faint">
        <Hash className="h-3.5 w-3.5" />
        话题
      </div>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={routes.discoverTopic(t.slug)}
            className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] text-ink-muted hover:border-brand hover:text-brand"
          >
            {t.label}
            <span className="ml-1 opacity-60">{t.project_count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
