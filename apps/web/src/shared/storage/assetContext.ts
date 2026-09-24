/**
 * 素材显示解析上下文（L5）——把内核的 `resolveAssetUrl` 接到当前运行环境。
 *
 * 内核只认识 ref 词汇（`assets/…` / `/uploads/…`），绝对根目录与 Tauri asset
 * 协议是平台能力：根目录由 Provider 工厂在初始化时登记一次，此后解析全同步，
 * 组件侧（`getImageUrl`）无需 await。
 */

import { resolveAssetUrl } from "@axiforge/editor-core";
import { convertFileSrc } from "@tauri-apps/api/core";

let localRoot: string | null = null;

/** 由 Provider 工厂调用：桌面登记本地素材根目录，浏览器态置 null */
export function setLocalAssetRoot(root: string | null): void {
  localRoot = root;
}

export function getLocalAssetRoot(): string | null {
  return localRoot;
}

/** ref → 可显示 URL；空/非法/无法解析一律空串（调用方渲染缺图态） */
export function assetDisplayUrl(ref: string | null | undefined): string {
  return resolveAssetUrl(ref, {
    root: localRoot,
    toDisplayUrl: localRoot ? convertFileSrc : undefined,
  });
}
