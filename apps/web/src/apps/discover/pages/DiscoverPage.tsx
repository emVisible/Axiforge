import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Play, Sparkles, UserRound, Eye } from "lucide-react";

import { searchApi } from "@/api/search";
import { projectApi } from "@/api/editor";
import { getImageUrl } from "@/lib/imageUrl";
import { routes } from "@/lib/routes";
import UserAccountMenu from "@/components/UserAccountMenu";
import { reportContent } from "@/lib/identityLink";
import type { ProjectResponse } from "@/types/project";

interface DiscoverCharacter {
  id: string;
  name: string;
  author_id: string;
  image_path?: string | null;
  view_count: number;
  tags: string[];
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [characters, setCharacters] = useState<DiscoverCharacter[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [reportingId, setReportingId] = useState<string | null>(null);

  const handleReport = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt("举报原因（简要说明）");
    if (!reason?.trim()) return;
    setReportingId(projectId);
    try {
      await reportContent("project", projectId, reason.trim());
      window.alert("已收到举报，感谢反馈");
    } catch {
      window.alert("举报提交失败");
    } finally {
      setReportingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let data = await searchApi.discover({ limit: 12 });
        if (data.projects.length === 0) {
          try {
            await projectApi.seedShowcase();
            data = await searchApi.discover({ limit: 12 });
          } catch {
            /* seed optional */
          }
        }
        setProjects(data.projects);
        setCharacters(data.characters);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d16] via-[#10101c] to-[#141428] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" strokeWidth={1.75} />
          <span className="text-lg font-semibold tracking-wide">Axiforge</span>
          <span className="ml-2 text-xs text-white/30">发现</span>
        </div>
        <div className="flex items-center gap-3">
          <UserAccountMenu variant="dark" />
          <Link
            to={routes.studio}
            className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white/80"
          >
            进入创作
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {status === "loading" && (
          <div className="flex justify-center py-32">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        )}
        {status === "error" && (
          <p className="py-32 text-center text-white/40">加载失败</p>
        )}
        {status === "ready" && (
          <>
            <section className="mb-12">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/40">
                <Play className="h-3.5 w-3.5" strokeWidth={2} />
                作品
              </h2>
              {projects.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center text-sm text-white/25">
                  还没有公开作品——去创作第一部吧
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(routes.play(p.id))}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] text-left transition-all hover:border-white/15 hover:bg-white/[0.06]"
                    >
                      <div className="relative h-36 bg-gradient-to-br from-white/5 to-white/[0.02]">
                        {p.cover_image ? (
                          <img
                            src={getImageUrl(p.cover_image) || ""}
                            alt={p.title}
                            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/10">
                            <Play className="h-8 w-8" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-black">
                            开始游玩
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="mb-1 font-medium text-white/85">
                          {p.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-white/40">
                          {p.description || "暂无描述"}
                        </p>
                        <div className="flex items-center justify-between gap-3 text-[11px] text-white/25">
                          <div className="flex items-center gap-3">
                            {p.genre && <span>{p.genre}</span>}
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" strokeWidth={1.75} />
                              {p.view_count}
                            </span>
                            {(p.play_count ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Play className="h-3 w-3" strokeWidth={1.75} />
                                {p.play_count}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="text-white/20 hover:text-white/50"
                            disabled={reportingId === p.id}
                            onClick={(e) => handleReport(p.id, e)}
                          >
                            举报
                          </button>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/40">
                <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
                角色
              </h2>
              {characters.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center text-sm text-white/25">
                  还没有公开角色
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {characters.map((c) => (
                    <Link
                      key={c.id}
                      to={routes.characters.detail(c.id)}
                      className="group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] transition-all hover:border-white/15"
                    >
                      <div className="aspect-[3/4] bg-white/[0.02]">
                        {c.image_path ? (
                          <img
                            src={getImageUrl(c.image_path) || ""}
                            alt={c.name}
                            className="h-full w-full object-cover opacity-80 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/10">
                            <UserRound className="h-8 w-8" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs text-white/70">{c.name}</p>
                        <p className="truncate text-[10px] text-white/25">
                          {c.view_count} 次浏览
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
