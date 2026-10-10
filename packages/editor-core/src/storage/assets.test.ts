import { describe, expect, it } from "vitest";
import {
  assetRefFor,
  classifyAssetRef,
  contentKey,
  createMemoryAssetStore,
  extensionFor,
  localAssetPath,
  resolveAssetUrl,
} from "./assets";

describe("素材引用分类 classifyAssetRef", () => {
  it("空引用（null/undefined/空白）归 empty", () => {
    expect(classifyAssetRef(null)).toBe("empty");
    expect(classifyAssetRef(undefined)).toBe("empty");
    expect(classifyAssetRef("")).toBe("empty");
    expect(classifyAssetRef("   ")).toBe("empty");
  });

  it("assets/ 前缀归 local；越界归 invalid；其余透传", () => {
    expect(classifyAssetRef("assets/ab12.png")).toBe("local");
    expect(classifyAssetRef("assets/../../etc/passwd")).toBe("invalid");
    expect(classifyAssetRef("/uploads/characters/x.jpg")).toBe("direct");
    expect(classifyAssetRef("https://cdn.example.com/a.png")).toBe("direct");
    expect(classifyAssetRef("data:image/png;base64,AAA")).toBe("direct");
    expect(classifyAssetRef("legacy-name.png")).toBe("direct");
  });

  it("首尾空白不影响判定", () => {
    expect(classifyAssetRef("  assets/x.png  ")).toBe("local");
  });
});

describe("扩展名与 ref 形态", () => {
  it("原始文件名后缀优先，其次 mime 映射，未知归 bin", () => {
    expect(extensionFor("立绘.PNG", "image/jpeg")).toBe("png");
    expect(extensionFor("no-extension", "image/webp")).toBe("webp");
    expect(extensionFor("weird.tar.gz", "image/png")).toBe("gz");
    expect(extensionFor("no-ext", "application/octet-stream")).toBe("bin");
    expect(extensionFor("x.jp2 ", "image/jpeg")).toBe("jp2");
  });

  it("ref 唯一形态 assets/<key>.<ext>", () => {
    expect(assetRefFor("ab12", "png")).toBe("assets/ab12.png");
  });

  it("contentKey：同字节同键、异字节异键", () => {
    const a = contentKey(new Uint8Array([1, 2, 3]));
    expect(a).toBe(contentKey(new Uint8Array([1, 2, 3])));
    expect(a).not.toBe(contentKey(new Uint8Array([1, 2, 4])));
    expect(a).not.toBe(contentKey(new Uint8Array([1, 2, 3, 0])));
    expect(a).toMatch(/^[0-9a-f]{8,}$/);
  });
});

describe("本地路径拼接 localAssetPath", () => {
  it("根目录带/不带尾斜杠均正确拼接", () => {
    expect(localAssetPath("/Users/x/Documents/Axiforge", "assets/a.png")).toBe(
      "/Users/x/Documents/Axiforge/assets/a.png",
    );
    expect(localAssetPath("/Users/x/Documents/Axiforge/", "assets/a.png")).toBe(
      "/Users/x/Documents/Axiforge/assets/a.png",
    );
  });

  it("非 local 引用或缺根目录 → null", () => {
    expect(localAssetPath("/root", "/uploads/a.png")).toBeNull();
    expect(localAssetPath("/root", "assets/../x.png")).toBeNull();
    expect(localAssetPath(null, "assets/a.png")).toBeNull();
    expect(localAssetPath("  ", "assets/a.png")).toBeNull();
  });
});

describe("显示解析 resolveAssetUrl（宪章 C1 的唯一规则处）", () => {
  const desktop = {
    root: "/Users/x/Documents/Axiforge",
    toDisplayUrl: (abs: string) => `asset://localhost/${abs}`,
  };

  it("/uploads/... 服务端引用原样透传（web 冻结线零变更）", () => {
    expect(resolveAssetUrl("/uploads/characters/x.jpg", desktop)).toBe(
      "/uploads/characters/x.jpg",
    );
    expect(resolveAssetUrl("https://cdn/a.png", { root: null })).toBe(
      "https://cdn/a.png",
    );
  });

  /**
   * 2026-10-01 复审新增：越界守卫只对**本地** ref 有意义。
   * 守卫原先在归属判定之前无条件生效，于是 `..` 作废了三族下一行明说「内核不做判断」的引用。
   * 代价不只是"显示成缺图"——`httpStorageProvider.readAsset` 要求 `kind === "direct"` 才读，
   * 所以一个带双点的**后端上传路径**（文件名 `a..b.png` 在磁盘上完全合法）
   * 在浏览器态**既显示成缺图、又读不回字节**。
   * 与上面那条 `assets/../../etc/passwd` 并排看才完整：**守卫对本地 ref 一步没让**，
   * 放开的只是它此前误伤的那一族。
   */
  it("带 .. 的外来引用归 direct（内核不判）；本地 ref 里的 .. 仍照拦", () => {
    // 外来：内核不碰文件系统，交给 WebView 解析
    expect(classifyAssetRef("/uploads/characters/a..b.png")).toBe("direct");
    expect(classifyAssetRef("https://cdn.example.com/a..b.png")).toBe("direct");
    expect(classifyAssetRef("第1章..png")).toBe("direct");
    // 可显示 URL 原样透传（不再渲染成缺图态）
    expect(resolveAssetUrl("/uploads/characters/a..b.png", desktop)).toBe(
      "/uploads/characters/a..b.png",
    );
    // 本地：越界仍然拒绝，且不拼路径
    expect(classifyAssetRef("assets/../x.png")).toBe("invalid");
    expect(localAssetPath("/root", "assets/../x.png")).toBeNull();
    expect(resolveAssetUrl("assets/../../x.png", desktop)).toBe("");
  });

  it("assets/... 在桌面态经根目录 + 协议转换", () => {
    expect(resolveAssetUrl("assets/ab.png", desktop)).toBe(
      "asset://localhost//Users/x/Documents/Axiforge/assets/ab.png",
    );
  });

  it("assets/... 在无根目录环境（浏览器）解析为空串", () => {
    expect(resolveAssetUrl("assets/ab.png", { root: null })).toBe("");
  });

  it("local 且未注入 toDisplayUrl 时退化为绝对路径", () => {
    expect(resolveAssetUrl("assets/ab.png", { root: "/data/ax" })).toBe(
      "/data/ax/assets/ab.png",
    );
  });

  it("空与非法引用一律空串（渲染缺图态而非坏链）", () => {
    expect(resolveAssetUrl("", desktop)).toBe("");
    expect(resolveAssetUrl(null, desktop)).toBe("");
    expect(resolveAssetUrl("assets/../../x.png", desktop)).toBe("");
  });
});

describe("内存素材仓 createMemoryAssetStore", () => {
  it("写入后可读回等价字节；同内容去重不增份数", async () => {
    const store = createMemoryAssetStore();
    const bytes = new Uint8Array([7, 7, 7]);
    const first = await store.write({ name: "a.png", mime: "image/png", bytes });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.ref).toMatch(/^assets\/[0-9a-f]+\.png$/);
    expect(first.data.size).toBe(3);

    const again = await store.write({ name: "b.png", mime: "image/png", bytes });
    expect(again.ok && again.data.ref).toBe(first.data.ref);
    expect(store.count()).toBe(1);

    const read = await store.read(first.data.ref);
    expect(read.ok && Array.from(read.data as Uint8Array)).toEqual([7, 7, 7]);
  });

  it("空字节 → io；越界/缺失 ref → not_found", async () => {
    const store = createMemoryAssetStore();
    const empty = await store.write({
      name: "e.png",
      mime: "image/png",
      bytes: new Uint8Array([]),
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe("io");

    const traversal = await store.read("assets/../../x.png");
    expect(traversal.ok).toBe(false);
    if (!traversal.ok) expect(traversal.error.code).toBe("not_found");

    const missing = await store.read("assets/ghost.png");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("not_found");
  });

  it("读回的字节是副本，改它不污染仓内数据", async () => {
    const store = createMemoryAssetStore();
    const saved = await store.write({
      name: "c.png",
      mime: "image/png",
      bytes: new Uint8Array([1, 2]),
    });
    if (!saved.ok) throw new Error("write failed");
    const read = await store.read(saved.data.ref);
    if (!read.ok) throw new Error("read failed");
    read.data[0] = 99;
    const reread = await store.read(saved.data.ref);
    expect(reread.ok && Array.from(reread.data)).toEqual([1, 2]);
  });
});
