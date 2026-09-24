/**
 * 素材引用（ref）的纯函数层——L4 契约的词汇表，零平台依赖。
 *
 * 裁决：`ref` 是工程数据里唯一被持久化的素材形态（如 `assets/3f9a….png`、
 * 历史值 `/uploads/characters/x.png`）。把它变成可显示 URL 的规则只存在于此文件；
 * 文件系统与 Tauri asset 协议是平台能力，经 `AssetUrlContext` 注入，内核不得 import。
 */

import type { AssetStore } from "./types";
import { err, ok } from "./types";

export const LOCAL_ASSET_PREFIX = "assets/";

/** 一个词一个义：local=待本地根目录解析；direct=可直接交给 img；invalid=越界，拒绝显示 */
export type AssetRefKind = "empty" | "local" | "direct" | "invalid";

/** 分类素材引用；任何输入都有归属（不抛异常） */
export function classifyAssetRef(ref: string | null | undefined): AssetRefKind {
  if (ref === null || ref === undefined || ref.trim() === "") return "empty";
  const value = ref.trim();
  if (value.includes("..")) return "invalid";
  if (value.startsWith(LOCAL_ASSET_PREFIX)) return "local";
  // /uploads/…、http(s)://、data:、blob: 及历史裸路径：WebView 自行解析，内核不做判断
  return "direct";
}

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "video/mp4": "mp4",
};

/** 扩展名：优先原始文件名后缀，其次 mime 映射，最后 bin；一律小写且仅含字母数字 */
export function extensionFor(name: string, mime: string): string {
  const trimmed = name.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot >= 0 && dot < trimmed.length - 1) {
    const ext = trimmed.slice(dot + 1).toLowerCase();
    if (/^[a-z0-9]{1,5}$/.test(ext)) return ext;
  }
  return MIME_EXT[mime.split(";")[0]!.trim()] ?? "bin";
}

/** 本地素材 ref 的唯一形态 */
export function assetRefFor(key: string, ext: string): string {
  return `${LOCAL_ASSET_PREFIX}${key}.${ext}`;
}

/**
 * 内容键（FNV-1a 128bit 变体，非加密）——仅供内存实现与测试做同内容去重。
 * 桌面/服务端落盘用 sha256（由 L5 平台侧计算）；契约只断言
 * 「同字节→同 ref、异字节→异 ref」，不锁定算法，故两轨不冲突。
 */
export function contentKey(bytes: Uint8Array): string {
  const parts: number[] = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i]!;
    for (let p = 0; p < 4; p += 1) {
      parts[p] = (parts[p]! ^ b) >>> 0;
      parts[p] = Math.imul(parts[p]!, 0x01000193) >>> 0;
      parts[p] = (parts[p]! + i) >>> 0;
    }
  }
  return parts.map((p) => p.toString(16).padStart(8, "0")).join("");
}

function joinPath(root: string, rel: string): string {
  return root.endsWith("/") ? `${root}${rel}` : `${root}/${rel}`;
}

/** 本地 ref → 绝对路径；非 local 或根目录缺失返回 null（调用方据此呈现不可用态） */
export function localAssetPath(
  root: string | null | undefined,
  ref: string,
): string | null {
  if (classifyAssetRef(ref) !== "local") return null;
  if (!root || root.trim() === "") return null;
  return joinPath(root.trim(), ref.trim());
}

export interface AssetUrlContext {
  /** 本地素材根目录绝对路径；null = 当前环境无法解析本地素材 */
  readonly root: string | null;
  /** 绝对路径 → WebView 可显示 URL（桌面注入 Tauri convertFileSrc；缺省直用路径） */
  readonly toDisplayUrl?: (absPath: string) => string;
}

/**
 * 素材引用 → 可显示 URL（全函数，永不抛）。
 * - empty / invalid → ""（调用方渲染缺图态，而非坏链）
 * - direct → 原样透传（服务端与内联引用本就可显示）
 * - local → 根目录拼接后经 toDisplayUrl 转换；根目录缺失 → ""
 */
export function resolveAssetUrl(
  ref: string | null | undefined,
  ctx: AssetUrlContext,
): string {
  const kind = classifyAssetRef(ref);
  if (kind === "empty" || kind === "invalid") return "";
  const value = ref!.trim();
  if (kind === "direct") return value;
  const abs = localAssetPath(ctx.root, value);
  if (abs === null) return "";
  return ctx.toDisplayUrl ? ctx.toDisplayUrl(abs) : abs;
}

/**
 * 内存素材仓——`AssetStore` 端口的基准实现。
 * 用途：契约套件与 SQLite 测试的注入物；`count()` 供去重断言（同内容只应占一份）。
 */
export function createMemoryAssetStore(): AssetStore & {
  count(): number;
} {
  const store = new Map<string, Uint8Array>();
  return {
    async write(input) {
      if (input.bytes.byteLength === 0) {
        return err({ code: "io", detail: "素材字节为空" });
      }
      const ref = assetRefFor(
        contentKey(input.bytes),
        extensionFor(input.name, input.mime),
      );
      store.set(ref, input.bytes.slice());
      return ok({ ref, mime: input.mime, size: input.bytes.byteLength });
    },
    async read(ref) {
      if (classifyAssetRef(ref) !== "local") {
        return err({ code: "not_found", entity: "asset", id: ref });
      }
      const bytes = store.get(ref.trim());
      if (!bytes) return err({ code: "not_found", entity: "asset", id: ref });
      return ok(bytes.slice());
    },
    count: () => store.size,
  };
}
