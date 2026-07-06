
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  Anchor,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clapperboard,
  Download,
  Link2,
  Pencil,
  Play,
  Trash2,
  Users,
} from "lucide-react";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { PROJECT_KEYS } from "@/hooks/useProjects";
import { projectApi, sceneAssetApi } from "@/api/editor";
import { characterApi } from "@/api/characters";
import { searchApi } from "@/api/search";
import { playerApi } from "@/api/player";
import Shell from "@/components/Shell";
import CharacterSearchSelect from "@/modules/character/components/CharacterSearchSelect";
import Toast from "@/components/Toast";
import {
  BackLink,
  Badge,
  Button,
  Card,
  CheckboxField,
  EmptyState,
  EntitySearchSelect,
  FormActions,
  Input,
  PageHeader,
  Select,
  TagEditor,
  Textarea,
} from "@/components/ui";
import type { SelectableItem } from "@/components/ui";
import type {
  ProjectResponse,
  ProjectSceneResponse,
  ProjectRoleResponse,
  ProjectSceneUpdate,
} from "@/types/project";
import type { Character } from "@/types/character";
import type { PlayerNode } from "@/types/runtime";
import { routes } from "@/lib/routes";

// ================================================================
// 常量
// ================================================================

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

const TABS = [
  { key: "info" as const, label: "信息", icon: ClipboardList },
  { key: "scenes" as const, label: "场景", icon: Clapperboard },
  { key: "roles" as const, label: "角色", icon: Users },
  { key: "assets" as const, label: "资产", icon: Link2 },
  { key: "play" as const, label: "播放", icon: Play },
];

type TabKey = (typeof TABS)[number]["key"];

// ================================================================
// 辅助函数
// ================================================================

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

// ================================================================
// 子组件：元数据编辑
// ================================================================

function MetaSection({
  project,
  onSave,
}: {
  project: ProjectResponse;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    description: "",
    mechanism: "",
    genre: "",
    world_setting: "",
    rules: "",
    style_reference: "",
    is_public: false,
  });

  const open = () => {
    setForm({
      description: project.description || "",
      mechanism: project.mechanism || "",
      genre: project.genre || "",
      world_setting: project.world_setting || "",
      rules: project.rules || "",
      style_reference: project.style_reference || "",
      is_public: project.is_public || false,
    });
    setEditing(true);
  };

  const save = async () => {
    await onSave(form);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <Textarea
          label="简介"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="剧本简介"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="机制"
            value={form.mechanism}
            onChange={(e) =>
              setForm((p) => ({ ...p, mechanism: e.target.value }))
            }
          >
            <option value="">选择机制</option>
            {MECHANISMS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            label="题材"
            value={form.genre}
            onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
          >
            <option value="">选择题材</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="参考风格"
          value={form.style_reference}
          onChange={(e) =>
            setForm((p) => ({ ...p, style_reference: e.target.value }))
          }
          placeholder="如：荒野大镖客"
        />
        <Input
          label="世界观"
          value={form.world_setting}
          onChange={(e) =>
            setForm((p) => ({ ...p, world_setting: e.target.value }))
          }
        />
        <Input
          label="规则"
          value={form.rules}
          onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))}
        />
        <CheckboxField
          checked={!!form.is_public}
          onChange={(checked) =>
            setForm((p) => ({ ...p, is_public: checked }))
          }
          label="公开到大厅"
        />
        <FormActions onSave={save} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm text-ink-muted">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted/70">
          元数据
        </span>
        <div className="flex items-center gap-2">
          <Badge variant={project.is_public ? "emerald" : "default"} size="sm">
            {project.is_public ? "公开" : "私有"}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              await onSave({ is_meta: !project.is_meta });
            }}
            className={
              project.is_meta ? "text-amber-600 hover:text-amber-700" : ""
            }
          >
            {project.is_meta ? "元剧本" : "标记元剧本"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={open}>
            编辑
          </Button>
        </div>
      </div>
      <p className="leading-relaxed text-ink">{project.description || "暂无描述"}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.mechanism && (
          <Badge variant="default" size="sm">
            机制：{project.mechanism}
          </Badge>
        )}
        {project.genre && (
          <Badge variant="default" size="sm">
            题材：{project.genre}
          </Badge>
        )}
        {project.style_reference && (
          <Badge variant="default" size="sm">
            参考：{project.style_reference}
          </Badge>
        )}
      </div>
      {project.world_setting && (
        <p className="text-xs">世界观：{project.world_setting}</p>
      )}
      {project.rules && <p className="text-xs">规则：{project.rules}</p>}
    </div>
  );
}

// ================================================================
// 子组件：标签编辑
// ================================================================

function TagSection({
  tags,
  onAdd,
  onRemove,
}: {
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
}) {
  const [value, setValue] = useState("");
  const handleAdd = () => {
    const t = value.trim();
    if (t && !tags.includes(t)) {
      onAdd(t);
      setValue("");
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <TagEditor
        label="主题标签"
        tags={tags}
        input={value}
        onInputChange={setValue}
        onAdd={handleAdd}
        onRemove={onRemove}
        placeholder="添加标签后按回车"
        variant="brand"
      />
    </div>
  );
}

// ================================================================
// 子组件：场景列表
// ================================================================

function SceneListSection({
  scenes,
  sceneAssetNames,
  onAdd,
  onImportAsset,
  onDelete,
  onUpdate,
  projectId,
}: {
  scenes: ProjectSceneResponse[];
  sceneAssetNames: Record<string, string>;
  onAdd: (title: string, parentSceneId?: string | null) => Promise<void>;
  onImportAsset: (
    assetId: string,
    parentSceneId?: string | null,
  ) => Promise<void>;
  onDelete: (sceneId: string) => Promise<void>;
  onUpdate: (sceneId: string, data: ProjectSceneUpdate) => Promise<void>;
  projectId: string;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    location: "",
    atmosphere: "",
    scene_ref_id: "",
  });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const topScenes = scenes.filter((s) => !s.parent_scene_id);
  const getChildren = (parentId: string) =>
    scenes.filter((s) => s.parent_scene_id === parentId);

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    const t = newTitle.trim();
    if (!t) return;
    await onAdd(t, newParentId);
    setNewTitle("");
    setNewParentId(null);
  };

  const openEdit = (scene: ProjectSceneResponse) => {
    setEditingId(scene.id);
    setEditForm({
      title: scene.title,
      location: scene.location || "",
      atmosphere: scene.atmosphere || "",
      scene_ref_id: scene.scene_ref_id || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await onUpdate(editingId, {
      title: editForm.title,
      location: editForm.location || null,
      atmosphere: editForm.atmosphere || null,
      scene_ref_id: editForm.scene_ref_id || null,
      source: editForm.scene_ref_id ? "reference" : "inline",
    });
    setEditingId(null);
  };

  const renderScene = (scene: ProjectSceneResponse, depth: number) => {
    const children = getChildren(scene.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed.has(scene.id);
    const indent = depth * 24;

    return (
      <div key={scene.id}>
        <div
          className="overflow-hidden rounded-xl border border-border/60 bg-canvas transition-colors hover:border-border"
          style={{ marginLeft: indent }}
        >
          {editingId === scene.id ? (
            <div className="space-y-3 p-4">
              <Input
                label="场景名称"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="地点"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="如：学校天台"
                />
                <Input
                  label="氛围"
                  value={editForm.atmosphere}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, atmosphere: e.target.value }))
                  }
                  placeholder="如：黄昏、安静"
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-muted">
                  关联场景资产
                </p>
                {editForm.scene_ref_id ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-ink">
                      {sceneAssetNames[editForm.scene_ref_id] ||
                        editForm.scene_ref_id.slice(0, 8)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditForm((p) => ({ ...p, scene_ref_id: "" }))
                      }
                    >
                      解除
                    </Button>
                  </div>
                ) : (
                  <EntitySearchSelect
                    fetcher={searchApi.scenes}
                    onSelect={(item) =>
                      setEditForm((p) => ({ ...p, scene_ref_id: item.id }))
                    }
                    placeholder="搜索场景资产..."
                  />
                )}
              </div>
              <FormActions
                onSave={saveEdit}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleCollapse(scene.id)}
                  className="mr-2 flex h-6 w-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-gray-100 hover:text-ink"
                  aria-label={isCollapsed ? "展开" : "折叠"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                </button>
              ) : (
                <div className="mr-2 w-6" />
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  {depth > 0 && (
                    <span className="text-[10px] text-ink-muted/40">└</span>
                  )}
                  <h3 className="truncate text-sm font-medium text-ink">
                    {scene.title}
                  </h3>
                  <Badge variant="default" size="sm">
                    {scene.nodes?.length || 0} 节点
                  </Badge>
                  {hasChildren && (
                    <Badge variant="brand" size="sm">
                      {children.length} 子场景
                    </Badge>
                  )}
                  {scene.scene_ref_id && (
                    <Badge variant="emerald" size="sm">
                      资产 ·{" "}
                      {sceneAssetNames[scene.scene_ref_id] ||
                        scene.scene_ref_id.slice(0, 6)}
                    </Badge>
                  )}
                </div>
                <div
                  className="flex items-center gap-2 text-[11px] text-ink-muted"
                  style={{ marginLeft: depth > 0 ? 14 : 0 }}
                >
                  {scene.location && <span>地点 · {scene.location}</span>}
                  {scene.atmosphere && <span>氛围 · {scene.atmosphere}</span>}
                </div>
              </div>

              <div className="ml-4 flex flex-shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(scene)}
                  icon={<Pencil className="h-3 w-3" strokeWidth={1.75} />}
                >
                  编辑
                </Button>
                <Link
                  to={`${routes.projectFlow(projectId)}?scene=${scene.id}`}
                >
                  <Button type="button" variant="secondary" size="sm">
                    画布
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("删除此场景？")) onDelete(scene.id);
                  }}
                  className="px-2 text-ink-muted hover:text-red-500"
                >
                  删除
                </Button>
              </div>
            </div>
          )}
        </div>

        {hasChildren &&
          !isCollapsed &&
          children.map((child) => renderScene(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 添加新场景 */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAdd();
          }}
          placeholder="新场景名称（如：序章·相遇）"
          className="flex-1"
        />
        <Select
          value={newParentId || ""}
          onChange={(e) => setNewParentId(e.target.value || null)}
          className="w-40"
        >
          <option value="">顶层场景</option>
          {topScenes.map((s) => (
            <option key={s.id} value={s.id}>
              └ {s.title}
            </option>
          ))}
        </Select>
        <Button onClick={handleAdd} disabled={!newTitle.trim()} size="sm">
          添加
        </Button>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-ink-muted">或从场景资产库引用</p>
        <EntitySearchSelect
          fetcher={searchApi.scenes}
          onSelect={(item) => onImportAsset(item.id, newParentId)}
          placeholder="搜索场景资产并引用..."
        />
      </div>

      {/* 场景列表 */}
      {scenes.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="还没有场景"
          description="在上方输入场景名称开始构建叙事"
        />
      ) : (
        <div className="space-y-1">
          {topScenes.map((scene) => renderScene(scene, 0))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// 子组件：资产引用
// ================================================================

function RefSection({
  title,
  refs,
  names,
  idField,
  fetcher,
  onAdd,
  onRemove,
}: {
  title: string;
  refs: Record<string, unknown>[];
  names: Record<string, string>;
  idField: string;
  fetcher: (q: string) => Promise<SelectableItem[]>;
  onAdd: (id: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Card padding="md">
      <h3 className="mb-3 text-sm font-semibold text-ink">
        {title} ({refs.length})
      </h3>
      <div className="mb-3 space-y-1.5">
        {refs.map((ref, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-sm"
          >
            <span className="truncate text-ink">
              {names[ref[idField] as string] ||
                String(ref[idField]).slice(0, 12) + "…"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(i)}
              className="ml-2 flex-shrink-0 px-2 text-ink-muted hover:text-red-500"
            >
              移除
            </Button>
          </div>
        ))}
        {refs.length === 0 && (
          <p className="py-2 text-xs text-ink-muted">暂无引用</p>
        )}
      </div>
      <EntitySearchSelect
        fetcher={fetcher}
        onSelect={(item) => onAdd(item.id)}
        placeholder={`搜索${title}...`}
      />
    </Card>
  );
}

// ================================================================
// 子组件：角色列表
// ================================================================

function RoleSection({
  roles,
  characterNames,
  onImportanceChange,
  onRemove,
  onAdd,
  onPreview,
}: {
  roles: ProjectRoleResponse[];
  characterNames: Record<string, string>;
  onImportanceChange: (roleId: string, importance: number) => void;
  onRemove: (roleId: string) => void;
  onAdd: (characterId: string, name: string) => void;
  onPreview: (characterId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {roles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="还没有关联角色"
          description="在下方搜索并添加角色"
        />
      ) : (
        <div className="space-y-1.5">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-canvas px-4 py-2.5 text-sm"
            >
              <button
                type="button"
                onClick={() => onPreview(role.character_ref_id)}
                className="min-w-0 flex-1 truncate text-left text-ink transition-colors hover:text-brand"
              >
                {characterNames[role.character_ref_id] ||
                  `加载中 ${role.character_ref_id.slice(0, 8)}`}
              </button>
              <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                <Select
                  value={role.importance}
                  onChange={(e) =>
                    onImportanceChange(role.id, Number(e.target.value))
                  }
                  className="w-auto py-1.5 text-xs"
                >
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "配角" : `重要度 ${i}`}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(role.id)}
                  className="px-2 text-ink-muted hover:text-red-500"
                >
                  移除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <CharacterSearchSelect
        resetOnSelect
        onChange={(id, name) => onAdd(id, name)}
      />
    </div>
  );
}

// ================================================================
// 主页面
// ================================================================

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id!) });

  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [characterNames, setCharacterNames] = useState<Record<string, string>>(
    {},
  );
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [sceneAssetNames, setSceneAssetNames] = useState<Record<string, string>>(
    {},
  );
  const [previewChar, setPreviewChar] = useState<Character | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Runtime state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deck, setDeck] = useState<PlayerNode[]>([]);
  const [history, setHistory] = useState<PlayerNode[]>([]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // 加载资产名称
  useEffect(() => {
    if (!project) return;
    (async () => {
      const newCharNames: Record<string, string> = {};
      const newItemNames: Record<string, string> = {};
      const newSceneAssetNames: Record<string, string> = {};

      for (const role of project.roles || []) {
        try {
          const char = await characterApi.get(role.character_ref_id);
          newCharNames[role.character_ref_id] = char.name;
        } catch {
          newCharNames[role.character_ref_id] =
            `角色 ${role.character_ref_id.slice(0, 6)}`;
        }
      }
      for (const ref of project.asset_refs || []) {
        if (ref.asset_type === "item") {
          try {
            const { itemApi } = await import("@/api/editor");
            const item = await itemApi.get(ref.asset_id);
            newItemNames[ref.asset_id] = item.name;
          } catch {}
        }
      }

      for (const scene of project.scenes || []) {
        if (scene.scene_ref_id && !newSceneAssetNames[scene.scene_ref_id]) {
          try {
            const asset = await sceneAssetApi.get(scene.scene_ref_id);
            newSceneAssetNames[scene.scene_ref_id] = asset.name;
          } catch {
            newSceneAssetNames[scene.scene_ref_id] =
              `场景 ${scene.scene_ref_id.slice(0, 6)}`;
          }
        }
      }

      setCharacterNames((prev) => ({ ...prev, ...newCharNames }));
      setItemNames((prev) => ({ ...prev, ...newItemNames }));
      setSceneAssetNames((prev) => ({ ...prev, ...newSceneAssetNames }));
    })();
  }, [project]);

  if (isLoading)
    return (
      <Shell>
        <p className="text-sm text-gray-400 py-20 text-center">加载中...</p>
      </Shell>
    );
  if (!project)
    return (
      <Shell>
        <p className="text-sm text-gray-400 py-20 text-center">剧本不存在</p>
      </Shell>
    );

  const scenes = project.scenes || [];
  const roles = project.roles || [];
  const assetRefs = project.asset_refs || [];

  // 场景 CRUD
  const handleAddScene = async (
    title: string,
    parentSceneId?: string | null,
  ) => {
    await projectApi.addScene(id!, {
      title,
      source: "inline",
      parent_scene_id: parentSceneId,
    });
    refresh();
    showToast("场景已添加");
  };
  const handleImportSceneAsset = async (
    assetId: string,
    parentSceneId?: string | null,
  ) => {
    const asset = await sceneAssetApi.get(assetId);
    await projectApi.addScene(id!, {
      title: asset.name,
      source: "reference",
      scene_ref_id: assetId,
      parent_scene_id: parentSceneId,
      description: asset.description,
      location: asset.location,
      atmosphere: asset.atmosphere,
    });
    setSceneAssetNames((prev) => ({ ...prev, [assetId]: asset.name }));
    refresh();
    showToast(`已引用场景「${asset.name}」`);
  };
  const handleDeleteScene = async (sceneId: string) => {
    await projectApi.deleteScene(id!, sceneId);
    refresh();
    showToast("场景已删除");
  };
  const handleUpdateScene = async (
    sceneId: string,
    data: ProjectSceneUpdate,
  ) => {
    await projectApi.updateScene(id!, sceneId, data);
    if (data.scene_ref_id) {
      try {
        const asset = await sceneAssetApi.get(data.scene_ref_id);
        setSceneAssetNames((prev) => ({
          ...prev,
          [data.scene_ref_id!]: asset.name,
        }));
      } catch {}
    }
    refresh();
    showToast("场景已更新");
  };

  // 角色 CRUD
  const handleAddRole = async (characterId: string, name: string) => {
    await projectApi.addRole(id!, {
      character_ref_id: characterId,
      importance: 0,
    });
    setCharacterNames((prev) => ({ ...prev, [characterId]: name }));
    refresh();
    showToast(`已添加 ${name}`);
  };
  const handleRemoveRole = async (roleId: string) => {
    await projectApi.removeRole(id!, roleId);
    refresh();
    showToast("角色已移除");
  };
  const handleImportanceChange = async (roleId: string, importance: number) => {
    await projectApi.updateRole(id!, roleId, { importance });
    refresh();
  };

  // 资产 CRUD
  const handleAddAsset = async (type: "item", assetId: string) => {
    await projectApi.addAssetRef(id!, { asset_type: type, asset_id: assetId });
    refresh();
    showToast("已添加");
  };
  const handleRemoveAsset = async (type: "item", index: number) => {
    const refs = assetRefs.filter((r) => r.asset_type === type);
    if (refs[index]) {
      await projectApi.removeAssetRef(id!, refs[index].id);
      refresh();
      showToast("已移除");
    }
  };

  // Runtime
  const startRuntime = async () => {
    try {
      const session = await playerApi.startSession({ project_id: project.id });
      setSessionId(session.id);
      const draw = await playerApi.draw(session.id);
      setDeck(draw.available_nodes || []);
      setHistory([]);
    } catch {
      showToast("启动失败", "error");
    }
  };

  const completeNode = async (nodeId: string, choiceLabel?: string) => {
    if (!sessionId) return;
    try {
      const draw = await playerApi.complete(sessionId, {
        node_id: nodeId,
        choice_label: choiceLabel ?? null,
      });
      setDeck(draw.available_nodes || []);
      const node = deck.find((n) => n.node_id === nodeId);
      if (node) setHistory((prev) => [...prev, node]);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定删除此剧本？")) return;
    await deleteProject.mutateAsync(id!);
    navigate("/studio/projects");
  };

  const handleExport = () => {
    const lines: string[] = [];
    lines.push(`# ${project.title}`, "");

    if (project.description) {
      lines.push("## 简介", "", project.description, "");
    }

    // 元信息
    const meta: string[] = [];
    if (project.mechanism) meta.push(`**机制**：${project.mechanism}`);
    if (project.genre) meta.push(`**题材**：${project.genre}`);
    if (project.style_reference)
      meta.push(`**参考风格**：${project.style_reference}`);
    if (meta.length) lines.push(meta.join("  |  "), "");

    // 世界观
    if (project.world_setting) {
      lines.push("## 世界观", "", project.world_setting, "");
    }

    // 规则
    if (project.rules) {
      lines.push("## 规则", "", project.rules, "");
    }

    lines.push("");

    // 场景
    if (scenes.length > 0) {
      lines.push("## 场景", "");
      scenes.forEach((s) => {
        lines.push(`### ${s.title}`);
        if (s.location) lines.push(`- 地点：${s.location}`);
        if (s.atmosphere) lines.push(`- 氛围：${s.atmosphere}`);
        if (s.nodes?.length) {
          lines.push(`- 节点数：${s.nodes.length}`);
          lines.push("");
          lines.push("| # | 标题 | 类型 | 角色 | 内容 |");
          lines.push("|---|------|------|------|------|");
          s.nodes.forEach((n, i) => {
            const nd = n.narrative_data || {};
            const content = (nd.dialogue || nd.narration || "")
              .replace(/\n/g, " ")
              .slice(0, 60);
            lines.push(
              `| ${i + 1} | ${nd.title || "-"} | ${nd.is_anchor ? "锚点" : "对话"} | ${nd.speaker || "旁白"} | ${content} |`,
            );
          });
        }
        lines.push("");
      });
    }

    // 角色
    if (roles.length > 0) {
      lines.push("## 角色", "");
      for (const r of roles) {
        const name =
          characterNames[r.character_ref_id] || r.character_ref_id.slice(0, 8);
        lines.push(`- 重要度 ${r.importance} · **${name}**`);
        if (r.role_description) lines.push(`  - ${r.role_description}`);
      }
      lines.push("");
    }

    const md = lines.join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.download = `${project.title || "project"}.md`;
    a.href = URL.createObjectURL(blob);
    a.click();
    showToast("已导出 Markdown");
  };

  return (
    <Shell>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* 顶栏 */}
      <div className="mb-4">
        <BackLink to={routes.projects}>剧本列表</BackLink>
      </div>
      <PageHeader
        title={project.title}
        description={project.description || undefined}
        meta={
          <>
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
            <Badge variant={project.is_public ? "emerald" : "default"} size="sm">
              {project.is_public ? "公开" : "私有"}
            </Badge>
          </>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExport}
              icon={<Download className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              导出
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                window.open(routes.play(project.id), "_blank", "noopener")
              }
              icon={<Play className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              播放
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              删除
            </Button>
          </div>
        }
      />
      {/* Tab 导航 */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-canvas p-1">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* ================================================================ */}
      {/* 信息 Tab */}
      {/* ================================================================ */}
      {activeTab === "info" && (
        <Card padding="lg">
          <MetaSection
            project={project}
            onSave={async (data) => {
              await updateProject.mutateAsync({ id: id!, data });
              refresh();
              showToast("已保存");
            }}
          />
          <TagSection
            tags={project.theme_tags}
            onAdd={async (t) => {
              await updateProject.mutateAsync({
                id: id!,
                data: { theme_tags: [...project.theme_tags, t] },
              });
              refresh();
            }}
            onRemove={async (t) => {
              await updateProject.mutateAsync({
                id: id!,
                data: { theme_tags: project.theme_tags.filter((x) => x !== t) },
              });
              refresh();
            }}
          />
        </Card>
      )}
      {/* ================================================================ */}
      {/* 场景 Tab */}
      {/* ================================================================ */}
      {activeTab === "scenes" && (
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            场景 ({scenes.length})
          </h2>
          <SceneListSection
            scenes={scenes}
            sceneAssetNames={sceneAssetNames}
            onAdd={handleAddScene}
            onImportAsset={handleImportSceneAsset}
            onDelete={handleDeleteScene}
            onUpdate={handleUpdateScene}
            projectId={id!}
          />
        </Card>
      )}
      {/* ================================================================ */}
      {/* 角色 Tab */}
      {/* ================================================================ */}
      {activeTab === "roles" && (
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            角色 ({roles.length})
          </h2>
          <RoleSection
            roles={roles}
            characterNames={characterNames}
            onImportanceChange={handleImportanceChange}
            onRemove={handleRemoveRole}
            onAdd={handleAddRole}
            onPreview={async (cid) => {
              try {
                setPreviewChar(await characterApi.get(cid));
              } catch {}
            }}
          />
        </Card>
      )}
      {/* ================================================================ */}
      {/* 资产 Tab */}
      {/* ================================================================ */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <RefSection
            title="道具"
            refs={assetRefs
              .filter((r) => r.asset_type === "item")
              .map((r) => ({ item_id: r.asset_id }))}
            names={itemNames}
            idField="item_id"
            fetcher={searchApi.items}
            onAdd={(id) => handleAddAsset("item", id)}
            onRemove={(i) => handleRemoveAsset("item", i)}
          />
        </div>
      )}
      {/* ================================================================ */}
      {/* 播放 Tab */}
      {/* ================================================================ */}
      {activeTab === "play" && (
        <div className="space-y-4">
          {!sessionId ? (
            <Card padding="lg" className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-muted text-brand">
                <Play className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-ink">开始播放</h2>
              <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-ink-muted">
                在独立窗口中体验完整的叙事流程——打字机效果、分支选择、角色立绘。
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() =>
                    window.open(routes.play(project.id), "_blank", "noopener")
                  }
                  icon={<Play className="h-4 w-4" strokeWidth={1.75} />}
                >
                  在新窗口打开
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={startRuntime}
                >
                  内置测试
                </Button>
              </div>
              <p className="mt-4 text-xs text-ink-muted/70">
                内置测试可在此页面快速验证条件与效果系统
              </p>
            </Card>
          ) : (
            <>
              <Card
                padding="md"
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-ink">
                    测试运行中
                  </span>
                  <span className="text-xs text-ink-muted">
                    会话 {sessionId.slice(0, 8)}…
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const draw = await playerApi.draw(sessionId);
                      setDeck(draw.available_nodes || []);
                    }}
                  >
                    刷新
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      window.open(routes.play(project.id), "_blank", "noopener")
                    }
                  >
                    Player 打开
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setSessionId(null);
                      setDeck([]);
                      setHistory([]);
                    }}
                  >
                    结束测试
                  </Button>
                </div>
              </Card>

              <Card padding="lg">
                <h2 className="mb-4 text-sm font-semibold text-ink">
                  可用事件 ({deck.length})
                </h2>
                {deck.length === 0 ? (
                  <p className="py-8 text-center text-xs text-ink-muted">
                    没有可用事件
                  </p>
                ) : (
                  <div className="space-y-2">
                    {deck.map((node) => (
                      <div
                        key={node.node_id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:border-border"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            {node.is_anchor && (
                              <Anchor
                                className="h-3.5 w-3.5 text-amber-500"
                                strokeWidth={1.75}
                              />
                            )}
                            <span className="truncate text-sm font-medium text-ink">
                              {node.scene_title}
                            </span>
                            {node.speaker_name && (
                              <Badge variant="brand" size="sm">
                                {node.speaker_name}
                              </Badge>
                            )}
                          </div>
                          <p className="line-clamp-2 text-xs text-ink-muted">
                            {node.dialogue || node.narration || "无内容"}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col gap-1.5">
                          {node.choices && node.choices.length > 0 ? (
                            node.choices.map((choice, idx) => (
                              <Button
                                key={idx}
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={choice.disabled}
                                onClick={() =>
                                  completeNode(node.node_id, choice.label)
                                }
                              >
                                {choice.label}
                              </Button>
                            ))
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => completeNode(node.node_id)}
                            >
                              触发
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {history.length > 0 && (
                <Card padding="lg">
                  <h2 className="mb-4 text-sm font-semibold text-ink">
                    已触发 ({history.length})
                  </h2>
                  <div className="space-y-1">
                    {history.map((node, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2 text-sm"
                      >
                        <span className="w-5 text-xs text-ink-muted/50">
                          {i + 1}
                        </span>
                        {node.is_anchor && (
                          <Anchor
                            className="h-3.5 w-3.5 text-amber-500"
                            strokeWidth={1.75}
                          />
                        )}
                        <span className="truncate text-ink-muted">
                          {node.speaker_name && `${node.speaker_name}: `}
                          {node.dialogue || node.narration || node.scene_title}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
      {/* 角色预览浮层 */}
      {previewChar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setPreviewChar(null)}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative max-w-sm w-full rounded-2xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-4">
              {previewChar.image_path ? (
                <img
                  src={previewChar.image_path}
                  className="h-14 w-14 rounded-xl object-cover"
                  alt={previewChar.name}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-muted text-xl font-bold text-brand">
                  {previewChar.name?.[0]}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-ink">
                  {previewChar.name}
                </h3>
                <p className="truncate text-sm text-ink-muted">
                  {previewChar.character_data?.anchor?.essence || ""}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-ink-muted">
              {safeString(previewChar.character_data?.anchor?.summary) && (
                <p>{safeString(previewChar.character_data.anchor.summary)}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {previewChar.tags?.map((t) => (
                  <Badge key={t.id} variant="default" size="sm">
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewChar(null)}
              >
                关闭
              </Button>
              <Link to={routes.characters.detail(previewChar.id)}>
                <Button type="button" size="sm">
                  查看详情
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
