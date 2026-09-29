import { describe, expect, it } from "vitest";
import { createMemoryAssetStore } from "../assets";
import type { StorageProvider } from "../types";
import { SqlJsBackend } from "./sqljs.backend";
import { SqliteStorageProvider } from "./sqliteProvider";
import type { SqlBackend } from "./backend";

/**
 * 本地资产池（道具 / 场景）的失败与缺值形状。
 *
 * 契约套件管的是「正常路径两端一致」，这里管的是**只有本地库才会遇到的坏数据**：
 * 磁盘故障、JSON 列被写坏、列值为 NULL、作者缺省。这些分支在没有用例时
 * 一律表现为「桌面某页永远空着」或「读取静默返回半个对象」，而不是报错。
 */

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

const NEW_ITEM = {
  id: "", name: "铜钥匙", description: "开地窖", category: "关键道具", rarity: "普通",
  mechanismTags: ["开锁"], effects: [], imagePath: null,
  isPublic: false, authorId: "a", updatedAt: "",
};

const NEW_SCENE = {
  id: "", name: "地窖", description: "只能从正门进", location: "方舟·地下",
  atmosphere: "潮、暗", era: null, worldSetting: null, rules: null,
  tags: ["密室"], nodeTemplates: [], imagePath: null,
  isPublic: false, authorId: "a", updatedAt: "",
};

const makeProvider = async (authorId: string | null = null): Promise<StorageProvider> => {
  const backend = await SqlJsBackend.create();
  const p = new SqliteStorageProvider(backend, createMemoryAssetStore(), authorId);
  await p.init();
  return p;
};

describe("SQLite 资产池 — io 错误路径", () => {
  it("底层抛错时八个方法一律返回 io，异常不穿越内核边界", async () => {
    const p = new SqliteStorageProvider(new ThrowingBackend());
    const results = await Promise.all([
      p.listItems(),
      p.getItem("g"),
      p.saveItem({ ...NEW_ITEM }),
      p.deleteItem("g"),
      p.listScenes(),
      p.getScene("g"),
      p.saveScene({ ...NEW_SCENE }),
      p.deleteScene("g"),
    ]);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("io");
    }
  });

  it("删不存在的道具 / 场景 → not_found，不是幂等的假成功", async () => {
    const p = await makeProvider();
    const gone = await p.deleteItem("ghost");
    if (!gone.ok) expect(gone.error).toMatchObject({ code: "not_found", entity: "item", id: "ghost" });
    else throw new Error("删除不存在的道具不该成功");
    const goneScene = await p.deleteScene("ghost");
    if (!goneScene.ok) expect(goneScene.error).toMatchObject({ code: "not_found", entity: "scene" });
    else throw new Error("删除不存在的场景不该成功");
  });
});

describe("SQLite 资产池 — 损坏 JSON 与缺值列", () => {
  it("JSON 列被写坏 → corrupted，并点名是哪一列（不静默当空数组）", async () => {
    const backend = await SqlJsBackend.create();
    const p = new SqliteStorageProvider(backend);
    await p.init();
    const item = await p.saveItem({ ...NEW_ITEM });
    if (!item.ok) throw new Error("道具建档失败");
    const scene = await p.saveScene({ ...NEW_SCENE });
    if (!scene.ok) throw new Error("场景建档失败");

    await backend.execute(`UPDATE asset_items SET mechanism_tags = '{broken' WHERE id = ?`, [item.data.id]);
    const one = await p.getItem(item.data.id);
    expect(one.ok).toBe(false);
    // 列名进 error.entity（parseJson 的裁决），detail 一律是「JSON 解析失败」
    if (!one.ok) expect(one.error).toMatchObject({ code: "corrupted", entity: "item.mechanism_tags", id: item.data.id });
    const many = await p.listItems();
    if (!many.ok) expect(many.error.code).toBe("corrupted");
    else throw new Error("清单读取该把损坏行报出来，而不是少给一条");

    await backend.execute(`UPDATE asset_items SET mechanism_tags = '[]' WHERE id = ?`, [item.data.id]);
    await backend.execute(`UPDATE asset_items SET effects = '{broken' WHERE id = ?`, [item.data.id]);
    const eff = await p.getItem(item.data.id);
    if (!eff.ok) expect(eff.error).toMatchObject({ code: "corrupted", entity: "item.effects" });
    else throw new Error("effects 列损坏同样要报");

    await backend.execute(`UPDATE asset_scenes SET tags = '{broken' WHERE id = ?`, [scene.data.id]);
    const st = await p.getScene(scene.data.id);
    if (!st.ok) expect(st.error).toMatchObject({ code: "corrupted", entity: "scene.tags" });
    else throw new Error("scene.tags 损坏要报 corrupted");

    await backend.execute(`UPDATE asset_scenes SET tags = '[]' WHERE id = ?`, [scene.data.id]);
    await backend.execute(`UPDATE asset_scenes SET node_templates = '{broken' WHERE id = ?`, [scene.data.id]);
    const sn = await p.listScenes();
    if (!sn.ok) expect(sn.error).toMatchObject({ code: "corrupted", entity: "scene.node_templates" });
    else throw new Error("node_templates 损坏要报 corrupted");
  });

  it("只给必填三列的行：默认值与可空列都如实读回", async () => {
    const backend = await SqlJsBackend.create();
    const p = new SqliteStorageProvider(backend);
    await p.init();
    // 老库升级后新增列由 DEFAULT 补齐，可空列就是 NULL——这里不靠 saveItem 造数据，
    // 而是直接写最小行，检验读路径把「没值」读成契约里那五种空值里的哪一种。
    await backend.execute(
      `INSERT INTO asset_items (id, name, updated_at)
       VALUES ('min-1','裸道具','2026-09-29T00:00:00Z')`,
    );
    await backend.execute(
      `INSERT INTO asset_scenes (id, name, updated_at)
       VALUES ('min-2','裸场景','2026-09-29T00:00:00Z')`,
    );

    const item = await p.getItem("min-1");
    if (!item.ok) throw new Error("道具读取失败");
    expect(item.data.description).toBe("");
    expect(item.data.category).toBe("日常");
    expect(item.data.rarity).toBe("普通");
    expect(item.data.mechanismTags).toEqual([]);
    expect(item.data.effects).toEqual([]);
    expect(item.data.imagePath).toBeNull();
    expect(item.data.authorId).toBeNull();
    expect(item.data.isPublic).toBe(false);

    const scene = await p.getScene("min-2");
    if (!scene.ok) throw new Error("场景读取失败");
    expect(scene.data.location).toBeNull();
    expect(scene.data.atmosphere).toBeNull();
    expect(scene.data.tags).toEqual([]);
    expect(scene.data.nodeTemplates).toEqual([]);
    expect(scene.data.isPublic).toBe(false);

    // 无作者 + 未公开 = 任何作用域的清单都读不到它，但按 id 单条读仍然给：
    // 列表是范围裁决，单条读是归属裁决，两者不能混为一谈。
    const scoped = await p.listItems({ authorId: "whoever", includePublic: true });
    expect(scoped.ok && scoped.data.map((i) => i.id)).toEqual([]);
    const all = await p.listItems();
    expect(all.ok && all.data.map((i) => i.id)).toEqual([]);
  });

  it("条目没写作者时落到建档者；两者都缺才留 null", async () => {
    const me = await makeProvider("creator-me");
    const anon = await makeProvider(null);

    const owned = await me.saveItem({ ...NEW_ITEM, id: "", authorId: null });
    expect(owned.ok).toBe(true);
    if (!owned.ok) return;
    const got = await me.getItem(owned.data.id);
    expect(got.ok && got.data.authorId).toBe("creator-me");

    const orphan = await anon.saveScene({ ...NEW_SCENE, id: "", authorId: null });
    expect(orphan.ok).toBe(true);
    if (!orphan.ok) return;
    const scene = await anon.getScene(orphan.data.id);
    expect(scene.ok && scene.data.authorId).toBeNull();
  });
});
