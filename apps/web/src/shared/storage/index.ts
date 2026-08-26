/**
 * Provider 工厂——按运行环境选择存储实现（ADR-024：云能力缺席时创作流可用）。
 *
 * - 桌面（Tauri webview）：SQLite（本地 DB 文件，断网全功能）
 * - 浏览器：HTTP（既有 FastAPI 后端）
 * 云同步/协作服务后期以装饰器形态叠加，不改变本工厂签名。
 */
import { compileStory, type CompilerProjectInput, type StoryPackage } from "@axiforge/core";
import type { ProjectBundle } from "@axiforge/editor-core";
import { SqliteStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import { HttpStorageProvider } from "./httpStorageProvider";
import { isTauriEnvironment, TauriSqlBackend } from "./tauriSqlBackend";
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

export async function createStorageProvider(): Promise<StorageProvider> {
  if (isTauriEnvironment()) {
    const provider = new SqliteStorageProvider(new TauriSqlBackend());
    await provider.init();
    return provider;
  }
  return new HttpStorageProvider(getCreatorId());
}
