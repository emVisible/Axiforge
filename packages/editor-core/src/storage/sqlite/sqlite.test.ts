import { describe, expect, it } from "vitest";
import { SqlJsBackend } from "./sqljs.backend";
import { SqliteStorageProvider } from "./sqliteProvider";
import { runStorageContractSuite } from "../contract";

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
});

runStorageContractSuite("SQLite(sql.js)", async () => {
  const backend = await SqlJsBackend.create();
  const provider = new SqliteStorageProvider(backend);
  await provider.init();
  return provider;
});

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
      p.saveCharacter({ id: "", name: "x", characterData: {}, imagePath: null }),
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
