import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Play, UserRound, ScrollText, ArrowLeft } from "lucide-react";

import { projectApi } from "@/api/editor";
import { characterApi } from "@/api/characters";
import { getImageUrl } from "@/lib/imageUrl";
import { getCreatorId } from "@/lib/creatorId";
import { routes } from "@/lib/routes";
import type { ProjectResponse } from "@/types/project";
import type { Character } from "@/types/character";

export default function AuthorPage() {
  const { authorId = "" } = useParams<{ authorId: string }>();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const isSelf = authorId === getCreatorId();

  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([
          projectApi.list({ author_id: authorId }),
          characterApi.listUser(authorId),
        ]);
        // 他人主页只展示公开内容
        setProjects(isSelf ? p : p.filter((x) => x.is_public));
        setCharacters(isSelf ? c : c.filter((x) => x.is_public));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [authorId, isSelf]);

  const displayName = isSelf ? "我的主页" : authorId.replace(/^creator-/, "创作者 ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d16] to-[#141428] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link
          to={routes.discover}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          发现
        </Link>

        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <UserRound className="h-8 w-8 text-white/40" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-white/30">
              {projects.length} 部作品 · {characters.length} 个角色
            </p>
          </div>
        </div>

        {status === "loading" && (
          <div className="flex justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        )}
        {status === "error" && (
          <p className="py-24 text-center text-white/40">加载失败</p>
        )}

        {status === "ready" && (
          <>
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/40">
                <Play className="h-3.5 w-3.5" strokeWidth={2} />
                作品
              </h2>
              {projects.length === 0 ? (
                <p className="text-sm text-white/20">暂无作品</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      to={routes.play(p.id)}
                      className="rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/15 hover:bg-white/[0.06]"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <ScrollText
                          className="h-3.5 w-3.5 text-white/30"
                          strokeWidth={1.75}
                        />
                        <span className="font-medium text-white/85">
                          {p.title}
                        </span>
                        {!p.is_public && (
                          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
                            私有
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-white/40">
                        {p.description || "暂无描述"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/40">
                <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
                角色
              </h2>
              {characters.length === 0 ? (
                <p className="text-sm text-white/20">暂无角色</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {characters.map((c) => (
                    <Link
                      key={c.id}
                      to={routes.characters.detail(c.id)}
                      className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] transition-all hover:border-white/15"
                    >
                      <div className="aspect-[3/4] bg-white/[0.02]">
                        {c.image_path ? (
                          <img
                            src={getImageUrl(c.image_path) || ""}
                            alt={c.name}
                            className="h-full w-full object-cover opacity-80"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/10">
                            <UserRound className="h-7 w-7" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <p className="truncate p-2 text-xs text-white/70">
                        {c.name}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
