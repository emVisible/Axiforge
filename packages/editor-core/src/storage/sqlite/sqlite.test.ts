import { describe, expect, it } from "vitest";
import { createMemoryAssetStore } from "../assets";
import { SqlJsBackend } from "./sqljs.backend";
import { SqliteStorageProvider } from "./sqliteProvider";
import { runStorageContractSuite } from "../contract";
import { runStoragePoolContractSuite } from "../contractPools";
import { runStorageAuthoringContractSuite } from "../contractAuthoring";

describe("SqliteStorageProvider 初始化", () => {
  it("迁移幂等：重复 apply 不抛错", async () => {
    const backend = await SqlJsBackend.create();
    const p = new SqliteStorageProvider(backend);
    await p.init();
    await p.init();
    const created = await p.createProject({ title: "迁移后工程" });
    expect(created.ok).toBe(true);
  });

  it("saveNarrative 事务回滚后数据保持原状（I4）", async () => {
    const backend = await SqlJsBackend.create();
    const p = new SqliteStorageProvider(backend);
    await p.init();
    const created = await p.createProject({ title: "事务" });
    if (!created.ok) throw new Error("create failed");
    const before = await p.loadProject(created.data.id);
    if (!before.ok) throw new Error("load failed");
    const nodeCount = before.data.nodes.length;

    // 构造必败事务：同批两个相同 id 的节点 → 第二条 INSERT 触发 PK 冲突 → 整体回滚
    const dupNode = {
      id: "dup-1", stageId: null, editorData: {}, narrativeData: { title: "重复" }, sortOrder: 0,
    };
    const bad = await p.saveNarrative(created.data.id, {
      axsSource: null,
      nodes: [dupNode, { ...dupNode, sortOrder: 1 }],
      edges: [],
    });
    expect(bad.ok).toBe(false);

    const after = await p.loadProject(created.data.id);
    if (!after.ok) throw new Error("reload failed");
    expect(after.data.nodes.length).toBe(nodeCount);
  });

  /**
   * 已发布过 v0.7 的机器上，本地库既没有四张新表、projects 也没有元数据列。
   * CREATE TABLE IF NOT EXISTS 不会给既有表补列，所以「旧库升级」必须被单独测一次，
   * 而不是只在空库上验证。
   */
  it("旧库升级：v0.7 形状的库经两次 init 补齐表与列，既有数据不丢", async () => {
    const backend = await SqlJsBackend.create();
    await backend.execute(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, is_public INTEGER NOT NULL DEFAULT 0,
        axs_source TEXT, author_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE characters (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, character_data TEXT NOT NULL DEFAULT '{}',
        image_path TEXT, author_id TEXT
      );
      INSERT INTO projects (id, title, is_public, created_at, updated_at)
      VALUES ('legacy-1', '旧工程', 0, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z');
    `);

    const p = new SqliteStorageProvider(backend);
    await p.init();
    await p.init(); // 第二次必须无副作用

    const list = await p.listProjects();
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.data.length).toBe(1);
    expect(list.data[0]?.title).toBe("旧工程");
    expect(list.data[0]?.description).toBe(""); // 补列后旧行为空串，而非 undefined
    expect(list.data[0]?.themeTags).toEqual([]);

    const tables = await backend.select<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table'`,
    );
    for (const t of [
      "asset_items", "asset_scenes", "save_slots", "achievements", "player_achievements",
      "project_asset_refs",
    ]) {
      expect(tables.some((r) => r.name === t)).toBe(true);
    }

    // 旧库上直接写入四个新域：不报错才算真补齐
    const item = await p.saveItem({
      id: "", name: "旧库道具", description: "", category: "日常", rarity: "普通",
      mechanismTags: [], effects: [], imagePath: null,
      isPublic: true, authorId: "a", updatedAt: "",
    });
    expect(item.ok).toBe(true);
    const save = await p.writeSave("legacy-1", "tok-legacy", { state: { ok: true } });
    expect(save.ok).toBe(true);

    // 道具引用是这一版新增的域，且它的读路径和建表必须同批——
    // 只建表不读会让旧库升级后「加得进、看不见」，跟没迁移一样。
    const ref = await p.addAssetRef("legacy-1", { assetType: "item", assetId: "legacy-item" });
    expect(ref.ok).toBe(true);
    if (ref.ok) {
      const bundle = await p.loadProject("legacy-1");
      expect(bundle.ok).toBe(true);
      if (bundle.ok) expect(bundle.data.assetRefs.map((r) => r.id)).toEqual([ref.data.id]);
    }
  });
});

const makeSqlite = async () => {
  const backend = await SqlJsBackend.create();
  const provider = new SqliteStorageProvider(backend, createMemoryAssetStore());
  await provider.init();
  return provider;
};

runStorageContractSuite("SQLite(sql.js)", makeSqlite);
runStoragePoolContractSuite("SQLite(sql.js)", makeSqlite);
runStorageAuthoringContractSuite("SQLite(sql.js)", makeSqlite);

import type { SqlBackend } from "./backend";

class ThrowingBackend implements SqlBackend {
  async select(): Promise<never> {
    throw new Error("模拟磁盘故障");
  }
  async execute(): Promise<{ rowsAffected: number }> {
    throw new Error("模拟磁盘故障");
  }
  async transactional(): Promise<{ rowsAffected: number }> {
    throw new Error("模拟磁盘故障");
  }
}

describe("SqliteStorageProvider io 错误路径", () => {
  it("底层抛错时全部方法返回 io（不穿越异常）", async () => {
    const p = new SqliteStorageProvider(new ThrowingBackend());
    const results = await Promise.all([
      p.listProjects(),
      p.createProject({ title: "x" }),
      p.loadProject("g"),
      p.deleteProject("g"),
      p.updateProjectMeta("g", { title: "x" }),
      p.saveNarrative("g", { axsSource: null, nodes: [], edges: [] }),
      p.addRole("g", { characterRefId: "c" }),
      p.removeRole("g", "r"),
      p.listCharacters(),
      p.getCharacter("g"),
      p.saveCharacter({ id: "", name: "x", characterData: {}, imagePath: null, isPublic: false, authorId: null }),
    ]);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("io");
    }
  });

  it("库内损坏 JSON → corrupted（不静默兜底）", async () => {
    const good = await SqlJsBackend.create();
    const p = new SqliteStorageProvider(good);
    await p.init();
    const created = await p.createProject({ title: "损坏工程" });
    if (!created.ok) throw new Error("create");
    // 直插坏 JSON
    await good.execute(
      `INSERT INTO project_nodes (id, project_id, editor_data, narrative_data, sort_order)
       VALUES ('bad', ?, '{broken', '{broken', 0)`,
      [created.data.id],
    );
    const load = await p.loadProject(created.data.id);
    expect(load.ok).toBe(false);
    if (!load.ok) expect(load.error.code).toBe("corrupted");
  });
});
