/**
 * 工程内道具引用的 HTTP 实现（L4 契约的远端形态）。
 *
 * 独立成模块的理由与 `httpProjectScenes` / `httpStories` 相同：`httpStorageProvider`
 * 一直贴着 G1 的 400 行棘轮，新域的实现体不再往它本体堆，主文件只留转调。
 *
 * 请求体口径收在这里：`asset_type` 后端只有 'item' 一个取值，契约照它收成字面量——
 * 留成 string 的话，加第二种类型时编译器不会提醒任何一处。
 */

import { projectApi } from "@/shared/api/editor";
import type { AssetRefInput, StorageResult } from "@axiforge/editor-core";
import { ok } from "@axiforge/editor-core";
import { fail } from "./httpDomains";

export async function httpAddAssetRef(
  projectId: string,
  ref: AssetRefInput,
): Promise<StorageResult<{ id: string }>> {
  try {
    const created = await projectApi.addAssetRef(projectId, {
      asset_type: ref.assetType,
      asset_id: ref.assetId,
    });
    return ok({ id: created.id });
  } catch (e) {
    return fail(e, "project", projectId);
  }
}

/** 服务端 404 必须显式失败：把「没删到」演成删除成功，界面上就是一次无痕的操作 */
export async function httpRemoveAssetRef(
  projectId: string,
  refId: string,
): Promise<StorageResult<void>> {
  try {
    await projectApi.removeAssetRef(projectId, refId);
    return ok(undefined);
  } catch (e) {
    return fail(e, "asset_ref", refId);
  }
}
