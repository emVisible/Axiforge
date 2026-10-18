/**
 * 上传口的平台分派（L5）——组件侧只认 `File → ref`，落在哪里由 Provider 决定：
 * 桌面经 AssetStore 落 `$HOME/Documents/Axiforge/assets/`，浏览器经 HTTP 实现
 * POST `/api/v1/upload` 返回 `/uploads/...`。两条路共用同一契约方法，不分叉判断。
 */

import type { StorageError, StorageProvider } from "@axiforge/editor-core";
import { getStorageProvider } from "./index";

function describeError(error: StorageError): string {
  const detail = "detail" in error ? error.detail : "id" in error ? error.id : "";
  return `${error.code}${detail ? `: ${detail}` : ""}`;
}

/** File → 素材 ref（失败抛错，由组件呈现；ref 交给 onChange 持久化） */
export async function uploadFileAsAsset(
  file: File,
  provider?: StorageProvider,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const p = provider ?? (await getStorageProvider());
  const saved = await p.saveAsset({
    name: file.name,
    mime: file.type || "application/octet-stream",
    bytes,
  });
  if (!saved.ok) throw new Error(describeError(saved.error));
  return saved.data.ref;
}
