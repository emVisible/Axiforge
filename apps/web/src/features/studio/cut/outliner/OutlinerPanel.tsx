import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Node } from "reactflow";
import {
  Clapperboard,
  Film,
  Inbox,
  Link2,
  Network,
  Package,
  Play,
  ScrollText,
  Settings2,
  Users,
} from "lucide-react";
import { cn } from "@/shared/components/ui";
import CharacterSearchSelect from "@/features/character/components/CharacterSearchSelect";
import { EntitySearchSelect } from "@/shared/components/ui";
import { searchImportItems, searchImportScenes } from "@/shared/storage/assetPoolSaves";
import { getImageUrl } from "@/shared/lib/imageUrl";
import type { ProjectResponse, ProjectRoleResponse, ProjectSceneResponse } from "@/shared/types/project";
import type { ProjectMetaPatch } from "@axiforge/editor-core";
import type { ProjectRoleOption } from "../../flow/types";
import { nexusApi } from "@/shared/api/nexus";
import { getCreatorId } from "@/shared/lib/creatorId";
import OutlinerSection, { OutlinerRow } from "./OutlinerSection";
import { routes } from "@/shared/lib/routes";

type SectionKey = "beats" | "scenes" | "roles" | "assets" | "project";

interface OutlinerPanelProps {
  project: ProjectResponse;
  beats: Node[];
  selectedBeatId: string | null;
  onSelectBeat: (nodeId: string) => void;
  sceneFilterId: string | null;
  onSceneFilterChange: (sceneId: string | null) => void;
  roles: ProjectRoleOption[];
  projectRoles: ProjectRoleResponse[];
  itemRefs: { id: string; asset_id: string; name: string }[];
  onAddScene: (title: string) => void | Promise<void>;
  onImportScene: (assetId: string) => void | Promise<void>;
  onDeleteScene: (sceneId: string) => void | Promise<void>;
  onAddRole: (characterId: string, name: string) => void | Promise<void>;
  onRemoveRole: (roleId: string) => void | Promise<void>;
  onAddItem: (itemId: string) => void | Promise<void>;
  onRemoveItemRef: (refId: string) => void | Promise<void>;
  onOpenFlow: () => void;
  onOpenWriter: () => void;
  onExportMarkdown?: () => void;
  onDeleteProject?: () => void;
  onBeatRename?: (nodeId: string, title: string) => void;
  onProjectPatch?: (patch: ProjectMetaPatch) => void | Promise<void>;
}

export default function OutlinerPanel({
  project,
  beats,
  selectedBeatId,
  onSelectBeat,
  sceneFilterId,
  onSceneFilterChange,
  roles,
  projectRoles,
  itemRefs,
  onAddScene,
  onImportScene,
  onDeleteScene,
  onAddRole,
  onRemoveRole,
  onAddItem,
  onRemoveItemRef,
  onOpenFlow,
  onOpenWriter,
  onExportMarkdown,
  onDeleteProject,
  onBeatRename,
  onProjectPatch,
}: OutlinerPanelProps) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    beats: true,
    scenes: true,
    roles: false,
    assets: false,
    project: false,
  });
  const [beatQuery, setBeatQuery] = useState("");
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const [editBeatTitle, setEditBeatTitle] = useState("");
  const [nexusBusy, setNexusBusy] = useState(false);
  const [nexusHint, setNexusHint] = useState<string | null>(null);

  const sendToNexus = async () => {
    setNexusBusy(true);
    setNexusHint(null);
    try {
      const excerpt = (project.description || project.world_setting || "").slice(0, 500);
      await nexusApi.sendToInbox({
        author_id: getCreatorId(),
        title: project.title,
        body: `# ${project.title}\n\n[[project:${project.id}]]\n\n${excerpt}`,
        related_projects: [project.id],
      });
      setNexusHint("已发送到 Nexus 收件箱");
    } catch {
      setNexusHint("发送失败，请确认后端已启动");
    } finally {
      setNexusBusy(false);
    }
  };

  const toggle = (key: SectionKey) =>
    setOpen((s) => ({ ...s, [key]: !s[key] }));

  const filteredBeats = useMemo(() => {
    let list = beats;
    if (sceneFilterId) {
      list = list.filter((n) => n.data.stage_id === sceneFilterId);
    }
    const q = beatQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((n) =>
      ((n.data.title as string) || "未命名").toLowerCase().includes(q),
    );
  }, [beats, sceneFilterId, beatQuery]);

  const scenes = project.scenes || [];
  const filterScene = scenes.find((s) => s.id === sceneFilterId);

  const nexusNotes = useMemo(() => {
    const meta = project.play_meta;
    if (!meta || typeof meta !== "object") return [];
    const raw = (meta as Record<string, unknown>).nexus_notes;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (e): e is { text: string; created_at?: string } =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as { text?: unknown }).text === "string",
      )
      .slice(-5);
  }, [project.play_meta]);

  const commitBeatRename = (nodeId: string) => {
    const title = editBeatTitle.trim() || "未命名";
    onBeatRename?.(nodeId, title);
    setEditingBeatId(null);
  };

  const sceneHint = (scene: ProjectSceneResponse) =>
    [scene.location, scene.atmosphere].filter(Boolean).join(" · ") || undefined;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-panel">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <p className="text-3xs font-semibold uppercase tracking-widest text-ink-faint">
          Outliner
        </p>
        <p className="truncate text-xs font-medium text-ink">{project.title}</p>
        {filterScene && (
          <p className="mt-0.5 truncate text-3xs text-accent-soft">
            筛选 · {filterScene.title}
          </p>
        )}
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={onOpenFlow}
            className="flex flex-1 items-center justify-center gap-1 rounded bg-panel-raised py-1 text-3xs text-ink-muted hover:text-ink"
          >
            <Network className="h-3 w-3" />
            结构
          </button>
          <button
            type="button"
            onClick={onOpenWriter}
            className="flex flex-1 items-center justify-center gap-1 rounded bg-panel-raised py-1 text-3xs text-ink-muted hover:text-ink"
          >
            <ScrollText className="h-3 w-3" />
            剧本
          </button>
          <Link
            to={routes.play(project.id)}
            className="flex flex-1 items-center justify-center gap-1 rounded bg-panel-raised py-1 text-3xs text-ink-muted hover:text-ink"
          >
            <Play className="h-3 w-3" />
            试玩
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <OutlinerSection
          title="序列 Beats"
          icon={<Film className="h-3 w-3 text-accent-soft" />}
          count={filteredBeats.length}
          open={open.beats}
          onToggle={() => toggle("beats")}
        >
          <input
            value={beatQuery}
            onChange={(e) => setBeatQuery(e.target.value)}
            placeholder="筛选…"
            className="mb-1.5 w-full rounded bg-surface-raised px-2 py-1 text-3xs text-ink outline-none placeholder:text-ink-faint"
          />
          {filteredBeats.length === 0 ? (
            <p className="px-1 py-2 text-3xs text-ink-faint">无 Beat</p>
          ) : (
            filteredBeats.map((node, idx) =>
              editingBeatId === node.id ? (
                <div key={node.id} className="px-1.5 py-1">
                  <input
                    autoFocus
                    value={editBeatTitle}
                    onChange={(e) => setEditBeatTitle(e.target.value)}
                    onBlur={() => commitBeatRename(node.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitBeatRename(node.id);
                      if (e.key === "Escape") setEditingBeatId(null);
                    }}
                    className="w-full rounded bg-surface-raised px-2 py-1 text-2xs text-ink outline-none ring-1 ring-brand/40"
                  />
                </div>
              ) : (
                <OutlinerRow
                  key={node.id}
                  active={node.id === selectedBeatId}
                  onClick={() => onSelectBeat(node.id)}
                  onDoubleClick={() => {
                    if (!onBeatRename) return;
                    setEditingBeatId(node.id);
                    setEditBeatTitle((node.data.title as string) || "");
                  }}
                >
                  <span className="font-mono text-3xs text-ink-faint">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate">
                    {(node.data.title as string) || "未命名"}
                  </span>
                  {!sceneFilterId && node.data.stage_title ? (
                    <span className="ml-auto shrink-0 truncate text-3xs text-ink-faint">
                      {String(node.data.stage_title)}
                    </span>
                  ) : null}
                </OutlinerRow>
              ),
            )
          )}
        </OutlinerSection>

        <OutlinerSection
          title="舞台"
          icon={<Clapperboard className="h-3 w-3 text-accent-soft" />}
          count={scenes.length}
          open={open.scenes}
          onToggle={() => toggle("scenes")}
        >
          <OutlinerRow
            active={sceneFilterId === null}
            onClick={() => onSceneFilterChange(null)}
          >
            <span className="text-accent-soft">◎</span>
            <span>全部舞台</span>
          </OutlinerRow>
          {scenes.map((scene) => (
            <SceneRow
              key={scene.id}
              scene={scene}
              hint={sceneHint(scene)}
              active={sceneFilterId === scene.id}
              onSelect={() => onSceneFilterChange(scene.id)}
              onDelete={() => {
                if (confirm(`删除舞台「${scene.title}」？`)) onDeleteScene(scene.id);
              }}
            />
          ))}
          <div className="mt-1.5 flex gap-1">
            <input
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSceneTitle.trim()) {
                  void onAddScene(newSceneTitle.trim());
                  setNewSceneTitle("");
                }
              }}
              placeholder="新舞台…"
              className="min-w-0 flex-1 rounded bg-surface-raised px-2 py-1 text-3xs text-ink outline-none"
            />
            <button
              type="button"
              disabled={!newSceneTitle.trim()}
              onClick={() => {
                void onAddScene(newSceneTitle.trim());
                setNewSceneTitle("");
              }}
              className="shrink-0 rounded bg-panel-raised px-2 py-1 text-3xs text-ink disabled:opacity-40"
            >
              +
            </button>
          </div>
          <div className="mt-1.5 [&_input]:text-3xs">
            <EntitySearchSelect
              fetcher={searchImportScenes}
              onSelect={(item) => void onImportScene(item.id)}
              placeholder="从舞台库导入…"
            />
          </div>
        </OutlinerSection>

        <OutlinerSection
          title="角色"
          icon={<Users className="h-3 w-3 text-accent-soft" />}
          count={roles.length}
          open={open.roles}
          onToggle={() => toggle("roles")}
        >
          {roles.length === 0 ? (
            <p className="px-1 py-2 text-3xs text-ink-faint">暂无角色</p>
          ) : (
            roles.map((role) => {
              const pr = projectRoles.find((r) => r.character_ref_id === role.characterRefId);
              return (
                <div
                  key={role.roleId}
                  className="group/role rounded hover:bg-surface-raised"
                >
                  <div className="flex items-center justify-between px-1.5 py-1">
                    <Link
                      to={routes.characters.detail(role.characterRefId)}
                      className="min-w-0 truncate text-2xs text-ink-muted hover:text-ink"
                    >
                      {role.name}
                    </Link>
                    {pr && (
                      <button
                        type="button"
                        onClick={() => onRemoveRole(pr.id)}
                        className="text-3xs text-ink-faint opacity-0 hover:text-red-400 group-hover/role:opacity-100"
                      >
                        移除
                      </button>
                    )}
                  </div>
                  {role.spriteKeys && role.spriteKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1.5 pb-1">
                      {role.spriteKeys.map((key) => {
                        const src = getImageUrl(role.sprites?.[key]);
                        return (
                          <div
                            key={key}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/axiforge/sprite",
                                JSON.stringify({
                                  characterId: role.characterRefId,
                                  expression: key,
                                }),
                              );
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            className="flex cursor-grab flex-col items-center gap-0.5 rounded border border-border bg-surface p-0.5 transition-colors hover:border-brand active:cursor-grabbing"
                            title={`拖入时间轴：${role.name} · ${key}`}
                          >
                            {src ? (
                              <img
                                src={src}
                                alt={key}
                                className="h-6 w-6 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-raised text-3xs text-ink-faint">
                                {key[0]}
                              </div>
                            )}
                            <span className="max-w-[40px] truncate text-3xs text-ink-faint">
                              {key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div className="mt-1.5 [&_input]:text-3xs">
            <CharacterSearchSelect
              resetOnSelect
              onChange={(id, name) => void onAddRole(id, name)}
            />
          </div>
        </OutlinerSection>

        <OutlinerSection
          title="道具"
          icon={<Package className="h-3 w-3 text-accent-soft" />}
          count={itemRefs.length}
          open={open.assets}
          onToggle={() => toggle("assets")}
        >
          {itemRefs.length === 0 ? (
            <p className="px-1 py-2 text-3xs text-ink-faint">暂无道具引用</p>
          ) : (
            itemRefs.map((ref) => (
              <div
                key={ref.id}
                className="group flex items-center justify-between rounded px-1.5 py-1 hover:bg-surface-raised"
              >
                <Link
                  to={routes.item(ref.asset_id)}
                  className="min-w-0 truncate text-2xs text-ink-muted hover:text-ink"
                >
                  {ref.name}
                </Link>
                <button
                  type="button"
                  onClick={() => onRemoveItemRef(ref.id)}
                  className="text-3xs text-ink-faint opacity-0 hover:text-red-400 group-hover:opacity-100"
                >
                  移除
                </button>
              </div>
            ))
          )}
          <div className="mt-1.5 [&_input]:text-3xs">
            <EntitySearchSelect
              fetcher={searchImportItems}
              onSelect={(item) => void onAddItem(item.id)}
              placeholder="搜索道具…"
            />
          </div>
        </OutlinerSection>

        <OutlinerSection
          title="项目"
          icon={<Settings2 className="h-3 w-3 text-accent-soft" />}
          open={open.project}
          onToggle={() => toggle("project")}
        >
          <div className="space-y-2 px-1 py-1 text-3xs text-ink-muted">
            {onProjectPatch ? (
              <>
                <label className="block">
                  <span className="mb-0.5 block text-3xs uppercase tracking-wider text-ink-faint">
                    简介
                  </span>
                  <textarea
                    key={`desc-${project.updated_at}`}
                    defaultValue={project.description || ""}
                    rows={2}
                    onBlur={(e) => void onProjectPatch({ description: e.target.value })}
                    placeholder="项目简介…"
                    className="w-full resize-none rounded bg-surface-raised px-2 py-1.5 text-3xs text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-3xs uppercase tracking-wider text-ink-faint">
                    世界观
                  </span>
                  <textarea
                    key={`world-${project.updated_at}`}
                    defaultValue={project.world_setting || ""}
                    rows={3}
                    onBlur={(e) => void onProjectPatch({ worldSetting: e.target.value })}
                    placeholder="世界观设定…"
                    className="w-full resize-none rounded bg-surface-raised px-2 py-1.5 text-3xs text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-3xs uppercase tracking-wider text-ink-faint">
                    规则
                  </span>
                  <textarea
                    key={`rules-${project.updated_at}`}
                    defaultValue={project.rules || ""}
                    rows={3}
                    onBlur={(e) => void onProjectPatch({ rules: e.target.value })}
                    placeholder="玩法/叙事规则…"
                    className="w-full resize-none rounded bg-surface-raised px-2 py-1.5 text-3xs text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>
              </>
            ) : (
              <>
                {project.description && (
                  <p className="line-clamp-3 leading-relaxed text-ink-muted">
                    {project.description}
                  </p>
                )}
                {project.world_setting && (
                  <div>
                    <p className="mb-0.5 text-3xs uppercase tracking-wider text-ink-faint">
                      世界观
                    </p>
                    <p className="line-clamp-4 leading-relaxed">{project.world_setting}</p>
                  </div>
                )}
                {project.rules && (
                  <div>
                    <p className="mb-0.5 text-3xs uppercase tracking-wider text-ink-faint">
                      规则
                    </p>
                    <p className="line-clamp-4 leading-relaxed">{project.rules}</p>
                  </div>
                )}
              </>
            )}
            {nexusNotes.length > 0 && (
              <div>
                <p className="mb-1 text-3xs uppercase tracking-wider text-ink-faint">
                  Nexus 策划备忘
                </p>
                <ul className="space-y-1.5">
                  {nexusNotes.map((entry, i) => (
                    <li
                      key={i}
                      className="rounded border border-border/60 bg-surface-raised/80 px-2 py-1.5 leading-relaxed text-ink-muted"
                    >
                      <p className="line-clamp-4 whitespace-pre-wrap">{entry.text}</p>
                      {entry.created_at && (
                        <p className="mt-0.5 text-3xs text-ink-faint">
                          {new Date(entry.created_at).toLocaleString("zh-CN")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.mechanism && <p>机制 · {project.mechanism}</p>}
            {project.genre && <p>题材 · {project.genre}</p>}
            {project.style_reference && <p>风格 · {project.style_reference}</p>}
            <p>{project.is_public ? "公开" : "私有"}</p>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 px-1">
            <button
              type="button"
              disabled={nexusBusy}
              onClick={() => void sendToNexus()}
              className="rounded py-1 text-left text-3xs text-ink-muted hover:bg-surface-raised hover:text-ink disabled:opacity-50"
            >
              <Inbox className="mr-1 inline h-3 w-3" />
              {nexusBusy ? "发送中…" : "发送到 Nexus"}
            </button>
            {nexusHint && (
              <p className="px-1 text-3xs text-brand">{nexusHint}</p>
            )}
            {onExportMarkdown && (
              <button
                type="button"
                onClick={onExportMarkdown}
                className="rounded py-1 text-left text-3xs text-ink-muted hover:bg-surface-raised hover:text-ink"
              >
                <Link2 className="mr-1 inline h-3 w-3" />
                导出 Markdown
              </button>
            )}
            {onDeleteProject && (
              <button
                type="button"
                onClick={onDeleteProject}
                className="rounded py-1 text-left text-3xs text-red-400/80 hover:bg-surface-raised"
              >
                删除剧本
              </button>
            )}
          </div>
        </OutlinerSection>
      </div>
    </div>
  );
}

function SceneRow({
  scene,
  hint,
  active,
  onSelect,
  onDelete,
}: {
  scene: ProjectSceneResponse;
  hint?: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn("group flex items-center", active && "rounded bg-panel-raised/60")}>
      <OutlinerRow
        active={active}
        onClick={onSelect}
        className="min-w-0 flex-1"
        title={hint}
      >
        <span className="truncate">{scene.title}</span>
        {hint && (
          <span className="ml-1 shrink-0 truncate text-3xs text-ink-faint">{hint}</span>
        )}
        <span className="ml-auto font-mono text-3xs text-ink-faint">
          {scene.nodes?.length ?? 0}
        </span>
      </OutlinerRow>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 px-1 text-3xs text-ink-faint opacity-0 hover:text-red-400 group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
