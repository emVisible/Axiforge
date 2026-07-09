import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Eye, Play } from "lucide-react";

import { projectApi } from "@/shared/api/editor";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { getPlayerToken } from "@/shared/lib/playerToken";
import { routes } from "@/shared/lib/routes";
import type { ProjectResponse } from "@/shared/types/project";
import DiscoverCommentSection from "@/features/discover/components/DiscoverCommentSection";
import PageMeta from "@/shared/components/PageMeta";
import ShareActions from "@/shared/components/ShareActions";
import {
  BackLink,
  Button,
  LoadingSpinner,
  cn,
  useCardTheme,
} from "@/shared/components/ui";

export default function DiscoverProjectDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useCardTheme();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const shareUrl = `${window.location.origin}/discover/projects/${id}`;
  const playUrl = `${window.location.origin}${routes.play(id)}`;

  useEffect(() => {
    (async () => {
      try {
        const data = await projectApi.get(id, { bump_view: true });
        if (!data.is_public) {
          setStatus("error");
          return;
        }
        setProject(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [id]);

  const play = () => {
    projectApi.recordView(id, getPlayerToken()).catch(() => {});
    navigate(routes.play(id));
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "error" || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">
        作品不存在或未公开
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  const allowComments = (project as ProjectResponse & { allow_comments?: boolean }).allow_comments !== false;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <PageMeta
        title={project.title}
        description={project.description || "公开互动叙事作品"}
        image={getImageUrl(project.cover_image ?? undefined) ?? undefined}
        url={shareUrl}
      />
      <BackLink to={routes.discover}>发现</BackLink>

      <div className={cn("overflow-hidden rounded-2xl border", t.surfaceStatic)}>
        <div className={cn("aspect-[21/9]", t.cover)}>
          {project.cover_image ? (
            <img
              src={getImageUrl(project.cover_image) || ""}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink">{project.title}</h1>
              <p className={cn("mt-2 text-sm", t.description)}>
                {project.description || "暂无简介"}
              </p>
              <div className={cn("mt-3 flex items-center gap-3 text-xs", t.meta)}>
                {project.genre && <span>{project.genre}</span>}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {project.view_count}
                </span>
                {(project.play_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {project.play_count}
                  </span>
                )}
              </div>
            </div>
            <Button icon={<Play className="h-4 w-4" />} onClick={play}>
              开始游玩
            </Button>
          </div>
          <ShareActions url={shareUrl} title={project.title} />
          <p className="text-[10px] text-ink-faint">
            试玩直达：
            <a href={playUrl} className="ml-1 text-brand hover:underline">
              {playUrl.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>
      </div>

      <DiscoverCommentSection
        contentType="project"
        contentId={id}
        disabled={!allowComments}
        className="mt-10"
      />
    </div>
  );
}
