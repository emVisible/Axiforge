import { describe, expect, it } from "vitest";
import type { StorageProvider } from "../types";
import { SqlJsBackend } from "./sqljs.backend";
import { SqliteStorageProvider } from "./sqliteProvider";
import type { SqlBackend } from "./backend";

/**
 * 本地运行时状态（存档 / 成就）的失败与缺值形状。
 *
 * 契约套件跑的是 happy path；这里钉的是**只有本地库会遇到的坏数据**：
 * 磁盘故障、JSON 列被写坏、槽位从未写过、成就挂在不存在的工程上。
 * 这些分支没有用例时的表现是「读回来半个对象」或「假成功」，而不是报错。
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

const NEW_ACH = {
  id: "", key: "first_light", title: "初见天光", description: "第一次打开灯",
  icon: "lamp", condition: { type: "flag", key: "lamp_on" },
};

/** 存档与成就都认工程存在（写之前先查 projects），所以夹具得先有一颗真工程 */
const makeLocal = async (): Promise<{ p: StorageProvider; backend: SqlJsBackend; projectId: string }> => {
  const backend = await SqlJsBackend.create();
  const p = new SqliteStorageProvider(backend);
  await p.init();
  const created = await p.createProject({ title: "运行时夹具" });
  if (!created.ok) throw new Error("夹具工程建档失败");
  return { p, backend, projectId: created.data.id };
};

describe("SQLite 运行时状态 — io 错误路径", () => {
  it("底层抛错时九个方法一律返回 io，异常不穿越内核边界", async () => {
    const p = new SqliteStorageProvider(new ThrowingBackend());
    const results = await Promise.all([
      p.listSaves("pr", "tk"),
      p.getSave("pr", "tk"),
      p.writeSave("pr", "tk", { state: { a: 1 } }),
      p.clearSave("pr", "tk"),
      p.listAchievements("pr"),
      p.saveAchievement("pr", { ...NEW_ACH }),
      p.deleteAchievement("pr", "x"),
      p.unlockAchievement("pr", "tk", "first_light"),
      p.listUnlocked("pr", "tk"),
    ]);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("io");
    }
  });

  it("没写过的槽位与不存在的成就 → not_found；成就挂在不存在的工程上也是 not_found", async () => {
    const { p } = await makeLocal();
    const never = await p.getSave("no-project", "tk", 3);
    if (!never.ok) expect(never.error).toMatchObject({ code: "not_found", entity: "save_slot" });
    else throw new Error("从未写过的槽位不该读出东西");

    const clear = await p.clearSave("no-project", "tk", 3);
    if (!clear.ok) expect(clear.error.code).toBe("not_found");
    else throw new Error("清空不存在的槽位不该成功");

    const del = await p.deleteAchievement("no-project", "no-ach");
    if (!del.ok) expect(del.error).toMatchObject({ code: "not_found", entity: "achievement" });
    else throw new Error("删除不存在的成就该可见地失败");

    const orphan = await p.saveAchievement("no-project", { ...NEW_ACH });
    if (!orphan.ok) expect(orphan.error).toMatchObject({ code: "not_found", entity: "project" });
    else throw new Error("工程不存在时不该把成就写进去");
  });
});

describe("SQLite 运行时状态 — 损坏 JSON 与缺省字段", () => {
  it("存档 state 列被写坏 → corrupted 并点名是哪一列（清单与单条读都要报）", async () => {
    const { p, backend, projectId } = await makeLocal();
    const written = await p.writeSave(projectId, "tk-1", { state: { beat: 3 } });
    expect(written.ok).toBe(true);
    await backend.execute(`UPDATE save_slots SET state = '{broken'`);

    const one = await p.getSave(projectId, "tk-1");
    if (!one.ok) expect(one.error).toMatchObject({ code: "corrupted", entity: "save_slot.state" });
    else throw new Error("损坏的存档不该被当成正常读回");
    const many = await p.listSaves(projectId, "tk-1");
    if (!many.ok) expect(many.error.code).toBe("corrupted");
    else throw new Error("清单读取要把损坏行报出来，而不是少给一条空存档");
  });

  it("成就 condition_json 被写坏 → corrupted（不静默当成无条件）", async () => {
    const { p, backend, projectId } = await makeLocal();
    const created = await p.saveAchievement(projectId, { ...NEW_ACH });
    expect(created.ok).toBe(true);
    await backend.execute(`UPDATE achievements SET condition_json = '{broken'`);
    const list = await p.listAchievements(projectId);
    if (!list.ok) expect(list.error).toMatchObject({ code: "corrupted", entity: "achievement.condition" });
    else throw new Error("条件被写坏的成就不能被读成「无条件」——那等于自动解锁");
  });

  it("只给 state 的存档：summary/beatId/thumbRef 读回 null，覆写同槽不追加新行", async () => {
    const { p, projectId } = await makeLocal();
    const r = await p.writeSave(projectId, "tk-3", { state: { only: true } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.summary).toBeNull();
    expect(r.data.beatId).toBeNull();
    expect(r.data.thumbRef).toBeNull();

    const over = await p.writeSave(projectId, "tk-3", { state: { only: false }, summary: "覆写" });
    expect(over.ok && over.data.summary).toBe("覆写");
    const list = await p.listSaves(projectId, "tk-3");
    expect(list.ok && list.data.map((s) => s.slot)).toEqual([0]);

    const again = await p.saveAchievement(projectId, { ...NEW_ACH });
    expect(again.ok).toBe(true);
    const all = await p.listAchievements(projectId);
    expect(all.ok && all.data.length).toBe(1);
    // 带 id 再存一次走 UPDATE：同一份定义不该因为重复保存而长第二行
    const existingId = all.ok ? all.data[0]!.id : "";
    const upd = await p.saveAchievement(projectId, { ...NEW_ACH, id: existingId, title: "改名" });
    expect(upd.ok && upd.data.title).toBe("改名");
    const after = await p.listAchievements(projectId);
    expect(after.ok && after.data.map((a) => a.title)).toEqual(["改名"]);
  });
});
