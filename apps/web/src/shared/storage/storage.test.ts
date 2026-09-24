import { describe, expect, it } from "vitest";
import { MemoryStorageProvider, collectAssetRefs, unpackAxsp } from "@axiforge/editor-core";
import { exportProjectAsAxsp, importProjectFromAxsp } from "./index";
import { HttpStorageProvider } from "./httpStorageProvider";

/**
 * .axsp 导出/导入组合的往返等价验证（Memory 基准实现）。
 * 导入 = 现有契约组合（createProject + saveNarrative + addRole），不新增接口方法。
 */

describe(".axsp 导出/导入组合", () => {
  it("export → import：新工程数据与原工程等价（新 id）", async () => {
    const provider = new MemoryStorageProvider();
    const created = await provider.createProject({ title: "原工程" });
    if (!created.ok) throw new Error("create failed");
    const id = created.data.id;

    await provider.saveNarrative(id, {
      axsSource: "# 开始\n旁白：往返验证。\n",
      nodes: [
        {
          id: "n1",
          stageId: "scene-main",
          editorData: { position: { x: 1, y: 2 } },
          narrativeData: { title: "开始", script: [{ op: "narration", text: "往返验证。" }] },
          sortOrder: 0,
        },
      ],
      edges: [],
    });
    await provider.addRole(id, { characterRefId: "char-9" });

    // 导出
    const packed = await exportProjectAsAxsp(provider, id);
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;

    // 容器结构：manifest + 素材清单
    const unpacked = unpackAxsp(packed.data);
    expect(unpacked.ok).toBe(true);
    if (!unpacked.ok) return;
    expect(unpacked.data.manifest.name).toBe("原工程");
    expect(collectAssetRefs(unpacked.data.project)).toEqual([]);

    // 导入 → 新 id、数据等价
    const imported = await importProjectFromAxsp(provider, packed.data);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.data.id).not.toBe(id);
    expect(imported.data.title).toBe("原工程");

    const orig = await provider.loadProject(id);
    const copy = await provider.loadProject(imported.data.id);
    expect(orig.ok && copy.ok).toBe(true);
    if (!orig.ok || !copy.ok) return;
    expect(copy.data.nodes).toEqual(orig.data.nodes);
    expect(copy.data.edges).toEqual(orig.data.edges);
    expect(copy.data.axsSource).toBe(orig.data.axsSource);
    expect(copy.data.roles.map((r) => r.characterRefId)).toEqual(
      orig.data.roles.map((r) => r.characterRefId),
    );
  });

  it("导入损坏文本 → corrupted，不产生半工程", async () => {
    const provider = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(provider, "broken{");
    expect(r.ok).toBe(false);
    const list = await provider.listProjects();
    expect(list.ok && list.data).toHaveLength(0);
  });
});

/**
 * HTTP 实现的素材口——web 冻结线行为：ref 就是服务端 /uploads/... 绝对路径，
 * 与桌面实现（本地相对 ref）在 resolveAssetUrl 处汇合，不在此处判断平台。
 */
describe("HttpStorageProvider 素材口", () => {
  const stubFetch = (impl: (url: string, init?: RequestInit) => unknown) => {
    const original = globalThis.fetch;
    globalThis.fetch = impl as unknown as typeof fetch;
    return {
      restore: () => {
        globalThis.fetch = original;
      },
    };
  };

  it("saveAsset POST /api/v1/upload，服务端 url 原样作 ref", async () => {
    const seen: string[] = [];
    const { restore } = stubFetch((url) => {
      seen.push(String(url));
      return {
        ok: true,
        status: 200,
        json: async () => ({ url: "/uploads/ab.png" }),
      };
    });
    try {
      const p = new HttpStorageProvider("creator-1");
      const saved = await p.saveAsset({
        name: "x.png",
        mime: "image/png",
        bytes: new Uint8Array([1, 2, 3]),
      });
      expect(seen).toEqual(["/api/v1/upload"]);
      expect(saved.ok && saved.data.ref).toBe("/uploads/ab.png");
      expect(saved.ok && saved.data.size).toBe(3);
    } finally {
      restore();
    }
  });

  it("空字节 → io 且不发请求；上传非 2xx → io；响应缺 url → corrupted", async () => {
    let requests = 0;
    const { restore } = stubFetch(() => {
      requests += 1;
      return { ok: true, status: 200, json: async () => ({}) };
    });
    try {
      const p = new HttpStorageProvider("c");
      const empty = await p.saveAsset({
        name: "e.png",
        mime: "image/png",
        bytes: new Uint8Array([]),
      });
      expect(empty.ok).toBe(false);
      if (!empty.ok) expect(empty.error.code).toBe("io");
      expect(requests).toBe(0);

      const noUrl = await p.saveAsset({
        name: "a.png",
        mime: "image/png",
        bytes: new Uint8Array([1]),
      });
      expect(noUrl.ok).toBe(false);
      if (!noUrl.ok) expect(noUrl.error.code).toBe("corrupted");
    } finally {
      restore();
    }

    const { restore: restore2 } = stubFetch(() => ({ ok: false, status: 413 }));
    try {
      const p = new HttpStorageProvider("c");
      const tooBig = await p.saveAsset({
        name: "big.png",
        mime: "image/png",
        bytes: new Uint8Array([1, 2]),
      });
      expect(tooBig.ok).toBe(false);
      if (!tooBig.ok) expect(tooBig.error.code).toBe("io");
    } finally {
      restore2();
    }
  });

  it("readAsset：direct 引用取回字节；404 → not_found；本地 ref 不属本实现 → not_found", async () => {
    const { restore } = stubFetch((url) =>
      String(url) === "/uploads/hit.png"
        ? { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([7, 8]).buffer }
        : { ok: false, status: 404 },
    );
    try {
      const p = new HttpStorageProvider("c");
      const hit = await p.readAsset("/uploads/hit.png");
      expect(hit.ok && Array.from(hit.data)).toEqual([7, 8]);
      const miss = await p.readAsset("/uploads/ghost.png");
      expect(miss.ok).toBe(false);
      if (!miss.ok) expect(miss.error.code).toBe("not_found");
      const local = await p.readAsset("assets/ab.png");
      expect(local.ok).toBe(false);
      if (!local.ok) expect(local.error.code).toBe("not_found");
    } finally {
      restore();
    }
  });
});
