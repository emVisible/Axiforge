import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Eye,
  GitFork,
  MessageCircle,
  Play,
  Star,
  UserRound,
} from "lucide-react";

import { creatorApi } from "@/shared/api/creator";
import { projectApi } from "@/shared/api/editor";
import { getCreatorId } from "@/shared/lib/creatorId";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import PageMeta from "@/shared/components/PageMeta";
import ShareActions from "@/shared/components/ShareActions";
import {
  Button,
  CardGrid,
  CoverCard,
  EmptyState,
  EntityIcon,
  LoadingSpinner,
} from "@/shared/components/ui";

export default function AuthorPage() {
  const { authorId = "" } = useParams<{ authorId: string }>();
  const navigate = useNavigate();
  const [hub, setHub] = useState<Awaited<ReturnType<typeof creatorApi.hub>> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const isSelf = authorId === getCreatorId();
  const shareUrl = `${window.location.origin}${routes.author(authorId)}`;

  useEffect(() => {
    (async () => {
      try {
        const data = await creatorApi.hub(authorId);
        setHub(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [authorId]);

  const displayName =
    isSelf && !hub?.display_name
      ? "我的主页"
      : hub?.display_name ||
        `创作者 ${authorId.replace(/^creator-/, "").slice(-6)}`;

  const toggleFeatured = async (projectId: string) => {
    if (!isSelf || !hub) return;
    const current = hub.featured_projects.map((p) => p.id);
    const next = current.includes(projectId)
      ? current.filter((id) => id !== projectId)
      : [...current, projectId].slice(0, 3);
    await creatorApi.setFeatured(authorId, next);
    const refreshed = await creatorApi.hub(authorId);
    setHub(refreshed);
  };

  const forkProject = async (projectId: string) => {
    try {
      const forked = await projectApi.fork(projectId, {
        author_id: getCreatorId(),
      });
      navigate(routes.project(forked.id));
    } catch {
      window.alert("Fork 失败，请稍后重试");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageMeta
        title={displayName}
        description={`Axiforge 创作者 · ${hub?.projects.length ?? 0} 部公开作品`}
        url={shareUrl}
      />

      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <EntityIcon className="h-16 w-16 text-3xl">
            {hub?.avatar_emoji || (
              <UserRound className="h-8 w-8" strokeWidth={1.5} />
            )}
          </EntityIcon>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {displayName}
            </h1>
            <p className="text-sm text-ink-muted">
              {hub?.projects.length ?? 0} 部公开作品
            </p>
            {hub && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {hub.total_views} 浏览
                </span>
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  {hub.total_plays} 游玩
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {hub.total_comments} 评论
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" />
                  7日 Fork {hub.forks_7d}
                </span>
              </div>
            )}
            {isSelf && (
              <Button
                as="link"
                to={routes.profile}
                variant="ghost"
                size="sm"
                className="mt-1 h-auto px-0 py-0"
              >
                编辑资料
              </Button>
            )}
          </div>
        </div>
        <ShareActions url={shareUrl} title={displayName} />
      </div>

      {status === "loading" && <LoadingSpinner />}
      {status === "error" && (
        <EmptyState framed title="加载失败" description="请稍后重试" />
      )}

      {status === "ready" && hub && (
        <>
          {hub.featured_projects.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
                <Star className="h-3.5 w-3.5" strokeWidth={2} />
                精选作品
              </h2>
              <CardGrid>
                {hub.featured_projects.map((p) => (
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
                      <span className="flex items-center gap-2 text-3xs text-ink-muted">
                        <MessageCircle className="h-3 w-3" />
                        {p.comment_count}
                      </span>
                    }
                  />
                ))}
              </CardGrid>
            </section>
          )}

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
              <Play className="h-3.5 w-3.5" strokeWidth={2} />
              全部作品
            </h2>
            {hub.projects.length === 0 ? (
              <p className="text-sm text-ink-faint">暂无公开作品</p>
            ) : (
              <CardGrid>
                {hub.projects.map((p) => (
                  <div key={p.id} className="relative">
                    <CoverCard
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
                        <span className="flex items-center gap-2 text-3xs text-ink-muted">
                          <Eye className="h-3 w-3" />
                          {p.view_count}
                          <MessageCircle className="h-3 w-3" />
                          {p.comment_count}
                          <GitFork className="h-3 w-3" />
                          {p.fork_count}
                        </span>
                      }
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => forkProject(p.id)}>
                        从此模板 Fork
                      </Button>
                      {isSelf && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void toggleFeatured(p.id)}
                        >
                          {hub.featured_projects.some((f) => f.id === p.id)
                            ? "取消精选"
                            : "设为精选"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardGrid>
            )}
          </section>
        </>
      )}
    </div>
  );
}
