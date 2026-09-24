import { useState, type ComponentType } from "react";
import { Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { useParams, useNavigate, Link } from "react-router";
import {
  Anchor,
  BookOpen,
  Brain,
  Drama,
  Copy,
  Download,
  Eye,
  FileText,
  GitFork,
  Globe,
  History,
  Link2,
  Lock,
  Network,
  Pencil,
  ScrollText,
  Share2,
  Trash2,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useCharacter,
  useDeleteCharacter,
  useForkCharacter,
} from "@/shared/hooks/useCharacters";
import { ErrorDisplay, Button, BackLink, Modal } from "@/shared/components/ui";
import Shell from "@/shared/components/Shell";
import {
  ForkDialog,
  RelationList,
  AddRelationDialog,
  RelationGraph,
} from "@/features/character";
import type { CharacterData } from "@/shared/types/character";
import { Skeleton } from "@/shared/components/ui";
import StoryList from "@/features/character/components/StoryList";
import CreateStoryDialog from "@/features/character/components/CreateStoryDialog";
import VersionPanel from "@/features/character/components/VersionPanel";
import { versionApi } from "@/shared/api/versions";
import { characterApi } from "@/shared/api/characters";
import { renderCharacterPrompt } from "@/shared/lib/promptRenderer";
import { routes } from "@/shared/lib/routes";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

const layerTabs: {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}[] = [
  {
    key: "anchor",
    label: "锚点",
    Icon: Anchor,
    color: "bg-brand-muted text-brand border-border",
  },
  {
    key: "psyche",
    label: "内心",
    Icon: Brain,
    color: "bg-danger/10 text-danger border-danger/25",
  },
  {
    key: "contour",
    label: "轮廓",
    Icon: UserRound,
    color: "bg-panel text-ink border-border",
  },
  {
    key: "demeanor",
    label: "举止",
    Icon: Drama,
    color: "bg-accent-soft/10 text-accent-soft border-accent-soft/25",
  },
  {
    key: "trace",
    label: "轨迹",
    Icon: ScrollText,
    color: "bg-accent/10 text-accent border-accent/25",
  },
  {
    key: "bond",
    label: "羁绊",
    Icon: Link2,
    color: "bg-surface-raised text-ink-muted border-border-strong",
  },
];

const fieldLabels: Record<string, Record<string, string>> = {
  contour: {
    appearance: "外貌",
    age_era: "年龄/时代",
    identity: "身份",
    first_impression: "第一印象",
  },
  demeanor: {
    speech_style: "说话方式",
    habits: "习惯",
    typical_reaction: "常见反应",
    expressiveness: "情绪外露",
  },
  psyche: {
    desire: "深层欲望",
    fear: "核心恐惧",
    conflict: "内在矛盾",
    self_perception: "自我认知",
  },
  anchor: {
    name: "姓名",
    summary: "描述",
    essence: "概括",
    theme: "主题",
    core_belief: "信仰",
  },
  trace: { background: "出身背景", turning_point: "转折点" },
  bond: {
    attitude_to_others: "对他人态度",
    intimate_pattern: "亲密关系",
    hostile_pattern: "敌对关系",
    group_role: "群体角色",
  },
};

const mainTabs = [
  { key: "info" as const, label: "角色信息", Icon: FileText },
  { key: "relations" as const, label: "关系", Icon: Network },
  { key: "stories" as const, label: "传记", Icon: BookOpen },
  { key: "sprites" as const, label: "立绘", Icon: ImageIcon },
];

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading, error } = useCharacter(id!, { bumpView: true });
  const deleteCharacter = useDeleteCharacter();
  /** 关系/传记/版本/Fork/删除依赖协作服务：桌面离线态不给入口（见 deployment.ts） */
  const localOnly = isLocalOnlyDeployment();
  const forkCharacter = useForkCharacter();

  const [isForkOpen, setIsForkOpen] = useState(false);
  const [isAddRelationOpen, setIsAddRelationOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState("anchor");
  const [activeTab, setActiveTab] = useState<"info" | "relations" | "stories" | "sprites">(    "info",
  );
  const [copiedId, setCopiedId] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: versions } = useQuery({
    queryKey: ["versions", character?.id],
    queryFn: () => versionApi.list(character!.id),
    enabled: !!character,
  });
  const versionsCount = versions?.length || 0;
  const handleExportMarkdown = async () => {
    if (!character) return;
    setExporting(true);
    try {
      const data = await characterApi.export(character.id, {
        format: "markdown",
        include_stories: true,
        include_relations: true,
      });

      let md = renderCharacterPrompt(
        character.character_data as CharacterData,
        "markdown",
      );

      if ((data as any).stories?.length) {
        md += "\n\n## 传记\n\n";
        (data as any).stories.forEach((s: any) => {
          md += `### ${s.title}\n\n${s.content}\n\n`;
        });
      }
      if ((data as any).relations?.length) {
        md += "\n## 关系\n\n";
        (data as any).relations.forEach((r: any) => {
          md += `- ${r.relation_name}: ${r.target_name}\n`;
        });
      }

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `${character.name || "character"}.md`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("导出失败", e);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn space-y-6">
        <Skeleton className="h-4 w-24" />
        <div className="bg-surface rounded-2xl p-8 space-y-4">
          <div className="flex gap-6">
            <Skeleton className="w-28 h-28 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error)
    return (
      <ErrorDisplay
        message="加载角色失败"
        onRetry={() => window.location.reload()}
      />
    );
  if (!character) return <ErrorDisplay message="角色不存在" />;

  const cd = character.character_data as CharacterData;
  const displayName = character.name || cd?.anchor?.name || "未命名";

  const handleDelete = async () => {
    if (!confirm("确定要删除这个角色吗？此操作不可撤销。")) return;
    try {
      await deleteCharacter.mutateAsync(character.id);
      navigate(routes.characters.mine);
    } catch (err) {
      console.error("删除失败:", err);
      alert("删除失败");
    }
  };

  const handleFork = async (newName: string) => {
    const forked = await forkCharacter.mutateAsync({
      id: character.id,
      forkRequest: { new_name: newName },
    });
    navigate(routes.characters.detail(forked.id));
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(character.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderLayerFields = (layerKey: string) => {
    const data = (cd as any)[layerKey];
    if (!data) return <p className="text-ink-muted text-sm">未设定</p>;

    if (layerKey === "trace") {
      const hasTrace =
        data.background || data.turning_point || data.key_events?.length > 0;
      if (!hasTrace) return <p className="text-ink-muted text-sm">未设定</p>;
      return (
        <div className="space-y-3">
          {data.background && (
            <FieldRow label="出身背景" value={data.background} />
          )}
          {data.turning_point && (
            <FieldRow label="转折点" value={data.turning_point} />
          )}
          {data.key_events?.length > 0 && (
            <div>
              <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                关键事件
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {data.key_events.map((e: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded-full border border-accent/25"
                  >
                    {e}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      );
    }

    const entries = Object.entries(data).filter(([k]) => k !== "key_events");
    const filled = entries.filter(([_, v]) => v);
    if (filled.length === 0)
      return <p className="text-ink-muted text-sm">未设定</p>;
    return (
      <div className="space-y-3">
        {filled.map(([key, value]) => (
          <FieldRow
            key={key}
            label={fieldLabels[layerKey]?.[key] || key}
            value={value as string}
          />
        ))}
      </div>
    );
  };

  return (
    <Shell narrow>
      <ForkDialog
        character={character}
        isOpen={isForkOpen}
        onClose={() => setIsForkOpen(false)}
        onFork={handleFork}
        isForking={forkCharacter.isPending}
      />
      <AddRelationDialog
        characterId={character.id}
        isOpen={isAddRelationOpen}
        onClose={() => setIsAddRelationOpen(false)}
      />
      <CreateStoryDialog
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
      />

      <Modal
        open={isVersionOpen}
        onClose={() => setIsVersionOpen(false)}
        title="版本历史"
        size="lg"
      >
        <VersionPanel characterId={character.id} />
      </Modal>

      <BackLink to={routes.characters.mine}>我的角色</BackLink>
      <div className="mb-6 rounded-2xl border border-border bg-surface p-8 group/card relative overflow-hidden">
        <div className="absolute top-4 right-4 flex flex-col items-end gap-0.5 opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-300 ease-out z-10">
          <div className="flex items-center gap-1">
            {!localOnly && (
              <button
                onClick={() => setIsVersionOpen(true)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                {versionsCount} 个版本
              </button>
            )}
            <button
              onClick={async () => {
                const url = window.location.href;
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  const ta = document.createElement("textarea");
                  ta.value = url;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                }
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-brand"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              {copiedLink ? "已复制" : "分享"}
            </button>
          </div>
          <div className="h-px bg-canvas my-0.5 w-8" />
          <Button
            as="link"
            to={routes.characters.edit(character.id)}
            variant="ghost"
            size="sm"
            icon={<Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />}
          >
            编辑
          </Button>
          {!localOnly && (
            <Button
              onClick={() => setIsForkOpen(true)}
              variant="ghost"
              size="sm"
              icon={<GitFork className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              Fork
            </Button>
          )}
          {!localOnly && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="text-ink-muted hover:text-red-500"
              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              删除
            </Button>
          )}
          <div className="h-px bg-canvas my-0.5 w-8" />
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                if (!character) return;
                setCopying(true);
                try {
                  const data = await characterApi.export(character.id, {
                    format: "markdown",
                    include_stories: true,
                    include_relations: true,
                  });
                  let md = renderCharacterPrompt(
                    character.character_data as CharacterData,
                    "markdown",
                  );
                  if ((data as any).stories?.length) {
                    md += "\n\n## 传记\n\n";
                    (data as any).stories.forEach((s: any) => {
                      md += `### ${s.title}\n\n${s.content}\n\n`;
                    });
                  }
                  if ((data as any).relations?.length) {
                    md += "\n## 关系\n\n";
                    (data as any).relations.forEach((r: any) => {
                      md += `- ${r.relation_name}: ${r.target_name}\n`;
                    });
                  }
                  try {
                    await navigator.clipboard.writeText(md);
                  } catch {
                    const ta = document.createElement("textarea");
                    ta.value = md;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                  }
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                } catch {
                } finally {
                  setCopying(false);
                }
              }}
              disabled={copying}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand transition-colors py-1 px-2 rounded-lg hover:bg-canvas disabled:opacity-50"
            >
              {copying ? "..." : copiedText ? (
                <>已复制</>
              ) : (
                <>
                  <Copy className="h-3 w-3" strokeWidth={1.75} />
                  设定复制
                </>
              )}
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={exporting}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand transition-colors py-1 px-2 rounded-lg hover:bg-canvas disabled:opacity-50"
            >
              {exporting ? "..." : (
                <>
                  <Download className="h-3 w-3" strokeWidth={1.75} />
                  设定导出
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-8">
          <div className="group/img flex-shrink-0 relative">
            {character.image_path ? (
              <img
                src={character.image_path}
                alt=""
                className="w-28 h-28 rounded-2xl object-cover shadow-lg transition-transform duration-300 group-hover/img:scale-[1.05]"
              />
            ) : (
              <div className="w-28 h-28 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-purple-200 transition-transform duration-300 group-hover/img:scale-[1.05]">
                {displayName[0]}
              </div>
            )}
            {/* 浏览量角标 */}
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-[10px] bg-surface border border-border rounded-full shadow-sm text-ink-muted inline-flex items-center gap-0.5">
              <Eye className="h-3 w-3" strokeWidth={1.75} />
              {(character.view_count ?? 0) > 999
                ? `${((character.view_count ?? 0) / 1000).toFixed(1)}k`
                : (character.view_count ?? 0)}
            </span>
          </div>

          <div className="flex-1 min-w-0 self-center">
            <h1 className="text-2xl font-bold text-ink mb-1">
              {displayName}
            </h1>
            {cd?.anchor?.essence && (
              <p className="text-ink-muted mb-3 line-clamp-2">
                {cd.anchor.essence}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${character.is_public ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-border bg-canvas text-ink-muted"}`}
              >
                {character.is_public ? (
                  <Globe className="h-3 w-3" strokeWidth={1.75} />
                ) : (
                  <Lock className="h-3 w-3" strokeWidth={1.75} />
                )}
                {character.is_public ? "公开" : "私有"}
              </span>
              {character.tags.length > 0 && (
                <span className="mx-1 h-4 w-px bg-border" />
              )}
              {character.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-1 text-xs font-medium rounded-full border"
                  style={{
                    color: tag.color,
                    borderColor: tag.color + "40",
                    backgroundColor: tag.color + "10",
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Fork 来源 + Fork 链 */}
            <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1 text-ink-muted hover:text-brand transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copiedId ? "✓ 已复制" : "复制 ID"}
              </button>
              <span className="text-border">·</span>
              {character.fork_from ? (
                <span>
                  Fork{" "}
                  <Link
                    to={routes.characters.detail(character.fork_from)}
                    className="text-brand hover:opacity-80"
                  >
                    原始角色
                  </Link>
                </span>
              ) : (
                <span className="text-ink-muted/40">原始角色</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 mb-6 bg-canvas p-1 rounded-xl">
        {mainTabs
          .filter((t) => !localOnly || t.key === "info" || t.key === "sprites")
          .map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === key ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* 角色信息 */}
      {activeTab === "info" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {layerTabs.map(({ key, label, Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${activeLayer === key ? color + " shadow-sm" : "border-border text-ink-muted hover:bg-canvas"}`}
              >
                <Icon className="mb-1 h-5 w-5" strokeWidth={1.75} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 animate-fade-in">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink">
              {(() => {
                const layer = layerTabs.find((l) => l.key === activeLayer);
                if (!layer) return null;
                const LayerIcon = layer.Icon;
                return (
                  <>
                    <LayerIcon className="h-5 w-5" strokeWidth={1.75} />
                    {layer.label}
                  </>
                );
              })()}
            </h2>
            {renderLayerFields(activeLayer)}
          </div>
        </div>
      )}

      {/* 关系 */}
      {activeTab === "relations" && (
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">关系图谱</h2>
              <Button size="sm" onClick={() => setIsAddRelationOpen(true)}>
                + 添加关系
              </Button>
            </div>
            <RelationGraph characterId={character.id} />
          </div>
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">
              关系列表
            </h2>
            <RelationList characterId={character.id} />
          </div>
        </div>
      )}

      {/* 传记 */}
      {activeTab === "stories" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">人物传记</h2>
            <Button size="sm" onClick={() => setIsCreateStoryOpen(true)}>
              + 新建篇章
            </Button>
          </div>
          <StoryList />
        </div>
      )}

      {/* 立绘 */}
      {activeTab === "sprites" && (() => {
        const cd = character.character_data as CharacterData;
        const sprites = (cd?.sprites || {}) as Record<string, string>;
        const entries = Object.entries(sprites);
        return (
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">立绘管理</h2>
              <Button
                size="sm"
                onClick={() => navigate(`/studio/characters/${character.id}/edit`)}
              >
                编辑立绘
              </Button>
            </div>
            {entries.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">
                暂无立绘差分。点击「编辑立绘」添加表情差分图片。
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {entries.map(([key, url]) => (
                  <div
                    key={key}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border p-3"
                  >
                    {url ? (
                      <img
                        src={getImageUrl(url) || url}
                        alt={key}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-canvas text-lg font-semibold text-ink-faint">
                        {key[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-ink-muted">{key}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <div className="mt-6 text-xs text-ink-muted/40 flex justify-between">
        <span>
          创建于 {new Date(character.created_at).toLocaleDateString()}
        </span>
        <span>
          更新于 {new Date(character.updated_at).toLocaleDateString()}
        </span>
      </div>
    </Shell>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-ink leading-relaxed">{value}</dd>
    </div>
  );
}
