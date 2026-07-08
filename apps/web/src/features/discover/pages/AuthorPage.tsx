import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Play, UserRound } from "lucide-react";

import { projectApi } from "@/shared/api/editor";
import { characterApi } from "@/shared/api/characters";
import { userApi, type AuthorPublic } from "@/shared/api/user";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { getCreatorId } from "@/shared/lib/creatorId";
import { routes } from "@/shared/lib/routes";
import type { ProjectResponse } from "@/shared/types/project";
import type { Character } from "@/shared/types/character";
import {
  Badge,
  Button,
  CardGrid,
  CardLink,
  EmptyState,
  EntityCard,
  EntityIcon,
  LoadingSpinner,
  cardTheme,
  cn,
} from "@/shared/components/ui";

export default function AuthorPage() {
  const { authorId = "" } = useParams<{ authorId: string }>();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [author, setAuthor] = useState<AuthorPublic | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const isSelf = authorId === getCreatorId();

  useEffect(() => {
    (async () => {
      try {
        const [p, c, a] = await Promise.all([
          projectApi.list({ author_id: authorId }),
          characterApi.listUser(authorId),
          userApi.author(authorId).catch(() => ({ creator_id: authorId })),
        ]);
        setProjects(isSelf ? p : p.filter((x) => x.is_public));
        setCharacters(isSelf ? c : c.filter((x) => x.is_public));
        setAuthor(a);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [authorId, isSelf]);

  const displayName =
    isSelf && !author?.display_name
      ? "我的主页"
      : author?.display_name ||
        `创作者 ${authorId.replace(/^creator-/, "").slice(-6)}`;

  const t = cardTheme.dark;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 flex items-center gap-4">
        <EntityIcon theme="dark" className="h-16 w-16 text-3xl">
          {author?.avatar_emoji || (
            <UserRound className="h-8 w-8" strokeWidth={1.5} />
          )}
        </EntityIcon>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">
            {displayName}
          </h1>
          <p className="text-sm text-white/35">
            {projects.length} 部作品 · {characters.length} 个角色
          </p>
          {isSelf && (
            <Button
              as="link"
              to={routes.profile}
              variant="ghost"
              size="sm"
              tone="dark"
              className="mt-1 h-auto px-0 py-0"
            >
              编辑资料
            </Button>
          )}
        </div>
      </div>

      {status === "loading" && <LoadingSpinner variant="dark" />}
      {status === "error" && (
        <EmptyState theme="dark" framed title="加载失败" description="请稍后重试" />
      )}

      {status === "ready" && (
        <>
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
              <Play className="h-3.5 w-3.5" strokeWidth={2} />
              作品
            </h2>
            {projects.length === 0 ? (
              <p className="text-sm text-white/25">暂无作品</p>
            ) : (
              <CardGrid>
                {projects.map((p) => (
                  <EntityCard
                    key={p.id}
                    theme="dark"
                    to={routes.play(p.id)}
                    title={p.title}
                    description={p.description || "暂无描述"}
                    leading={
                      <EntityIcon theme="dark">
                        <Play className="h-4 w-4" strokeWidth={1.75} />
                      </EntityIcon>
                    }
                    badges={
                      !p.is_public ? (
                        <Badge variant="default" size="sm" tone="dark">
                          私有
                        </Badge>
                      ) : undefined
                    }
                  />
                ))}
              </CardGrid>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
              <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
              角色
            </h2>
            {characters.length === 0 ? (
              <p className="text-sm text-white/25">暂无角色</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {characters.map((c) => (
                  <CardLink
                    key={c.id}
                    theme="dark"
                    to={routes.characters.detail(c.id)}
                    className="overflow-hidden !p-0"
                  >
                    <div className={cn("aspect-[3/4]", t.cover)}>
                      {c.image_path ? (
                        <img
                          src={getImageUrl(c.image_path) || ""}
                          alt={c.name}
                          className="h-full w-full object-cover opacity-80"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-full items-center justify-center",
                            t.coverPlaceholder,
                          )}
                        >
                          <UserRound className="h-7 w-7" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <p className={cn("truncate p-2 text-xs", t.title)}>{c.name}</p>
                  </CardLink>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
