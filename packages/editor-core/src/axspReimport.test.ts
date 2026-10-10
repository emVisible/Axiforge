import { describe, expect, it } from "vitest";
import { remapNodeIds } from "./axsp";
import type { StoredEdge, StoredNode } from "./storage/records";
import type { StorageProvider } from "./storage/types";
import { SqlJsBackend } from "./storage/sqlite/sqljs.backend";
import { SqliteStorageProvider } from "./storage/sqlite/sqliteProvider";

/**
 * `.axsp` 二次导入的身份冲突（在册缺陷 ⑫）。
 *
 * 前提已按 DDL 核实：`project_nodes.id`、`project_edges.id`、`project_roles.id` 都是
 * **全局** `TEXT PRIMARY KEY`，不是 `(project_id, id)` 复合键。
 * 而导入侧原先只重映射**角色 id**（`remapCharacterIds`）与节点的 `stageId`，
 * 节点与边是**原样插入**的 ⇒ 同一个包在这台机器上导第二次时第二条 INSERT 撞主键，
 * `saveNarrative` 的整批事务回滚，用户看到的是"导入失败"，不是"导入了两份"。
 *
 * **为什么判据必须落在真 SQLite 上**：`MemoryStorageProvider.saveNarrative` 只查
 * **同一次 payload 内**的重复 id，跨工程不查——用 Memory 复现这个缺陷会得到假的绿。
 * 样本 bundle 一律由 `loadProject` 取（导出侧走的就是同一条通路），不手抄字段。
 */

function node(id: string, title: string): StoredNode {
  return {
    id,
    stageId: null,
    editorData: { position: { x: 1, y: 2 } },
    narrativeData: { title, script: [{ op: "narration", text: title }] },
    sortOrder: 0,
  };
}

function edge(id: string, source: string, target: string): StoredEdge {
  return { id, source, target, label: null };
}

async function makeProvider(): Promise<SqliteStorageProvider> {
  const p = new SqliteStorageProvider(await SqlJsBackend.create());
  await p.init();
  return p;
}

/** 建一个两节点一边的工程，并把它当作"包里的内容"读回来 */
async function seedBundle(p: StorageProvider, title: string) {
  const created = await p.createProject({ title });
  if (!created.ok) throw new Error(`建工程失败：${JSON.stringify(created.error)}`);
  const saved = await p.saveNarrative(created.data.id, {
    axsSource: `# ${title}\n`,
    nodes: [node("n-a", "甲拍"), node("n-b", "乙拍")],
    edges: [edge("e-1", "n-a", "n-b")],
  });
  if (!saved.ok) throw new Error(`播种失败：${JSON.stringify(saved.error)}`);
  const loaded = await p.loadProject(created.data.id);
  if (!loaded.ok) throw new Error("播种后读不回");
  return loaded.data;
}

async function newProject(p: StorageProvider, title: string): Promise<string> {
  const created = await p.createProject({ title });
  if (!created.ok) throw new Error(`建工程失败：${JSON.stringify(created.error)}`);
  return created.data.id;
}

function payloadOf(bundle: Awaited<ReturnType<typeof seedBundle>>) {
  return { axsSource: bundle.axsSource, nodes: bundle.nodes, edges: bundle.edges };
}

describe(".axsp 二次导入的 id 冲突", () => {
  it("事实钉：包里的节点与边原样导进第二个工程 ⇒ 主键冲突、整批回滚，第一份不受影响", async () => {
    const p = await makeProvider();
    const bundle = await seedBundle(p, "样本源");
    const target = await newProject(p, "第二次(原样插入)");

    const attempt = await p.saveNarrative(target, payloadOf(bundle));
    expect(attempt.ok).toBe(false);

    const survivor = await p.loadProject(bundle.meta.id);
    expect(survivor.ok).toBe(true);
    if (survivor.ok) expect(survivor.data.nodes.length).toBe(2);
  });

  it("应有行为：remapNodeIds 之后同一份包能导第一次、也能导第二次，三份 id 互不相交", async () => {
    const p = await makeProvider();
    // 包由本机某个工程导出 ⇒ 包里的节点 id 已经存在于这台机器的库里，
    // 所以"导回本机"连第一次都会撞（leg 1 已钉），重映射后第一、第二次都必须能导。
    const bundle = await seedBundle(p, "样本源");

    const copyA = await newProject(p, "导入 A");
    const remappedA = remapNodeIds(bundle);
    const savedA = await p.saveNarrative(copyA, payloadOf(remappedA));
    expect(savedA.ok).toBe(true);

    const copyB = await newProject(p, "导入 B");
    const remappedB = remapNodeIds(bundle);
    const savedB = await p.saveNarrative(copyB, payloadOf(remappedB));
    expect(savedB.ok).toBe(true);

    const loaded = await p.loadProject(copyB);
    if (!loaded.ok) throw new Error("第二次导入读不回");
    expect(loaded.data.nodes.length).toBe(2);
    expect(loaded.data.edges.length).toBe(1);
    const ids = new Set(loaded.data.nodes.map((n) => String(n.id)));
    for (const e of loaded.data.edges) {
      expect(ids.has(String(e.source))).toBe(true);
      expect(ids.has(String(e.target))).toBe(true);
    }
    const titles = loaded.data.nodes.map((n) => (n.narrativeData as { title?: string }).title);
    // 不用 sort() 比中文：默认按码点排会给出「乙拍 < 甲拍」，那是排序规则的偶然性质，不是产品语义
    expect(titles).toHaveLength(2);
    expect(titles).toContain("甲拍");
    expect(titles).toContain("乙拍");
    expect(loaded.data.axsSource).toBe("# 样本源\n");

    const aLoaded = await p.loadProject(copyA);
    if (!aLoaded.ok) throw new Error("第一次导入读不回");
    const srcLoaded = await p.loadProject(bundle.meta.id);
    if (!srcLoaded.ok) throw new Error("源工程被改动");
    const aIds = new Set(aLoaded.data.nodes.map((n) => String(n.id)));
    const srcIds = new Set(srcLoaded.data.nodes.map((n) => String(n.id)));
    for (const id of ids) {
      expect(aIds.has(id)).toBe(false);
      expect(srcIds.has(id)).toBe(false);
    }
    // 源工程一字未动（重映射只在导入侧造新身份，不许回头改导出方）
    expect(srcLoaded.data.nodes.map((n) => String(n.id))).toEqual(["n-a", "n-b"]);
  });

  it("remapNodeIds 是纯函数：不改入参，节点／边 id 与边的两端同时换，内容一字不动", async () => {
    const p = await makeProvider();
    const bundle = await seedBundle(p, "纯函数样本");
    const snapshot = JSON.parse(JSON.stringify(bundle));

    const out = remapNodeIds(bundle);

    expect(JSON.parse(JSON.stringify(bundle))).toEqual(snapshot);
    expect(out.nodes.map((n) => n.id)).not.toEqual(snapshot.nodes.map((n: { id: string }) => n.id));
    expect(out.edges[0]!.id).not.toBe(snapshot.edges[0]!.id);
    expect(out.edges[0]!.source).toBe(out.nodes[0]!.id);
    expect(out.edges[0]!.target).toBe(out.nodes[1]!.id);
    // 只换身份：内容（标题、脚本、坐标、排序、舞台归属）与 axsSource 必须逐字相同
    expect(out.nodes.map((n) => ({ ...n, id: "" }))).toEqual(
      snapshot.nodes.map((n: Record<string, unknown>) => ({ ...n, id: "" })),
    );
    expect(out.axsSource).toBe(snapshot.axsSource);
  });
});
