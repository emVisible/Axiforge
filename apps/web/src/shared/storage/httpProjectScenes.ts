/**
 * 工程内舞台的 HTTP 实现（L4 契约的远端形态）。
 *
 * 独立成模块的理由与 `httpStories` 一样：`httpStorageProvider` 一直贴着 G1 的
 * 400 行棘轮，新域的实现体不再往它本体堆，主文件只留转调。
 *
 * 这一层同时是「浏览器冻结线」的守门人：改走 provider 之后，剪辑台不再直接拼
 * `projectApi.addScene` 的请求体，字段口径就收在这里——`description` 缺省给空串、
 * `source` 缺省给 inline，与后端 Pydantic 默认值一致，web 侧行为不因本地化而变。
 */

import { projectApi } from "@/shared/api/editor";
import type { ProjectSceneResponse } from "@/shared/types/project";
import type { ProjectSceneInput, StorageResult, StoredScene } from "@axiforge/editor-core";
import { ok } from "@axiforge/editor-core";
import { fail } from "./httpDomains";

/** 远端舞台行 → 存储态：字段名 camel 化，缺列按空值如实给 */
export function toStoredProjectScene(s: ProjectSceneResponse): StoredScene {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    location: s.location,
    atmosphere: s.atmosphere,
    sceneRefId: s.scene_ref_id,
    source: s.source,
    sortOrder: s.sort_order,
  };
}

export async function httpAddProjectScene(
  projectId: string,
  scene: ProjectSceneInput,
): Promise<StorageResult<{ id: string }>> {
  try {
    const created = await projectApi.addScene(projectId, {
      title: scene.title,
      description: scene.description ?? "",
      location: scene.location ?? null,
      atmosphere: scene.atmosphere ?? null,
      scene_ref_id: scene.sceneRefId ?? null,
      source: scene.source ?? "inline",
      ...(scene.sortOrder === undefined ? {} : { sort_order: scene.sortOrder }),
    });
    return ok({ id: String(created.id) });
  } catch (e) {
    return fail(e, "project", projectId);
  }
}

export async function httpRemoveProjectScene(
  projectId: string,
  sceneId: string,
): Promise<StorageResult<void>> {
  try {
    await projectApi.deleteScene(projectId, sceneId);
    return ok(undefined);
  } catch (e) {
    return fail(e, "scene", sceneId);
  }
}
