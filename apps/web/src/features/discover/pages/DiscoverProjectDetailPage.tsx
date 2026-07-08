import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Eye, Play } from "lucide-react";

import { projectApi } from "@/shared/api/editor";
import { getCreatorId } from "@/shared/lib/creatorId";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { getPlayerToken } from "@/shared/lib/playerToken";
import { routes } from "@/shared/lib/routes";
import type { ProjectResponse } from "@/shared/types/project";
import { useCommentThread } from "@/shared/hooks/useCommentThread";
import {
  BackLink,
  Button,
  CommentThread,
  LoadingSpinner,
  cardTheme,
  cn,
  type CommentSort,
} from "@/shared/components/ui";

export default function DiscoverProjectDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sort, setSort] = useState<CommentSort>("recent");
  const authorId = getCreatorId();
  const { items, loading, submitting, create, remove, report } =
    useCommentThread("project", id, sort);

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

  const t = cardTheme.dark;

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner variant="dark" />
      </div>
    );
  }

  if (status === "error" || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/50">
        作品不存在或未公开
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <BackLink to={routes.discover}>发现</BackLink>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="aspect-[21/9] bg-gradient-to-br from-white/5 to-white/[0.02]">
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
              <h1 className="text-2xl font-semibold text-white/90">{project.title}</h1>
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
            <Button tone="dark" icon={<Play className="h-4 w-4" />} onClick={play}>
              开始游玩
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <CommentThread
          theme="dark"
          items={items}
          sort={sort}
          onSortChange={setSort}
          loading={loading}
          submitting={submitting}
          currentAuthorId={authorId}
          onSubmit={async (body, parentId) => {
            await create(authorId, body, parentId);
          }}
          onDelete={async (commentId) => {
            await remove(commentId, authorId);
          }}
          onReport={async (commentId) => {
            const reason = window.prompt("举报原因（简要说明）");
            if (!reason?.trim()) return;
            try {
              await report(commentId, reason.trim(), getPlayerToken());
              window.alert("已收到举报，感谢反馈");
            } catch {
              window.alert("举报提交失败");
            }
          }}
        />
      </div>
    </div>
  );
}
