import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FileUp, Plus, ScrollText } from "lucide-react";

import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from "@/shared/hooks/useProjects";
import DiscoverBrowseLink from "@/features/discover/components/DiscoverBrowseLink";
import Shell from "@/shared/components/Shell";
import {
  Badge,
  Button,
  CardGrid,
  EmptyState,
  EntityCard,
  ErrorDisplay,
  FilterChip,
  FilterToolbar,
  Input,
  Modal,
  ModalActions,
  PageHeader,
  SegmentedControl,
  Select,
  WorkflowGuide,
} from "@/shared/components/ui";
import type { ProjectResponse } from "@/shared/types/project";
import { getCreatorId } from "@/shared/lib/creatorId";
import { createStorageProvider, importProjectFromAxsp, openBinaryFile } from "@/shared/storage";
import { PROJECT_WORKFLOW } from "@/shared/lib/workflowSteps";
import { projectApi } from "@/shared/api/editor";

const MECHANISMS = [
  "日常校园",
  "密室逃脱",
  "末日生存",
  "悬疑推理",
  "奇幻冒险",
  "星际探索",
  "宫廷权谋",
  "赛博朋克",
];
const GENRES = ["恋爱", "悬疑", "科幻", "奇幻", "历史", "恐怖", "喜剧", "正剧"];

function ProjectCard({
  project,
  onDelete,
}: {
  project: ProjectResponse;
  onDelete: () => void;
}) {
  return (
    <EntityCard
      to={`/studio/projects/${project.id}`}
      title={project.title}
      description={project.description || "暂无描述"}
      onDelete={onDelete}
      badges={
        <>
          {project.is_meta && (
            <Badge variant="amber" size="sm">
              元剧本
            </Badge>
          )}
          <Badge variant={project.is_public ? "emerald" : "default"} size="sm">
            {project.is_public ? "公开" : "私有"}
          </Badge>
          {project.mechanism && (
            <Badge variant="default" size="sm">
              {project.mechanism}
            </Badge>
          )}
          {project.genre && (
            <Badge variant="default" size="sm">
              {project.genre}
            </Badge>
          )}
          {project.theme_tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="brand" size="sm">
              {t}
            </Badge>
          ))}
        </>
      }
      meta={
        [
          project.scenes?.length ? `${project.scenes.length} 章节` : "",
          project.roles?.length ? `${project.roles.length} 角色` : "",
        ]
          .filter(Boolean)
          .join(" · ") || undefined
      }
    />
  );
}

export default function ProjectListPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<"my" | "template">("my");
  const [templates, setTemplates] = useState<ProjectResponse[]>([]);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterMechanism, setFilterMechanism] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMeta, setFilterMeta] = useState(false);
  const navigate = useNavigate();

  const { data: projects, isLoading, error } = useProjects(
    tab === "my" ? { author_id: getCreatorId() } : undefined,
  );
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (tab !== "template") return;
    projectApi
      .listTemplates({ limit: 50 })
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [tab]);

  const handleFork = async (id: string) => {
    setForkingId(id);
    try {
      const forked = await projectApi.fork(id, { author_id: getCreatorId() });
      navigate(`/studio/projects/${forked.id}`);
    } catch {
      setForkingId(null);
    }
  };

  const allTags = [
    ...new Set((projects || []).flatMap((p) => p.theme_tags)),
  ].sort();

  const filtered = (projects || []).filter((p) => {
    if (
      debouncedSearch &&
      !p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      !p.description.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
      return false;
    if (
      filterTags.length > 0 &&
      !filterTags.some((t) => p.theme_tags.includes(t))
    )
      return false;
    if (filterMechanism && p.mechanism !== filterMechanism) return false;
    if (filterGenre && p.genre !== filterGenre) return false;
    if (filterMeta && !p.is_meta) return false;
    return true;
  });

  const hasFilters = filterTags.length > 0 || filterMechanism || filterGenre;
  const filterCount = [filterTags.length, filterMechanism, filterGenre].filter(
    Boolean,
  ).length;

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const project = await createProject.mutateAsync({
        title: title.trim(),
        author_id: getCreatorId(),
      });
      setShowCreate(false);
      setTitle("");
      navigate(`/studio/projects/${project.id}`);
    } catch {
      setShowCreate(false);
      setTitle("");
    }
  };

  return (
    <Shell>
      <PageHeader
        title="剧本"
        description="创建和管理叙事剧本"
        action={
          <div className="flex items-center gap-2">
            <DiscoverBrowseLink tab="projects" />
            <Button
              size="sm"
              variant="ghost"
              icon={<FileUp className="h-4 w-4" strokeWidth={1.75} />}
              onClick={async () => {
                const bytes = await openBinaryFile(".axsp");
                if (!bytes) return;
                try {
                  const provider = await createStorageProvider();
                  const res = await importProjectFromAxsp(provider, bytes);
                  if (res.ok) {
                    navigate(`/studio/projects/${res.data.id}`);
                  } else {
                    alert(`导入失败：${res.error.code === "corrupted" ? "文件格式不正确" : (res.error.code + " — " + ((res.error as {detail?: string}).detail ?? ""))}`);
                  }
                } catch {
                  alert("导入失败：文件无法读取");
                }
              }}
            >
              导入 .axsp
            </Button>
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
              onClick={() => setShowCreate(true)}
            >
              新建剧本
            </Button>
          </div>
        }
      />

      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索剧本..."
        expanded={
          showFilters ? (
            <div className="space-y-4">
              {allTags.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                    标签
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((t) => (
                      <FilterChip
                        key={t}
                        label={t}
                        active={filterTags.includes(t)}
                        onClick={() =>
                          setFilterTags((prev) =>
                            prev.includes(t)
                              ? prev.filter((x) => x !== t)
                              : [...prev, t],
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="机制"
                  value={filterMechanism}
                  onChange={(e) => setFilterMechanism(e.target.value)}
                >
                  <option value="">全部</option>
                  {MECHANISMS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
                <Select
                  label="题材"
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                >
                  <option value="">全部</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : undefined
        }
      >
        <FilterChip
          label="元剧本"
          active={filterMeta}
          onClick={() => setFilterMeta(!filterMeta)}
          className="inline-flex items-center gap-1"
        />
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "my", label: "我的" },
            { value: "template", label: "模板" },
          ]}
        />
        <Button
          variant={showFilters || hasFilters ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          筛选{filterCount > 0 ? ` (${filterCount})` : ""}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => {
              setFilterTags([]);
              setFilterMechanism("");
              setFilterGenre("");
            }}
          >
            清除
          </Button>
        )}
      </FilterToolbar>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建剧本"
        description="为你的叙事世界取一个名字"
        footer={
          <ModalActions
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
            confirmLabel={createProject.isPending ? "创建中..." : "创建"}
            loading={createProject.isPending}
            disabled={!title.trim()}
          />
        }
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && title.trim() && handleCreate()}
          placeholder="剧本标题"
          autoFocus
        />
      </Modal>

      {tab === "template" ? (
        templates.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="暂无模板"
            description="官方或社区发布的元剧本会出现在这里，可一键 Fork 为你的作品"
          >
            <WorkflowGuide steps={PROJECT_WORKFLOW} compact className="max-w-2xl" />
          </EmptyState>
        ) : (
          <CardGrid>
            {templates.map((p) => (
              <EntityCard
                key={p.id}
                to={`/studio/projects/${p.id}`}
                title={p.title}
                description={p.description || "暂无描述"}
                badges={
                  <Badge variant="amber" size="sm">
                    模板
                  </Badge>
                }
                footer={
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={forkingId === p.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFork(p.id);
                    }}
                  >
                    {forkingId === p.id ? "创建中..." : "以此创建"}
                  </Button>
                }
              />
            ))}
          </CardGrid>
        )
      ) : (
        <>
      {isLoading && (
        <p className="py-10 text-center text-sm text-ink-muted">加载中...</p>
      )}
      {error && (
        <ErrorDisplay message="剧本清单读取失败" onRetry={() => window.location.reload()} />
      )}
      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title={hasFilters || filterMeta ? "没有匹配的剧本" : "还没有剧本"}
          description={
            hasFilters || filterMeta
              ? "试试调整筛选条件"
              : "创建第一个叙事剧本"
          }
        >
          {!hasFilters && !filterMeta && (
            <WorkflowGuide steps={PROJECT_WORKFLOW} compact className="max-w-2xl" />
          )}
        </EmptyState>
      )}
      {filtered.length > 0 && (
        <CardGrid>
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={() => {
                if (confirm("删除？")) deleteProject.mutate(p.id);
              }}
            />
          ))}
        </CardGrid>
      )}
        </>
      )}
    </Shell>
  );
}
