/**
 * 工程域写侧的运行环境分派口（S13-2e）。
 *
 * 为什么这一层必须存在：桌面的首屏就是 `/studio/projects`（`App.tsx:26`），
 * 但 `useProjects.ts` 当初只把**读**那一支接到了本地 Provider，
 * 创建与删除仍然直连 `projectApi`——于是桌面上点「新建剧本」是发给一个
 * 不存在的服务端，`ProjectListPage` 还把失败 `catch {}` 掉，
 * 表现成「弹窗自己关了、剧本没多出来一个」。本地契约早就有
 * `createProject`/`deleteProject`（三实现齐），缺的只是调用方接上。
 *
 * 与 `playerSaves.ts` 同一裁决：分派收在一处、失败形态也收在一处，
 * `StorageResult` 的 `err` 一律变成可显示的 Error，不许塌成 undefined。
 */

import { projectApi } from "@/shared/api/editor";
import { getCreatorId } from "@/shared/lib/creatorId";
import { getStorageProvider, projectMetaToResponse } from "@/shared/storage";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import type { ProjectCreate, ProjectResponse } from "@/shared/types";
import type {
  ProjectMeta,
  ProjectMetaPatch,
  StorageProvider,
  StorageResult,
} from "@axiforge/editor-core";

/**
 * 注入点（同 `playerSavesDeps`）：node 环境下没有 `window`，
 * 不把判定与 Provider 构造抽出来，本地支在单测里永远跑不到。
 */
export const projectSavesDeps: {
  isLocal: () => boolean;
  provider: () => Promise<StorageProvider>;
} = {
  isLocal: isTauriEnvironment,
  provider: getStorageProvider,
};

function unwrap<T>(r: StorageResult<T>, what: string): T {
  if (!r.ok) {
    const detail = "detail" in r.error && r.error.detail ? `（${r.error.detail}）` : "";
    throw new Error(`${what}：${r.error.code}${detail}`);
  }
  return r.data;
}

/** 创建表单里的元信息 → 契约补丁；`undefined` 表示「没填」，不参与覆写 */
function metaPatch(data: ProjectCreate): ProjectMetaPatch {
  // 契约把补丁字段定成 readonly（防止调用方改了再传一半），逐字段收集需要一个可写形态
  const patch: { -readonly [K in keyof ProjectMetaPatch]?: ProjectMetaPatch[K] } = {};
  if (data.description !== undefined) patch.description = data.description;
  if (data.cover_image !== undefined) patch.coverImage = data.cover_image;
  if (data.mechanism !== undefined) patch.mechanism = data.mechanism;
  if (data.theme_tags !== undefined) patch.themeTags = data.theme_tags;
  if (data.genre !== undefined) patch.genre = data.genre;
  if (data.world_setting !== undefined) patch.worldSetting = data.world_setting;
  if (data.rules !== undefined) patch.rules = data.rules;
  if (data.is_meta !== undefined) patch.isMeta = data.is_meta;
  return patch;
}

export async function createProject(data: ProjectCreate): Promise<ProjectResponse> {
  if (!projectSavesDeps.isLocal()) return projectApi.create(data);

  const provider = await projectSavesDeps.provider();
  const created = unwrap(
    await provider.createProject({ title: data.title, isPublic: data.is_public }),
    "新建工程失败",
  );

  const patch = metaPatch(data);
  if (Object.keys(patch).length === 0) {
    return projectMetaToResponse(created, data.author_id ?? getCreatorId());
  }

  /*
   * 元信息补写失败时把刚建的工程删掉：留一个「只有标题、简介与题材凭空消失」的工程
   * 比整体失败更难被发现（`importBundle` 对 saveNarrative/addRole 失败也是同一补偿形状）。
   * 补偿自身失败不再升级——附在错误里说清楚，交给界面显示。
   */
  const saved = await provider.updateProjectMeta(created.id, patch);
  if (!saved.ok) {
    const rollback = await provider.deleteProject(created.id);
    const residue = rollback.ok
      ? ""
      : `；且回滚也失败（${rollback.error.code}），工程 ${created.id} 可能残留`;
    throw new Error(`新建工程元信息写入失败：${saved.error.code}${residue}`);
  }

  const meta: ProjectMeta = { ...created, ...patch };
  return projectMetaToResponse(meta, data.author_id ?? getCreatorId());
}

export async function deleteProject(id: string): Promise<void> {
  if (!projectSavesDeps.isLocal()) {
    await projectApi.delete(id);
    return;
  }
  const provider = await projectSavesDeps.provider();
  unwrap(await provider.deleteProject(id), "删除工程失败");
}
