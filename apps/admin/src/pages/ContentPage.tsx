import { useState } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  ErrorDisplay,
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
import { useAdminList } from "@/hooks/useAdminList";

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

export default function ContentPage() {
  const [tab, setTab] = useState<"projects" | "characters">("projects");
  const [projectPage, setProjectPage] = useState(0);
  const [characterPage, setCharacterPage] = useState(0);
  const [pendingTakeDown, setPendingTakeDown] = useState<AdminProject | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const {
    data: projects,
    loading: projectsLoading,
    error: projectsError,
    setError: setProjectsError,
    reload: reloadProjects,
  } = useAdminList<PaginatedResponse<AdminProject>>({
    fetcher: () => adminApi.projects({ limit: PAGE_SIZE, offset: projectPage * PAGE_SIZE }),
    deps: [projectPage],
  });

  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
    reload: reloadCharacters,
  } = useAdminList<PaginatedResponse<AdminCharacter>>({
    fetcher: () => adminApi.characters({ limit: PAGE_SIZE, offset: characterPage * PAGE_SIZE }),
    deps: [characterPage],
  });

  const takeDownProject = async () => {
    if (!pendingTakeDown) return;
    setBusy(true);
    try {
      await adminApi.setProjectStatus(pendingTakeDown.id, "taken_down");
      showToast("已强制下架该作品", "success");
      setPendingTakeDown(null);
      reloadProjects();
    } catch (e) {
      setProjectsError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const projectColumns: DataTableColumn<AdminProject>[] = [
    { key: "title", header: "标题", render: (p) => p.title },
    { key: "status", header: "状态", render: (p) => <StatusBadge status={p.content_status} /> },
    { key: "play", header: "播放", render: (p) => p.play_count },
    { key: "view", header: "浏览", render: (p) => p.view_count },
    {
      key: "actions",
      header: "",
      render: (p) =>
        p.content_status !== "taken_down" && (
          <Button size="sm" variant="danger" onClick={() => setPendingTakeDown(p)}>
            强制下架
          </Button>
        ),
    },
  ];

  const characterColumns: DataTableColumn<AdminCharacter>[] = [
    { key: "name", header: "名称", render: (c) => c.name },
    { key: "status", header: "状态", render: (c) => <StatusBadge status={c.content_status} /> },
    { key: "view", header: "浏览", render: (c) => c.view_count },
  ];

  return (
    <div>
      <PageHeader
        title="内容管理"
        description="全量检索作品与角色，处理强制下架"
        action={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "projects", label: "作品" },
              { value: "characters", label: "角色" },
            ]}
          />
        }
      />

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
          {charactersError && <ErrorDisplay message={charactersError} onRetry={reloadCharacters} />}
          <DataTable
            columns={characterColumns}
            rows={characters?.items ?? []}
            rowKey={(c) => c.id}
            loading={charactersLoading}
            emptyTitle="暂无角色"
            emptyDescription="角色目前只支持只读检索，暂无独立下架接口"
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

      <ConfirmDialog
        open={!!pendingTakeDown}
        onClose={() => setPendingTakeDown(null)}
        onConfirm={takeDownProject}
        title="确认强制下架该作品？"
        description={pendingTakeDown ? `《${pendingTakeDown.title}》将立即转为不可见。` : undefined}
        confirmLabel="确认下架"
        danger
        loading={busy}
      />
    </div>
  );
}
