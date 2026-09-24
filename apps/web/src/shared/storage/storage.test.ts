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
 * v2 容器的跨机语义：演员表与素材字节随包迁移，角色在目标库另建新 id，
 * 工程内的 characterId 引用随之重映射；素材 ref 内容寻址，两端同路径。
 */
describe(".axsp v2 导出/导入：演员表与素材随包", () => {
  it("角色新建、引用重映射、素材字节可读回", async () => {
    const src = new MemoryStorageProvider();
    const created = await src.createProject({ title: "示范作" });
    if (!created.ok) throw new Error("create failed");
    const id = created.data.id;

    // 真实链路里 ref 由 saveAsset 返回后写回角色数据（内容寻址，不可手写文件名）
    const sprite = await src.saveAsset({
      name: "lin-smile.png",
      mime: "image/png",
      bytes: new Uint8Array([1, 2, 3]),
    });
    const portrait = await src.saveAsset({
      name: "lin.png",
      mime: "image/png",
      bytes: new Uint8Array([4, 5]),
    });
    if (!sprite.ok || !portrait.ok) throw new Error("asset failed");

    const saved = await src.saveCharacter({
      id: "",
      name: "堰纱",
      characterData: { sprites: { smile: sprite.data.ref } },
      imagePath: portrait.data.ref,
    });
    if (!saved.ok) throw new Error("character failed");
    const charId = saved.data.id;
    await src.addRole(id, { characterRefId: charId });

    await src.saveNarrative(id, {
      axsSource: null,
      nodes: [
        {
          id: "n1",
          stageId: null,
          editorData: {},
          narrativeData: {
            title: "开场",
            script: [
              { op: "say", characterId: charId, text: "你好。" },
              { op: "bg", image: sprite.data.ref },
            ],
          },
          sortOrder: 0,
        },
      ],
      edges: [],
    });

    const packed = await exportProjectAsAxsp(src, id);
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;

    const dst = new MemoryStorageProvider();
    const imported = await importProjectFromAxsp(dst, packed.data);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const chars = await dst.listCharacters();
    expect(chars.ok && chars.data).toHaveLength(1);
    if (!chars.ok) return;
    const newId = chars.data[0]!.id;
    expect(chars.data[0]!.name).toBe("堰纱");
    expect(newId).not.toBe(charId);

    const load = await dst.loadProject(imported.data.id);
    expect(load.ok).toBe(true);
    if (!load.ok) return;
    const script = (load.data.nodes[0]!.narrativeData as { script: { characterId?: string }[] })
      .script;
    expect(script[0]!.characterId).toBe(newId);
    expect(load.data.roles.map((r) => r.characterRefId)).toEqual([newId]);

    // 角色立绘引用与素材字节随包到达（ref 内容寻址，两端同路径）
    expect(chars.data[0]!.imagePath).toBe(portrait.data.ref);
    const back = await dst.readAsset(portrait.data.ref);
    expect(back.ok && Array.from(back.data)).toEqual([4, 5]);
    const backSprite = await dst.readAsset(sprite.data.ref);
    expect(backSprite.ok && Array.from(backSprite.data)).toEqual([1, 2, 3]);
  });

  it("导入不得覆盖目标库已有角色", async () => {
    const src = new MemoryStorageProvider();
    const created = await src.createProject({ title: "小作" });
    if (!created.ok) throw new Error("create failed");
    const char = await src.saveCharacter({
      id: "",
      name: "旅人",
      characterData: {},
      imagePath: null,
    });
    if (!char.ok) throw new Error("character failed");
    await src.addRole(created.data.id, { characterRefId: char.data.id });
    const packed = await exportProjectAsAxsp(src, created.data.id);
    if (!packed.ok) throw new Error("export failed");

    const dst = new MemoryStorageProvider();
    const mine = await dst.saveCharacter({
      id: "",
      name: "我自己的角色",
      characterData: { anchor: { tone: "冷" } },
      imagePath: null,
    });
    if (!mine.ok) throw new Error("seed failed");
    await importProjectFromAxsp(dst, packed.data);

    const chars = await dst.listCharacters();
    expect(chars.ok && chars.data.map((c) => c.name).sort()).toEqual([
      "我自己的角色",
      "旅人",
    ]);
    const stillMine = await dst.getCharacter(mine.data.id);
    expect(stillMine.ok && stillMine.data.name).toBe("我自己的角色");
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
