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

  it("道具引用随包往返：挂了两件道具的工程导入后引用还在，不静默丢", async () => {
    const provider = new MemoryStorageProvider();
    const created = await provider.createProject({ title: "带道具" });
    if (!created.ok) throw new Error("create failed");
    const a = await provider.addAssetRef(created.data.id, { assetType: "item", assetId: "item-a" });
    const b = await provider.addAssetRef(created.data.id, { assetType: "item", assetId: "item-b" });
    if (!a.ok || !b.ok) throw new Error("addAssetRef failed");

    const packed = await exportProjectAsAxsp(provider, created.data.id);
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;
    const imported = await importProjectFromAxsp(provider, packed.data);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const copy = await provider.loadProject(imported.data.id);
    if (!copy.ok) throw new Error("load failed");
    expect(copy.data.assetRefs.map((r) => r.assetId)).toEqual(["item-a", "item-b"]);
    // 引用行是新库分配的 id：把导出者的行 id 抄进别人库里没有任何意义
    expect(copy.data.assetRefs.map((r) => r.id)).not.toEqual([a.data.id, b.data.id]);
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
describe("storedCharacterToResponse（桌面离线态复用角色组件的适配层）", () => {
  it("逐字段映射；本地不存在的标签/血统/计数给真实空值而非猜测值", async () => {
    const { storedCharacterToResponse } = await import("./index");
    const r = storedCharacterToResponse({
      id: "c1",
      name: "堰纱",
      characterData: { anchor: { name: "堰纱" }, sprites: { smile: "assets/s.png" } },
      imagePath: "assets/p.png",
      isPublic: true,
      authorId: "u1",
    });
    expect(r.id).toBe("c1");
    expect(r.name).toBe("堰纱");
    expect(r.image_path).toBe("assets/p.png");
    expect(r.is_public).toBe(true);
    expect(r.author_id).toBe("u1");
    expect(r.character_data.anchor.name).toBe("堰纱");
    expect(r.character_data.sprites).toEqual({ smile: "assets/s.png" });
    expect(r.tags).toEqual([]);
    expect(r.fork_from).toBeNull();
    expect(r.view_count).toBe(0);
  });

  it("authorId 为 null 时归一为空串（DTO 要求 string，不造归属）", async () => {
    const { storedCharacterToResponse } = await import("./index");
    const r = storedCharacterToResponse({
      id: "c2",
      name: "无主",
      characterData: {},
      imagePath: null,
      isPublic: false,
      authorId: null,
    });
    expect(r.author_id).toBe("");
    expect(r.image_path).toBeUndefined();
    expect(r.is_public).toBe(false);
  });
});

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
      isPublic: false,
      authorId: "e2e-author",
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

    // 新工程的角色引用即导入后的新角色（无范围 list 只看公开，故按引用取回）
    const load = await dst.loadProject(imported.data.id);
    expect(load.ok).toBe(true);
    if (!load.ok) return;
    const newId = load.data.roles[0]!.characterRefId;
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(charId);

    const importedChar = await dst.getCharacter(newId);
    expect(importedChar.ok).toBe(true);
    if (!importedChar.ok) return;
    expect(importedChar.data.name).toBe("堰纱");
    // 归属改判接收方、公开位不继承导出者
    expect(importedChar.data.isPublic).toBe(false);
    expect(importedChar.data.authorId).not.toBe("e2e-author");

    const script = (load.data.nodes[0]!.narrativeData as { script: { characterId?: string }[] })
      .script;
    expect(script[0]!.characterId).toBe(newId);

    // 导入未把私有角色变成公开：无范围（仅公开）看不到它
    const publicView = await dst.listCharacters();
    expect(publicView.ok && publicView.data).toHaveLength(0);

    // 角色立绘引用与素材字节随包到达（ref 内容寻址，两端同路径）
    expect(importedChar.data.imagePath).toBe(portrait.data.ref);
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
      isPublic: false,
      authorId: "a1",
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
      isPublic: false,
      authorId: "me",
    });
    if (!mine.ok) throw new Error("seed failed");
    const imported = await importProjectFromAxsp(dst, packed.data);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    // 我自己的角色没被覆盖，也没被导入项挤掉
    const mineList = await dst.listCharacters({ authorId: "me" });
    expect(mineList.ok && mineList.data.map((c) => c.name)).toEqual(["我自己的角色"]);
    const stillMine = await dst.getCharacter(mine.data.id);
    expect(stillMine.ok && stillMine.data.name).toBe("我自己的角色");

    // 导入的角色是另一条新档案（按新工程的角色引用取回）
    const load = await dst.loadProject(imported.data.id);
    expect(load.ok).toBe(true);
    if (!load.ok) return;
    const importedId = load.data.roles[0]!.characterRefId;
    expect(importedId).not.toBe(mine.data.id);
    const importedChar = await dst.getCharacter(importedId);
    expect(importedChar.ok && importedChar.data.name).toBe("旅人");
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

  it("updateProjectMeta 逐字段转发：全 patch 一个不丢，局部 patch 不带上没提的键", async () => {
    const bodies: Record<string, unknown>[] = [];
    const { restore } = stubFetch((_url, init) => {
      bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return { ok: true, status: 200, json: async () => ({}) };
    });
    try {
      const p = new HttpStorageProvider("c");
      const all = await p.updateProjectMeta("p1", {
        title: "改名",
        description: "一座会下沉的城",
        themeTags: ["末日"],
        mechanism: "密室逃脱",
        genre: "悬疑",
        coverImage: "/uploads/cover.png",
        isMeta: true,
        worldSetting: "近未来移动都市",
        rules: "不得在白天点灯",
      });
      expect(all.ok).toBe(true);
      // 曾经只转发 title/axs_source，其余六项在 web 支被静默丢弃
      expect(bodies[0]).toEqual({
        title: "改名",
        description: "一座会下沉的城",
        theme_tags: ["末日"],
        mechanism: "密室逃脱",
        genre: "悬疑",
        cover_image: "/uploads/cover.png",
        is_meta: true,
        world_setting: "近未来移动都市",
        rules: "不得在白天点灯",
      });

      bodies.length = 0;
      await p.updateProjectMeta("p1", { title: "只改名" });
      // 没提到的键必须整个缺席：带上 null 等于覆写掉用户没打算改的字段
      expect(bodies[0]).toEqual({ title: "只改名" });
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

/**
 * 道具引用口（S13-2c）：浏览器支与桌面支共用同一 L4 语义。
 * 契约用例只盯 Memory/SQLite 两支，HTTP 支在这里补——
 * 否则"两端一致"就只是一句注释，request body 写成 camelCase 也不会有人拦。
 */
describe("HttpStorageProvider 道具引用口", () => {
  const PROJECT_URL = "/api/v1/editor/projects/p1";

  const stubProjectApi = (
    refs: { id: string; project_id: string; asset_type: "item"; asset_id: string }[],
    deleteStatus = 204,
  ) => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({
        url: String(url),
        method,
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      });
      if (String(url) === `${PROJECT_URL}/assets`) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: "ref-9",
            project_id: "p1",
            asset_type: "item",
            asset_id: "item-a",
            locked_version: null,
            created_at: "2026-09-29T00:00:00Z",
          }),
        });
      }
      if (String(url) === `${PROJECT_URL}/assets/ghost`) {
        return Promise.resolve({
          ok: deleteStatus < 300,
          status: deleteStatus,
          text: async () => "no such ref",
          json: async () => ({}),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          id: "p1",
          title: "带道具的工程",
          updated_at: "2026-09-29T00:00:00Z",
          asset_refs: refs,
        }),
      });
    }) as unknown as typeof fetch;
    return { calls, restore: () => { globalThis.fetch = original; } };
  };

  it("bundle 读回服务端 asset_refs；add 用 snake_case 请求体并回传服务端 id", async () => {
    const stub = stubProjectApi([
      { id: "ref-1", project_id: "p1", asset_type: "item", asset_id: "item-a" },
    ]);
    try {
      const p = new HttpStorageProvider("c");
      const bundle = await p.loadProject("p1");
      expect(bundle.ok).toBe(true);
      if (!bundle.ok) return;
      expect(bundle.data.assetRefs).toEqual([
        { id: "ref-1", projectId: "p1", assetType: "item", assetId: "item-a" },
      ]);

      const added = await p.addAssetRef("p1", { assetType: "item", assetId: "item-a" });
      expect(added.ok && added.data.id).toBe("ref-9");
      const post = stub.calls.find((c) => c.method === "POST");
      expect(post?.url).toBe(`${PROJECT_URL}/assets`);
      expect(post?.body).toEqual({ asset_type: "item", asset_id: "item-a" });

      await p.removeAssetRef("p1", "ref-9");
      const del = stub.calls.find((c) => c.method === "DELETE");
      expect(del?.url).toBe(`${PROJECT_URL}/assets/ref-9`);
    } finally {
      stub.restore();
    }
  });

  it("删不存在的引用 → not_found（服务端 404 不许演成删除成功）", async () => {
    const stub = stubProjectApi([], 404);
    try {
      const p = new HttpStorageProvider("c");
      const r = await p.removeAssetRef("p1", "ghost");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatchObject({ code: "not_found", entity: "asset_ref", id: "ghost" });
    } finally {
      stub.restore();
    }
  });
});

/**
 * 角色域 HTTP 支。把 `listCharacters` 从 Provider 外提到 `httpCharacters.ts` 时做过一次变异：
 * 整段删掉「公开」分支，全套测试照样绿——这个域的「我的 ∪ 公开」合并此前没有一条用例盯着。
 * 下面的用例补上那条腿，顺便把合并的去重键与本地窄化一并钉住。
 */
describe("HttpStorageProvider 角色域", () => {
  const row = (id: string, name: string, isPublic: boolean) => ({
    id, name, character_data: {}, image_path: null, author_id: "me", is_public: isPublic,
  });

  const stubCharacters = () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((url: string) => {
      const u = String(url);
      urls.push(u);
      if (u === "/api/v1/characters/user/me") {
        return Promise.resolve({
          ok: true, status: 200, json: async () => [row("c1", "凛", false)],
        });
      }
      if (u.startsWith("/api/v1/characters/public")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          // c1 在公开投影里是旧副本：同 id 必须保「我的」那条，不得被副本顶掉
          json: async () => ({ items: [row("c1", "凛·旧副本", false), row("c2", "邻", true)], total: 2 }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, text: async () => "no route" });
    }) as unknown as typeof fetch;
    return { urls, restore: () => { globalThis.fetch = original; } };
  };

  it("我的 ∪ 公开按 id 合并，公开副本不顶掉自己的那条", async () => {
    const stub = stubCharacters();
    try {
      const p = new HttpStorageProvider("me");
      const both = await p.listCharacters({ authorId: "me", includePublic: true });
      expect(both.ok).toBe(true);
      if (!both.ok) return;
      expect(both.data.map((c) => c.id)).toEqual(["c1", "c2"]);
      expect(both.data.map((c) => c.name)).toEqual(["凛", "邻"]);
    } finally {
      stub.restore();
    }
  });

  it("只取公开时不打 /characters/user（不发没有主人的请求），search 在本地也窄化一次", async () => {
    const stub = stubCharacters();
    try {
      const p = new HttpStorageProvider("me");
      const pub = await p.listCharacters({ includePublic: true });
      expect(pub.ok && pub.data.map((c) => c.id)).toEqual(["c2"]); // c1 未公开，范围裁决把它挡掉
      expect(stub.urls).not.toContain("/api/v1/characters/user/me");

      const found = await p.listCharacters({ includePublic: true, search: "邻" });
      expect(found.ok && found.data.map((c) => c.id)).toEqual(["c2"]);
      expect(stub.urls.some((u) => u.includes("search="))).toBe(true);
    } finally {
      stub.restore();
    }
  });
});
