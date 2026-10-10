/**
 * TauriAssetStore —— `AssetStore` 端口的桌面实现（ADR-024 决策 3）。
 *
 * 素材字节落 `$HOME/Documents/Axiforge/assets/<摘要>.<ext>`，DB 与工程数据里
 * 只出现相对 ref；目录与 capability scope 同源，越界由 scope 在壳层挡住。
 * 同内容幂等：摘要即文件名，重复写命中同一 ref 且不二次落盘。
 */

import {
  LOCAL_ASSET_PREFIX,
  assetRefFor,
  classifyAssetRef,
  err,
  extensionFor,
  ok,
} from "@axiforge/editor-core";
import type {
  AssetInput,
  AssetStore,
  StorageResult,
  StoredAsset,
} from "@axiforge/editor-core";

/** 素材根目录（相对「文档」目录），与 capabilities fs scope 一致 */
export const ASSET_PROJECT_DIR = "Axiforge";
const ASSET_SUBDIR = LOCAL_ASSET_PREFIX.replace(/\/$/, "");

/**
 * 内容摘要：**只做 SHA-256**，缺 `crypto.subtle` 就抛——不做非加密兜底。
 *
 * 两条在册契约都要求它：`contentKey` 在 editor-core 里写明「仅供内存实现与测试做同内容去重，
 * 桌面/服务端落盘用 sha256」；用户文档（desktop-and-axsp）写明「素材文件名是它内容的 SHA-256 摘要，
 * 工程包在别的电脑上打开时能认得同一个文件」。换成 FNV 键会让同一张图在两台机器上得到两个 ref，
 * 而写入本身照样"成功"——那是静默失效，不是降级。宁可让上传报错并说清原因。
 */
export async function contentDigest(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("素材摘要不可用：当前环境没有 crypto.subtle（非安全上下文），拒绝用非加密键落盘");
  }
  const view = new Uint8Array(bytes.byteLength);
  view.set(bytes);
  const hash = await subtle.digest("SHA-256", view.buffer as ArrayBuffer);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fsPlugin() {
  return import("@tauri-apps/plugin-fs");
}

export class TauriAssetStore implements AssetStore {
  private constructor(readonly rootDir: string) {}

  /** 解析绝对根目录并保证 assets/ 存在；非桌面环境调用即抛（调用方以 isTauriEnvironment 分流） */
  static async create(): Promise<TauriAssetStore> {
    const { documentDir, join } = await import("@tauri-apps/api/path");
    const root = await join(await documentDir(), ASSET_PROJECT_DIR);
    const fs = await fsPlugin();
    await fs.mkdir(await join(root, ASSET_SUBDIR), { recursive: true });
    return new TauriAssetStore(root);
  }

  /** 相对 ref → 绝对路径（ref 形如 `assets/<摘要>.png`） */
  absOf(ref: string): string {
    return `${this.rootDir}/${ref.trim()}`;
  }

  async write(input: AssetInput): Promise<StorageResult<StoredAsset>> {
    if (input.bytes.byteLength === 0) {
      return err({ code: "io", detail: "素材字节为空" });
    }
    let ref: string;
    try {
      ref = assetRefFor(
        await contentDigest(input.bytes),
        extensionFor(input.name, input.mime),
      );
    } catch (cause) {
      return err({ code: "io", detail: "素材摘要不可用（缺 SHA-256），已拒绝落盘", cause });
    }
    try {
      const fs = await fsPlugin();
      const abs = this.absOf(ref);
      if (!(await fs.exists(abs))) await fs.writeFile(abs, input.bytes);
      return ok({ ref, mime: input.mime, size: input.bytes.byteLength });
    } catch (cause) {
      return err({ code: "io", detail: `素材写入失败 ${ref}`, cause });
    }
  }

  async read(ref: string): Promise<StorageResult<Uint8Array>> {
    if (classifyAssetRef(ref) !== "local") {
      return err({ code: "not_found", entity: "asset", id: String(ref) });
    }
    try {
      const fs = await fsPlugin();
      const abs = this.absOf(ref);
      if (!(await fs.exists(abs))) {
        return err({ code: "not_found", entity: "asset", id: ref });
      }
      return ok(await fs.readFile(abs));
    } catch (cause) {
      return err({ code: "io", detail: "素材读取失败", cause });
    }
  }
}
