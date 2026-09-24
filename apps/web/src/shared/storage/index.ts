/**
 * Provider 工厂——按运行环境选择存储实现（ADR-024：云能力缺席时创作流可用）。
 *
 * - 桌面（Tauri webview）：SQLite（本地 DB 文件，断网全功能）
 * - 浏览器：HTTP（既有 FastAPI 后端）
 * 云同步/协作服务后期以装饰器形态叠加，不改变本工厂签名。
 */
import { compileStory, type CompilerProjectInput, type StoryPackage } from "@axiforge/core";
import { collectAssetRefs, packAxsp, remapCharacterIds, unpackAxsp } from "@axiforge/editor-core";
import type { ProjectBundle, StoredCharacter } from "@axiforge/editor-core";
import { SqliteStorageProvider, type ProjectMeta, type StorageResult, type StorageProvider } from "@axiforge/editor-core";
import type { Character, CharacterData } from "@/shared/types/character";
import { HttpStorageProvider } from "./httpStorageProvider";
import { isTauriEnvironment, TauriSqlBackend } from "./tauriSqlBackend";
import { TauriAssetStore } from "./tauriAssetStore";
import { setLocalAssetRoot } from "./assetContext";
import { seedDesktopIfEmpty, type SeedOutcome } from "./desktopSeed";
import { getCreatorId } from "@/shared/lib/creatorId";
import type {
  ProjectEdgeResponse,
  ProjectNodeResponse,
  ProjectResponse,
  ProjectRoleResponse,
  ProjectSceneResponse,
} from "@/shared/types/project";

const NOW = () => new Date().toISOString();

/** 存储态工程束 → 传输态 ProjectResponse（编辑器消费形态，字段对齐后端响应） */
export function bundleToResponse(b: ProjectBundle): ProjectResponse {
  const nodes: ProjectNodeResponse[] = b.nodes.map((n) => ({
    id: n.id,
    scene_id: null,
    stage_id: n.stageId,
    editor_data: n.editorData as ProjectNodeResponse["editor_data"],
    narrative_data: n.narrativeData as ProjectNodeResponse["narrative_data"],
    sort_order: n.sortOrder,
    created_at: NOW(),
    updated_at: b.meta.updatedAt,
  }));
  const scenes: ProjectSceneResponse[] = b.scenes.map((sc) => ({
    id: sc.id,
    project_id: b.meta.id,
    source: "inline" as const,
    scene_ref_id: null,
    title: sc.title,
    description: "",
    parent_scene_id: null,
    location: null,
    atmosphere: null,
    sort_order: 0,
    nodes: [],
    created_at: NOW(),
    updated_at: b.meta.updatedAt,
  }));
  const edges: ProjectEdgeResponse[] = b.edges.map((e) => ({
    id: e.id,
    project_id: b.meta.id,
    source_node_id: e.source,
    target_node_id: e.target,
    source_port: "output",
    label: e.label,
    condition: null,
    created_at: NOW(),
  }));
  const roles: ProjectRoleResponse[] = b.roles.map((r) => ({
    id: r.id,
    project_id: b.meta.id,
    character_ref_id: r.characterRefId,
    locked_version: null,
    importance: 0,
    role_description: null,
    created_at: NOW(),
  }));
  return {
    id: b.meta.id,
    title: b.meta.title,
    description: "",
    cover_image: null,
    mechanism: null,
    style_reference: null,
    theme_tags: [],
    genre: null,
    world_setting: null,
    rules: null,
    is_public: false,
    is_meta: false,
    view_count: 0,
    author_id: "",
    scenes,
    roles,
    asset_refs: [],
    edges,
    nodes,
    axs_source: b.axsSource ?? undefined,
    created_at: NOW(),
    updated_at: b.meta.updatedAt,
  };
}

/** 存储态工程束 + 角色库 → 编译器输入（桌面断网试玩链路） */
export function bundleToCompilerInput(
  b: ProjectBundle,
  characters: {
    id: string;
    name: string;
    characterData: Record<string, unknown>;
    imagePath?: string | null;
  }[],
): CompilerProjectInput {
  return {
    id: b.meta.id,
    title: b.meta.title,
    worldSetting: null,
    playMeta: {},
    nodes: b.nodes.map((n) => ({
      id: n.id,
      stageId: n.stageId,
      editorData: n.editorData,
      narrativeData: n.narrativeData,
      sortOrder: n.sortOrder,
    })),
    edges: b.edges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      label: e.label,
    })),
    scenes: b.scenes.map((s) => ({ id: s.id, title: s.title })),
    roles: b.roles.map((r) => ({ characterRefId: r.characterRefId })),
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      characterData: c.characterData,
      imagePath: c.imagePath ?? null,
    })),
    items: [],
  };
}

/** 离线编译：Provider 数据 → 本地 StoryPackage（不触网） */
export async function loadStoryOffline(projectId: string): Promise<StoryPackage> {
  const p = await createStorageProvider();
  const bundle = await p.loadProject(projectId);
  if (!bundle.ok) {
    throw new Error(bundle.error.code === "not_found" ? "404" : bundle.error.detail);
  }
  const chars = await p.listCharacters();
  return compileStory(
    bundleToCompilerInput(bundle.data, chars.ok ? chars.data : []),
  );
}

/** 桌面空库首启播种：整进程一次，并发取 Provider 也只灌一遍；结果可观测 */
let seedOnce: Promise<SeedOutcome> | null = null;
let seedOutcome: SeedOutcome | null = null;

export function getSeedOutcome(): SeedOutcome | null {
  return seedOutcome;
}

export async function createStorageProvider(): Promise<StorageProvider> {
  if (isTauriEnvironment()) {
    const assets = await TauriAssetStore.create();
    setLocalAssetRoot(assets.rootDir);
    const provider = new SqliteStorageProvider(
      new TauriSqlBackend(),
      assets,
      getCreatorId(),
    );
    await provider.init();
    if (!seedOnce) seedOnce = seedDesktopIfEmpty(provider, importProjectFromAxsp);
    seedOutcome = await seedOnce;
    return provider;
  }
  setLocalAssetRoot(null);
  return new HttpStorageProvider(getCreatorId());
}

/** 记忆化 Provider：hooks 每次查询都要取，重建 SQLite 连接没有意义 */
let providerPromise: Promise<StorageProvider> | null = null;

export function getStorageProvider(): Promise<StorageProvider> {
  if (!providerPromise) providerPromise = createStorageProvider();
  return providerPromise;
}

/**
 * 工程元信息 → 传输态 ProjectResponse（桌面离线列表用）。
 *
 * v0.8 起描述/封面/机制/题材/标签/元作标记都是本地库的真实列（宪章 Phase 7），
 * 因此这里逐字段透传，不再填假值。仍然缺席的是：浏览计数、场景与角色计数、
 * fork 血统、世界观/规则正文与图结构——这些在卡片上本就不显示，留空是如实而非遮掩。
 */
export function projectMetaToResponse(m: ProjectMeta, authorId: string): ProjectResponse {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    cover_image: m.coverImage,
    mechanism: m.mechanism,
    style_reference: null,
    theme_tags: [...m.themeTags],
    genre: m.genre,
    world_setting: null,
    rules: null,
    is_public: m.isPublic,
    is_meta: m.isMeta,
    view_count: 0,
    author_id: authorId,
    scenes: [],
    roles: [],
    asset_refs: [],
    edges: [],
    created_at: m.updatedAt,
    updated_at: m.updatedAt,
  };
}

/**
 * 存储态角色 → 传输态 Character，让同一批角色组件在桌面离线态复用。
 * 本地尚无标签域 / Fork 血统 / 浏览计数 / 时间戳列，此处给的是**真实的空值**而非猜测值；
 * 消费方（角色列表·详情·选角目录）实测不读这四个字段，读到的 tags 为空即标签搜索无结果。
 */
export function storedCharacterToResponse(c: StoredCharacter): Character {
  return {
    id: c.id,
    name: c.name,
    author_id: c.authorId ?? "",
    character_data: c.characterData as unknown as CharacterData,
    is_public: c.isPublic,
    tags: [],
    image_path: c.imagePath ?? undefined,
    fork_from: null,
    created_at: "",
    updated_at: "",
    view_count: 0,
  };
}

// ============================================================
// .axsp 导出 / 导入（容器 v2：工程束 + 演员表 + 素材字节）
// ============================================================

/**
 * 导出：工程束 + 其演员表 + 表内引用的素材字节 → .axsp zip。
 * 素材读不到时跳过而不中断导出（清单只记实际入包者，包体自洽）；
 * 角色取不到（已删）同理跳过，导入端会看到引用缺席。
 */
export async function exportProjectAsAxsp(
  provider: StorageProvider,
  projectId: string,
): Promise<StorageResult<Uint8Array>> {
  const bundle = await provider.loadProject(projectId);
  if (!bundle.ok) return bundle;

  const characters: StoredCharacter[] = [];
  for (const role of bundle.data.roles) {
    const got = await provider.getCharacter(role.characterRefId);
    if (got.ok) characters.push(got.data);
  }
  const assets: Record<string, Uint8Array> = {};
  for (const ref of collectAssetRefs(bundle.data, characters)) {
    const read = await provider.readAsset(ref);
    if (read.ok) assets[ref] = read.data;
  }
  return packAxsp({ project: bundle.data, characters, assets });
}

/**
 * 导入：素材先落盘（内容寻址，ref 两端一致）→ 角色建新档 → 按新 id 重映射引用
 * → 建工程。角色一律新建而非覆盖：导入不得改写接收方已有的同名角色。
 */
export async function importProjectFromAxsp(
  provider: StorageProvider,
  bytes: Uint8Array | string,
): Promise<StorageResult<ProjectMeta>> {
  const unpacked = unpackAxsp(bytes);
  if (!unpacked.ok) return unpacked;
  const { project, characters, assets } = unpacked.data;

  for (const [ref, raw] of Object.entries(assets)) {
    const saved = await provider.saveAsset({
      name: ref.split("/").pop() ?? ref,
      mime: "application/octet-stream",
      bytes: raw,
    });
    if (!saved.ok) return saved;
  }

  const idMap: Record<string, string> = {};
  const owner = getCreatorId();
  for (const c of characters) {
    // 归属改判给接收方、公开位不继承：否则导入的角色在「我的角色」里查不到，
    // 也不该由导出者决定它在别人机器上是否公开。
    const created = await provider.saveCharacter({
      ...c,
      id: "",
      authorId: owner,
      isPublic: false,
    });
    if (!created.ok) return created;
    idMap[c.id] = created.data.id;
  }
  const remapped = remapCharacterIds(project, idMap);

  const created = await provider.createProject({ title: remapped.meta.title });
  if (!created.ok) return created;
  const newId = created.data.id;

  const saved = await provider.saveNarrative(newId, {
    axsSource: remapped.axsSource,
    nodes: remapped.nodes,
    edges: remapped.edges,
  });
  if (!saved.ok) {
    await provider.deleteProject(newId);
    return saved;
  }
  for (const role of remapped.roles) {
    const r = await provider.addRole(newId, {
      characterRefId: role.characterRefId,
    });
    if (!r.ok) {
      await provider.deleteProject(newId);
      return r;
    }
  }
  return created;
}

/** 平台二进制保存：桌面 dialog+fs；浏览器 blob 下载 */
export async function saveBinaryFile(
  defaultName: string,
  bytes: Uint8Array,
): Promise<boolean> {
  if (isTauriEnvironment()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");
    const path = await save({ defaultPath: defaultName });
    if (!path) return false;
    await fs.writeFile(path, bytes);
    return true;
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy as unknown as BlobPart], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/** 平台二进制读取：桌面 dialog+fs；浏览器 file input（返回 null=用户取消） */
export async function openBinaryFile(accept: string): Promise<Uint8Array | null> {
  if (isTauriEnvironment()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");
    const path = await open({
      multiple: false,
      filters: [{ name: "Axiforge 工程", extensions: ["axsp"] }],
    });
    if (typeof path !== "string") return null;
    return await fs.readFile(path);
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.arrayBuffer().then(
        (buf) => resolve(new Uint8Array(buf)),
        () => resolve(null),
      );
    };
    input.click();
  });
}
