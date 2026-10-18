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
  // 越界守卫**只对本地 ref 有意义**——只有它会被拼进文件系统路径（`localAssetPath`）。
  // 2026-10-01 复审改：原守卫在归属判定**之前**无条件生效，于是 `..` 也作废了三族
  // 下一行明说「内核不做判断」的引用，代价比"显示坏图"更大：
  // `httpStorageProvider.readAsset` 要求 `kind === "direct"` 才读，
  // 所以一个带双点的**后端上传路径**（`/uploads/characters/a..b.png`）既显示成缺图、又读不回字节。
  // 守卫强度不变：本地 ref 里的 `..` 仍然照拦（下面这条与既有那两条判据都钉着它）。
  // 顺带一句量级：我们自己生成的 ref 是 `sha256 + 扩展名`，**永远不含 `..`**，
  // 所以这道守卫实际只对**外来 ref**点火——而那正是它此前误伤的那一族。
  if (value.startsWith(LOCAL_ASSET_PREFIX)) {
    if (value.includes("..")) return "invalid";
    return "local";
  }
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
 * 桌面/服务端落盘用 sha256（由 L5 平台侧计算）。
 *
 * **精确的不变量是「同字节 + 同后缀 → 同 ref」**，不是「同字节 → 同 ref」
 * ——2026-10-01 复审把这里原来那句「契约只断言『同字节→同 ref、异字节→异 ref』」改正了。
 * 起因是有人照那句措辞去找代码缺陷，找到 `saveAsset` 的 ref 里含扩展名
 * （`assetRefFor(contentKey(bytes), extensionFor(name, mime))`），
 * 而实测**同一份字节换一个后缀会得到两个 ref**（`…<key>.png` 与 `…<key>.jpg`）。
 *
 * **为什么含扩展名是对的**：ref 就是**落盘文件名**（`assets/<摘要>.<扩展名>`），
 * 去掉扩展名文件就没有类型了，而 `readAsset` 与 `resolveAssetUrl` 都要靠它选解码路径。
 * 所以这是**契约那句话不精确，不是实现有缺陷**。
 *
 * **两条用户承诺都不受这条影响**（`docs/user/desktop/desktop-and-axsp.md`）：
 * ① 「同一张图重复导入只会存一份」——重复导入意味着同一个文件名、因而同一个后缀；
 *    而"字节完全相同但后缀不同"对真实格式几乎不可达（同一张图的 JPEG 与 PNG 字节本就不同）。
 * ② 「工程包在别的电脑上打开时能认得同一个文件」——ref（摘要 + 后缀）随包一起过去，
 *    接收方按 ref 解析，**不重新算摘要**，所以后缀在不在身份里都不影响认得。
 * 精确形状由 `assets.test.ts` 那条「同字节换后缀给两个 ref」钉住，
 * 好让下一个人别照那句宽松措辞把代码"修"成真的缺陷。
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
