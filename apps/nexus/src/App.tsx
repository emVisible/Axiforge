import { useMemo, useState } from "react";
import MiniSearch from "minisearch";
import { Inbox, Orbit, Search, Tags, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { nexusApi, type NexusNote } from "@/services/api";
import OrbitView from "@/features/orbit/OrbitView";
import NoteBody from "@/components/NoteBody";
import { parseNexusLinks } from "@/lib/links";
import { getCreatorId } from "@/lib/creatorId";
import { invalidateNexusNotes, useNexusNotes } from "@/hooks/useNexusNotes";
import { summarizeTagCluster } from "@/lib/orbitThemeSummary";
import { downloadMarkdown, exportNotesMarkdown } from "@/lib/exportNotes";

const AUTHOR_ID = getCreatorId();

type Tab = "inbox" | "notes" | "orbit";

export default function App() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [orbitTag, setOrbitTag] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useNexusNotes(AUTHOR_ID);

  const inbox = notes.filter((n) => n.status === "inbox");
  const archived = notes.filter((n) => n.status !== "inbox");

  const index = useMemo(() => {
    const ms = new MiniSearch({
      fields: ["title", "body", "tags"],
      storeFields: ["title", "body", "tags", "id"],
    });
    ms.addAll(
      notes.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        tags: (n.tags ?? []).join(" "),
      })),
    );
    return ms;
  }, [notes]);

  const filtered = useMemo(() => {
    if (!q.trim()) return notes;
    return index.search(q).map((hit) => notes.find((n) => n.id === hit.id)!).filter(Boolean);
  }, [q, notes, index]);

  const orbitSummary = useMemo(() => {
    if (!orbitTag) return null;
    return summarizeTagCluster(notes, orbitTag);
  }, [notes, orbitTag]);

  const capture = async () => {
    if (!draft.trim()) return;
    const links = parseNexusLinks(draft);
    await nexusApi.create({
      author_id: AUTHOR_ID,
      title: draft.slice(0, 40),
      body: draft,
      status: "inbox",
      tags: extractTags(draft),
      related_projects: links.projects,
      related_characters: links.characters,
    });
    setDraft("");
    await invalidateNexusNotes(qc);
  };

  const archiveNote = async (note: NexusNote) => {
    await nexusApi.update(note.id, { status: "archived" });
    await invalidateNexusNotes(qc);
  };

  const distributeNote = async (
    note: NexusNote,
    targetType: "project" | "character",
    targetId: string,
  ) => {
    const res = await nexusApi.distribute({
      author_id: AUTHOR_ID,
      note_id: note.id,
      target_type: targetType,
      target_id: targetId,
    });
    if (!res.ok) throw new Error(res.message);
    await invalidateNexusNotes(qc);
  };

  const exportAllNotes = () => {
    const payload = exportNotesMarkdown(notes);
    downloadMarkdown(`nexus-notes-${Date.now()}.md`, payload);
  };

  const exportTagNotes = () => {
    if (!orbitTag) return;
    const tagged = notes.filter((n) => n.tags?.includes(orbitTag));
    const payload = exportNotesMarkdown(tagged, `主题 #${orbitTag}`);
    downloadMarkdown(`nexus-${orbitTag}-${Date.now()}.md`, payload);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 p-6 text-white/90">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#f5d78e]">Nexus</h1>
          <p className="text-xs text-white/45">
            思想收件箱 · 笔记 · Orbit 认知概览 · {AUTHOR_ID.slice(0, 12)}…
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-white/10 p-1 text-xs">
          {(
            [
              ["inbox", "收件箱", Inbox],
              ["notes", "笔记", Tags],
              ["orbit", "Orbit", Orbit],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${
                tab === key ? "bg-[#c4944a]/25 text-[#f5d78e]" : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          </div>
          {notes.length > 0 && (
            <button
              type="button"
              onClick={exportAllNotes}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:text-[#f5d78e]"
              title="导出全部笔记为 Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              导出
            </button>
          )}
        </nav>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/30" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="全文搜索笔记…"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#c4944a]/50"
        />
      </div>

      {tab === "inbox" && (
        <section className="space-y-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="快速捕获… 支持 [[project:uuid]] [[character:uuid]] 与 #标签"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void capture()}
            className="rounded-lg bg-[#c4944a]/80 px-4 py-2 text-sm font-medium text-[#0b1020] hover:bg-[#c4944a]"
          >
            存入收件箱
          </button>
          <NoteList
            title={`收件箱 (${inbox.length})`}
            items={inbox}
            loading={isLoading}
            onArchive={(n) => void archiveNote(n)}
            onDistribute={(n, type, id) => void distributeNote(n, type, id)}
          />
        </section>
      )}

      {tab === "notes" && (
        <NoteList
          title={`全部笔记 (${archived.length})`}
          items={q ? filtered.filter((n) => n.status !== "inbox") : archived}
          loading={isLoading}
        />
      )}

      {tab === "orbit" && (
        <section className="space-y-4">
          <OrbitView
            notes={notes}
            activeTag={orbitTag}
            onTagSelect={setOrbitTag}
          />
          {orbitTag && orbitSummary && (
            <div className="rounded-xl border border-[#c4944a]/25 bg-[#c4944a]/5 p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-[#f5d78e]">
                主题摘要 · #{orbitSummary.tag}
              </p>
              <p className="mt-1 text-white/55">
                {orbitSummary.noteCount} 条笔记
                {orbitSummary.lastActiveAt && (
                  <> · 最近更新 {new Date(orbitSummary.lastActiveAt).toLocaleDateString()}</>
                )}
              </p>
              {!!orbitSummary.keywords.length && (
                <p className="mt-2 text-white/70">
                  关键词：{orbitSummary.keywords.join(" · ")}
                </p>
              )}
              {!!orbitSummary.recentTitles.length && (
                <p className="mt-1 text-xs text-white/45">
                  近期：{orbitSummary.recentTitles.join(" / ")}
                </p>
              )}
              <button
                type="button"
                onClick={exportTagNotes}
                className="mt-3 flex items-center gap-1 text-[10px] text-[#f5d78e] hover:underline"
              >
                <Download className="h-3 w-3" />
                导出此主题 Markdown
              </button>
            </div>
          )}
          {orbitTag && (
            <NoteList
              title={`标签 #${orbitTag}`}
              items={notes.filter((n) => n.tags?.includes(orbitTag))}
              loading={isLoading}
            />
          )}
        </section>
      )}
    </div>
  );
}

function NoteList({
  title,
  items,
  loading,
  onArchive,
  onDistribute,
}: {
  title: string;
  items: NexusNote[];
  loading: boolean;
  onArchive?: (n: NexusNote) => void;
  onDistribute?: (n: NexusNote, type: "project" | "character", id: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const runDistribute = async (
    note: NexusNote,
    type: "project" | "character",
    id: string,
  ) => {
    if (!onDistribute) return;
    setBusyId(`${note.id}:${type}:${id}`);
    setMsg(null);
    try {
      await onDistribute(note, type, id);
      setMsg("已分发到 Studio");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "分发失败");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-white/40">加载中…</p>;
  return (
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">{title}</h2>
      {msg && <p className="mb-2 text-xs text-[#f5d78e]">{msg}</p>}
      {!items.length ? (
        <p className="text-sm text-white/35">暂无笔记</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
            >
              <p className="font-medium text-white/85">{n.title || "无标题"}</p>
              <NoteBody body={n.body} />
              {!!n.tags?.length && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {n.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#c4944a]/15 px-2 py-0.5 text-[10px] text-[#f5d78e]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {onDistribute && !!(n.related_projects?.length || n.related_characters?.length) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.related_projects?.map((id) => (
                    <button
                      key={`p-${id}`}
                      type="button"
                      disabled={busyId === `${n.id}:project:${id}`}
                      onClick={() => void runDistribute(n, "project", id)}
                      className="rounded bg-[#c4944a]/20 px-2 py-0.5 text-[10px] text-[#f5d78e] hover:bg-[#c4944a]/35 disabled:opacity-50"
                    >
                      分发到作品
                    </button>
                  ))}
                  {n.related_characters?.map((id) => (
                    <button
                      key={`c-${id}`}
                      type="button"
                      disabled={busyId === `${n.id}:character:${id}`}
                      onClick={() => void runDistribute(n, "character", id)}
                      className="rounded bg-[#c4944a]/20 px-2 py-0.5 text-[10px] text-[#f5d78e] hover:bg-[#c4944a]/35 disabled:opacity-50"
                    >
                      分发到角色
                    </button>
                  ))}
                </div>
              )}
              {onArchive && (
                <button
                  type="button"
                  onClick={() => onArchive(n)}
                  className="mt-2 text-[10px] text-white/40 hover:text-[#f5d78e]"
                >
                  标记为已整理
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function extractTags(text: string): string[] {
  const tags = new Set<string>();
  for (const m of text.matchAll(/#([\w\u4e00-\u9fff-]+)/g)) tags.add(m[1]);
  return [...tags];
}
