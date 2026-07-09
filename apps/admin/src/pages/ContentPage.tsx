import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  ErrorDisplay,
  Input,
  PageHeader,
  Pagination,
  SegmentedControl,
  useToast,
  type DataTableColumn,
} from "@axiforge/ui";
import {
  adminApi,
  type AdminCharacter,
  type AdminProject,
  type PaginatedResponse,
} from "@/api/adminClient";
import ContentInspectPanel from "@/components/ContentInspectPanel";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { useAdminInvalidation, useAdminList } from "@/hooks/useAdminList";
import { webDiscoverUrl } from "@/lib/moderation";

const PAGE_SIZE = 20;

const statusVariant: Record<string, "emerald" | "amber" | "rose" | "default"> = {
  published: "emerald",
  draft: "amber",
  taken_down: "rose",
};

const statusLabel: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  taken_down: "已下架",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant[status] || "default"}>{statusLabel[status] || status}</Badge>;
}

type InspectTarget =
  | { type: "project"; id: string; title: string }
  | { type: "character"; id: string; title: string };

export default function ContentPage() {
  const [tab, setTab] = useState<"projects" | "characters">("projects");
  const [projectPage, setProjectPage] = useState(0);
  const [characterPage, setCharacterPage] = useState(0);
  const [projectQ, setProjectQ] = useState("");
  const [characterQ, setCharacterQ] = useState("");
  const [projectQInput, setProjectQInput] = useState("");
  const [characterQInput, setCharacterQInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "published" | "draft" | "taken_down">("");
  const [inspect, setInspect] = useState<InspectTarget | null>(null);
  const [pendingTakeDown, setPendingTakeDown] = useState<AdminProject | null>(null);
  const [pendingCharacterDown, setPendingCharacterDown] = useState<AdminCharacter | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const { invalidateStats, invalidateModeration } = useAdminInvalidation();

  useEffect(() => {
    const t = setTimeout(() => {
      setProjectQ(projectQInput.trim());
      setProjectPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [projectQInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCharacterQ(characterQInput.trim());
      setCharacterPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [characterQInput]);

  const {
    data: projects,
    loading: projectsLoading,
    error: projectsError,
    setError: setProjectsError,
    reload: reloadProjects,
    invalidate: invalidateProjects,
  } = useAdminList<PaginatedResponse<AdminProject>>({
    queryKey: adminQueryKeys.projects(projectPage, projectQ, statusFilter || undefined),
    fetcher: () =>
      adminApi.projects({
        limit: PAGE_SIZE,
        offset: projectPage * PAGE_SIZE,
        q: projectQ || undefined,
        content_status: statusFilter || undefined,
      }),
  });

  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
    setError: setCharactersError,
    reload: reloadCharacters,
    invalidate: invalidateCharacters,
  } = useAdminList<PaginatedResponse<AdminCharacter>>({
    queryKey: adminQueryKeys.characters(characterPage, characterQ, statusFilter || undefined),
    fetcher: () =>
      adminApi.characters({
        limit: PAGE_SIZE,
        offset: characterPage * PAGE_SIZE,
        q: characterQ || undefined,
        content_status: statusFilter || undefined,
      }),
  });

  const takeDownProject = async () => {
    if (!pendingTakeDown) return;
    setBusy(true);
    try {
      await adminApi.setProjectStatus(pendingTakeDown.id, "taken_down");
      showToast("已强制下架该作品", "success");
      setPendingTakeDown(null);
      setInspect(null);
      invalidateProjects();
      invalidateModeration();
      invalidateStats();
    } catch (e) {
      setProjectsError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const takeDownCharacter = async () => {
    if (!pendingCharacterDown) return;
    setBusy(true);
    try {
      await adminApi.setCharacterStatus(pendingCharacterDown.id, "taken_down");
      showToast("已强制下架该角色", "success");
      setPendingCharacterDown(null);
      setInspect(null);
      invalidateCharacters();
      invalidateModeration();
      invalidateStats();
    } catch (e) {
      setCharactersError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const projectColumns: DataTableColumn<AdminProject>[] = [
    {
      key: "title",
      header: "标题",
      render: (p) => (
        <button
          type="button"
          className="text-left hover:text-brand"
          onClick={() => setInspect({ type: "project", id: p.id, title: p.title })}
        >
          {p.title}
        </button>
      ),
    },
    { key: "status", header: "状态", render: (p) => <StatusBadge status={p.content_status} /> },
    {
      key: "author",
      header: "作者",
      render: (p) => (
        <span className="font-mono text-[10px] text-ink-muted">{p.author_id}</span>
      ),
    },
    { key: "play", header: "播放", render: (p) => p.play_count },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <div className="flex gap-1">
          <a
            href={webDiscoverUrl(`/discover/projects/${p.id}`) ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-brand hover:underline"
          >
            主站
          </a>
          {p.content_status !== "taken_down" && (
            <Button size="sm" variant="danger" onClick={() => setPendingTakeDown(p)}>
              下架
            </Button>
          )}
        </div>
      ),
    },
  ];

  const characterColumns: DataTableColumn<AdminCharacter>[] = [
    {
      key: "name",
      header: "名称",
      render: (c) => (
        <button
          type="button"
          className="text-left hover:text-brand"
          onClick={() => setInspect({ type: "character", id: c.id, title: c.name })}
        >
          {c.name}
        </button>
      ),
    },
    { key: "status", header: "状态", render: (c) => <StatusBadge status={c.content_status} /> },
    {
      key: "author",
      header: "作者",
      render: (c) => (
        <span className="font-mono text-[10px] text-ink-muted">{c.author_id}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex gap-1">
          <a
            href={webDiscoverUrl(`/discover/characters/${c.id}`) ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-brand hover:underline"
          >
            主站
          </a>
          {c.content_status !== "taken_down" && (
            <Button size="sm" variant="danger" onClick={() => setPendingCharacterDown(c)}>
              下架
            </Button>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: "published", label: "已发布" },
    { value: "draft", label: "草稿" },
    { value: "taken_down", label: "已下架" },
  ] as const;

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col">
      <PageHeader
        dense
        title="内容管理"
        description="检索作品与角色 · 检视详情 · 强制下架"
        action={
          <SegmentedControl
            value={tab}
            onChange={(v) => {
              setTab(v);
              setInspect(null);
            }}
            size="sm"
            options={[
              { value: "projects", label: "作品" },
              { value: "characters", label: "角色" },
            ]}
          />
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input
            placeholder={tab === "projects" ? "搜索作品标题…" : "搜索角色名称…"}
            value={tab === "projects" ? projectQInput : characterQInput}
            onChange={(e) =>
              tab === "projects"
                ? setProjectQInput(e.target.value)
                : setCharacterQInput(e.target.value)
            }
          />
        </div>
        <SegmentedControl
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setProjectPage(0);
            setCharacterPage(0);
          }}
          size="sm"
          options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="min-h-0 overflow-y-auto">
          {tab === "projects" && (
            <>
              {projectsError && <ErrorDisplay message={projectsError} onRetry={reloadProjects} />}
              <DataTable
                columns={projectColumns}
                rows={projects?.items ?? []}
                rowKey={(p) => p.id}
                loading={projectsLoading}
                emptyTitle="暂无作品"
              />
              {projects && (
                <Pagination
                  page={projectPage}
                  pageSize={PAGE_SIZE}
                  total={projects.total}
                  onPageChange={setProjectPage}
                />
              )}
            </>
          )}

          {tab === "characters" && (
            <>
              {charactersError && (
                <ErrorDisplay message={charactersError} onRetry={reloadCharacters} />
              )}
              <DataTable
                columns={characterColumns}
                rows={characters?.items ?? []}
                rowKey={(c) => c.id}
                loading={charactersLoading}
                emptyTitle="暂无角色"
              />
              {characters && (
                <Pagination
                  page={characterPage}
                  pageSize={PAGE_SIZE}
                  total={characters.total}
                  onPageChange={setCharacterPage}
                />
              )}
            </>
          )}
        </div>

        {inspect ? (
          <ContentInspectPanel
            targetType={inspect.type}
            targetId={inspect.id}
            title={inspect.title}
            busy={busy}
            onTakeDown={() => {
              if (inspect.type === "project") {
                const row = projects?.items.find((p) => p.id === inspect.id);
                if (row) setPendingTakeDown(row);
              } else {
                const row = characters?.items.find((c) => c.id === inspect.id);
                if (row) setPendingCharacterDown(row);
              }
            }}
          />
        ) : (
          <div className="hidden rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-ink-muted lg:flex lg:items-center lg:justify-center">
            点击标题检视内容与作者上下文
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingCharacterDown}
        onClose={() => setPendingCharacterDown(null)}
        onConfirm={takeDownCharacter}
        title="确认强制下架该角色？"
        description={
          pendingCharacterDown
            ? `「${pendingCharacterDown.name}」将记录违规并 strike 作者。`
            : undefined
        }
        confirmLabel="确认下架"
        danger
        loading={busy}
      />

      <ConfirmDialog
        open={!!pendingTakeDown}
        onClose={() => setPendingTakeDown(null)}
        onConfirm={takeDownProject}
        title="确认强制下架该作品？"
        description={
          pendingTakeDown ? `《${pendingTakeDown.title}》将立即转为不可见。` : undefined
        }
        confirmLabel="确认下架"
        danger
        loading={busy}
      />
    </div>
  );
}
