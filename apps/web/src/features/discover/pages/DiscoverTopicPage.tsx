import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Hash, Play } from "lucide-react";

import { discoverApi } from "@/shared/api/creator";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import type { ProjectResponse } from "@/shared/types/project";
import DiscoverCommentSection from "@/features/discover/components/DiscoverCommentSection";
import PageMeta from "@/shared/components/PageMeta";
import ShareActions from "@/shared/components/ShareActions";
import CloudFeatureNotice from "@/shared/components/CloudFeatureNotice";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import {
  BackLink,
  CardGrid,
  CoverCard,
  LoadingSpinner,
} from "@/shared/components/ui";

export default function DiscoverTopicPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const shareUrl = `${window.location.origin}/discover/topics/${encodeURIComponent(slug)}`;

  // 桌面态这一页没有读者：它与 DiscoverPage 同进退（E35「入口与目标同生共死」），
  // 否则直接输 URL 进来就是一次注定失败的云端请求。
  const localOnly = isLocalOnlyDeployment();

  useEffect(() => {
    if (localOnly) return;
    (async () => {
      setLoading(true);
      try {
        const data = await discoverApi.topicProjects(slug, { limit: 40 });
        setProjects(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, localOnly]);

  if (localOnly) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <CloudFeatureNotice feature="话题页" />
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <PageMeta
        title={`话题 #${slug}`}
        description={`Axiforge 发现 · ${slug} 相关公开作品`}
        url={shareUrl}
      />
      <BackLink to={routes.discover}>发现</BackLink>

      <div className="mt-4 mb-8">
        <div className="flex items-center gap-2 text-ink">
          <Hash className="h-5 w-5 text-brand" />
          <h1 className="text-2xl font-semibold">{slug}</h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          按机制 / 标签聚合的公开剧本
          {!loading && ` · ${projects.length} 部作品`}
        </p>
        <ShareActions url={shareUrl} title={slug} className="mt-4" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : projects.length === 0 ? (
        <p className="text-center text-sm text-ink-muted">该话题下暂无公开作品</p>
      ) : (
        <CardGrid>
          {projects.map((p) => (
            <CoverCard
              key={p.id}
              title={p.title}
              description={p.description || "暂无描述"}
              onClick={() => navigate(routes.discoverProject(p.id))}
              cover={
                p.cover_image ? (
                  <img
                    src={getImageUrl(p.cover_image) || ""}
                    alt={p.title}
                    className="h-full w-full object-cover"
                  />
                ) : undefined
              }
              footer={
                <span className="flex items-center gap-1 text-3xs text-ink-muted">
                  <Play className="h-3 w-3" />
                  {p.play_count ?? 0}
                </span>
              }
            />
          ))}
        </CardGrid>
      )}

      <DiscoverCommentSection
        contentType="project"
        contentId={`topic:${slug}`}
        className="mt-10"
      />
    </div>
  );
}
