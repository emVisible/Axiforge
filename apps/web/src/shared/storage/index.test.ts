import type { SqlBackend } from "@axiforge/editor-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Provider 工厂（`createStorageProvider`）的分派判据。
 *
 * 为什么值得为它写测试：这台工厂是**整个桌面存储的唯一入口**，而它选的三条支路
 * 在日常开发里互相看不见——跑浏览器的人永远走不到本地库，跑壳的人永远不会走到 HTTP。
 * 分派错的后果不是报错而是"看起来能用但存到别处去了"。所以这里钉的是三件只有工厂知道的事：
 * 1. 壳支里**素材根目录必须在播种开始之前登记好**（首启会播种示范作：根目录晚登记一秒，
 *    播种进去的立绘在首屏就解析成空串——用户看到的是官方示范作没图，且没有任何错误可查）；
 * 2. `?storage=memory` 那支**只替代存储、不替代壳能力**：它不得去建 `TauriAssetStore`（否则测试宿主会真去摸文件系统）；
 * 3. 播种是**每次进程一次**（`seedOnce` 记忆化），重复调用工厂不能反复播种。
 */

const env = vi.hoisted(() => ({
  tauri: false,
  search: "",
  seedCalls: 0,
  rootAtSeed: "unset" as string | null,
  assetStoreCreates: 0,
  httpBuilt: 0,
}));

class StubBackend implements SqlBackend {
  async select(): Promise<never[]> {
    return [];
  }
  async execute(): Promise<{ rowsAffected: number }> {
    return { rowsAffected: 0 };
  }
  async transactional(): Promise<{ rowsAffected: number }> {
    return { rowsAffected: 0 };
  }
}

vi.mock("@/shared/lib/creatorId", () => ({ getCreatorId: () => "creator-test" }));
vi.mock("./tauriSqlBackend", () => ({
  isTauriEnvironment: () => env.tauri,
  TauriSqlBackend: StubBackend,
}));
vi.mock("./tauriAssetStore", () => ({
  TauriAssetStore: {
    create: async () => {
      env.assetStoreCreates += 1;
      return { rootDir: "/Users/x/Documents/Axiforge", write: vi.fn(), read: vi.fn() };
    },
  },
}));
vi.mock("./httpStorageProvider", () => {
  class StubHttp {
    constructor(_authorId: string) {
      env.httpBuilt += 1;
    }
  }
  return { HttpStorageProvider: StubHttp };
});
vi.mock("./desktopSeed", async () => {
  const ctx = await import("./assetContext");
  return {
    seedDesktopIfEmpty: async () => {
      env.seedCalls += 1;
      // 播种被调用的那一刻读到什么根目录，就是工厂登记的顺序——这条断言不看实现细节，只看事实
      env.rootAtSeed = ctx.getLocalAssetRoot();
      return { status: "seeded", count: 1 };
    },
  };
});
vi.mock("./axspImport", () => ({ importProjectFromAxsp: vi.fn() }));

/** 模块级状态（seedOnce / localRoot）会跨用例串味，所以每个用例都要一份干净的图 */
async function loadFresh() {
  vi.resetModules();
  return import("./index");
}

beforeEach(() => {
  env.tauri = false;
  env.search = "";
  env.seedCalls = 0;
  env.rootAtSeed = "unset";
  env.assetStoreCreates = 0;
  env.httpBuilt = 0;
  (globalThis as { window?: unknown }).window = {
    location: { search: env.search },
  };
});

describe("createStorageProvider 的分派", () => {
  it("壳态：走 SQLite + 本地素材仓，并且根目录在播种之前就已登记", async () => {
    env.tauri = true;
    const mod = await loadFresh();

    const provider = await mod.createStorageProvider();

    expect(provider).toBeInstanceOf(
      (await import("@axiforge/editor-core")).SqliteStorageProvider,
    );
    expect(env.assetStoreCreates).toBe(1);
    expect(env.rootAtSeed).toBe("/Users/x/Documents/Axiforge");
    // 播种之后（也是返回之前）根目录仍然在位：组件侧靠它把 `assets/...` 拼成 asset 协议 URL
    expect((await import("./assetContext")).getLocalAssetRoot()).toBe(
      "/Users/x/Documents/Axiforge",
    );
  });

  it("播种每次进程只做一次，重复调用工厂不会反复播种", async () => {
    env.tauri = true;
    const mod = await loadFresh();

    await mod.createStorageProvider();
    await mod.createStorageProvider();
    const first = await mod.getStorageProvider();
    const second = await mod.getStorageProvider();

    expect(env.seedCalls).toBe(1);
    // 工厂本身可以被调很多次，但 hooks 每问一次都要拿到同一个实例（重建连接没有意义）
    expect(second).toBe(first);
    expect(mod.getSeedOutcome()).toEqual({ status: "seeded", count: 1 });
  });

  it("三支分派各自留下可读的支名（云端回落必须能被程序说出来，而不是靠人下断点）", async () => {
    env.tauri = false;
    (globalThis as { window?: unknown }).window = { location: { search: "" } };
    let mod = await loadFresh();
    await mod.createStorageProvider();
    expect(mod.getStorageProviderBranch()).toBe("cloud");

    (globalThis as { window?: unknown }).window = { location: { search: "?storage=memory" } };
    mod = await loadFresh();
    await mod.createStorageProvider();
    expect(mod.getStorageProviderBranch()).toBe("memory");

    // 壳支的支名要在**第一个 await 之前**就登记好：真壳里播种/建素材仓任一步抛错时，
    // 读到的仍是 null 的话，"它试过壳支然后失败"这件事就没人知道了。
    env.tauri = true;
    (globalThis as { window?: unknown }).window = { location: { search: "" } };
    mod = await loadFresh();
    await mod.createStorageProvider();
    expect(mod.getStorageProviderBranch()).toBe("shell");
  });

  it("?storage=memory 只替代存储：不建素材仓、不播种，根目录被清空", async () => {
    env.tauri = true; // 即使注入过壳标记，测试宿主那支也必须先短路
    (globalThis as { window?: unknown }).window = {
      location: { search: "?storage=memory" },
    };
    const mod = await loadFresh();
    // 先把根目录塞成一个**非空**值再进工厂。`getLocalAssetRoot()` 的初值本来就是 null，
    // 所以直接断言它是 null 是**恒真的**：把 index.ts 里那行 `setLocalAssetRoot(null)` 删掉，
    // "被清空"与"从来没人设过"读起来一模一样。塞一个脏值才量得到"确实被清了"。
    const ctx = await import("./assetContext");
    ctx.setLocalAssetRoot("/脏值/该被清掉");

    const provider = await mod.createStorageProvider();

    // 类身份要从**这一份模块图**里取：`vi.resetModules()` 之后顶层静态导入的那个数
    // 与工厂自己 import 的已经是两个不同对象，直接 toBeInstanceOf 会假红。
    const { MemoryStorageProvider: FreshMemory } = await import("@axiforge/editor-core");
    expect(provider).toBeInstanceOf(FreshMemory);
    expect(env.assetStoreCreates).toBe(0);
    expect(env.seedCalls).toBe(0);
    expect(ctx.getLocalAssetRoot()).toBe(null);
  });

  it("浏览器态：走 HTTP 支，不建素材仓、不播种，根目录被清空", async () => {
    const mod = await loadFresh();
    // 与上一条同一个理由：初值就是 null，断言 null 量不到"被清空"这件事
    const ctx = await import("./assetContext");
    ctx.setLocalAssetRoot("/脏值/该被清掉");

    const provider = await mod.createStorageProvider();

    expect(env.httpBuilt).toBe(1);
    expect(env.assetStoreCreates).toBe(0);
    expect(env.seedCalls).toBe(0);
    expect(ctx.getLocalAssetRoot()).toBe(null);
    expect(provider.constructor.name).toBe("StubHttp");
  });
});
