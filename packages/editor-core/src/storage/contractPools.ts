/**
 * 资产池与运行时域的契约用例（道具 / 场景 / 存档 / 成就）。
 *
 * 与 contract.ts 同一模式：**一份测试源、多实现验收**。
 * 拆成两个 runner 只为让每个文件保持在行数预算内——
 * 契约测试的价值在于覆盖面，不在于挤在一个文件里。
 */

import { describe, expect, it } from "vitest";
import type { StorageProvider } from "./types";

export function runStoragePoolContractSuite(
  name: string,
  makeProvider: () => StorageProvider | Promise<StorageProvider>,
): void {
  describe(`存储契约 · ${name} · 资产池与运行时`, () => {
    // ---------- 以下为 v0.8 新增四域：改 → 存 → 重读 三段式，不接受「已保存」提示即算通过 ----------

    it("道具：存→我的列表读回→改→再读→删→不可见", async () => {
      const p = await makeProvider();
      const saved = await p.saveItem({
        id: "",
        name: "铜钥匙",
        description: "能打开地窖",
        category: "关键道具",
        rarity: "稀有",
        mechanismTags: ["开锁"],
        effects: ["开启地窖"],
        imagePath: null,
        isPublic: false,
        authorId: "contract-author",
        updatedAt: "",
      });
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;
      const id = saved.data.id;

      const mine = await p.listItems({ authorId: "contract-author", includePublic: false });
      expect(mine.ok).toBe(true);
      const hit = mine.ok ? mine.data.find((i) => i.id === id) : undefined;
      expect(hit?.name).toBe("铜钥匙");
      expect(hit?.mechanismTags).toEqual(["开锁"]);

      expect((await p.saveItem({ ...hit!, rarity: "传说" })).ok).toBe(true);
      const reread = await p.listItems({ authorId: "contract-author" });
      expect(reread.ok && reread.data.find((i) => i.id === id)?.rarity).toBe("传说");

      expect((await p.deleteItem(id)).ok).toBe(true);
      expect((await p.deleteItem(id)).ok).toBe(false);
    });

    it("单条读口：读回等价、不存在 → not_found（不是空集合）", async () => {
      const p = await makeProvider();
      const saved = await p.saveItem({
        id: "", name: "单读道具", description: "d", category: "日常", rarity: "稀有",
        mechanismTags: ["m"], effects: ["e"], imagePath: "assets/x.png",
        isPublic: true, authorId: "solo", updatedAt: "",
      });
      if (!saved.ok) throw new Error("fixture failed");

      const one = await p.getItem(saved.data.id);
      expect(one.ok).toBe(true);
      if (one.ok) {
        expect(one.data.name).toBe("单读道具");
        expect(one.data.mechanismTags).toEqual(["m"]);
        expect(one.data.imagePath).toBe("assets/x.png");
      }

      const miss = await p.getItem("no-such-item");
      expect(miss.ok).toBe(false);
      if (!miss.ok) expect(miss.error).toMatchObject({ code: "not_found", entity: "item" });

      const scene = await p.saveScene({
        id: "", name: "单读场景", description: "", location: null, atmosphere: null,
        era: null, worldSetting: "方舟", rules: null, tags: ["t"], nodeTemplates: [],
        imagePath: null, isPublic: false, authorId: "solo", updatedAt: "",
      });
      if (!scene.ok) throw new Error("fixture failed");
      const sceneOne = await p.getScene(scene.data.id);
      expect(sceneOne.ok && sceneOne.data.worldSetting).toBe("方舟");
      expect((await p.getScene("no-such-scene")).ok).toBe(false);
    });

    /**
     * 列表顺序 = **最近动过的在前**（`updatedAt` 降序）。2026-10-01 复审补的。
     *
     * SQLite 两侧的 `listItems` / `listScenes` 都是 `ORDER BY updated_at DESC`，
     * 而 Memory 原样给插入序 ⇒ 「存 A、存 B、再改 B」读回来两端不同：
     * 实测 Memory `["A","B改"]` / SQLite `["B改","A"]`。
     * 权威是 SQLite（桌面生产路径），而**意图在本仓库里已经定了**：
     * `memory.ts::listProjects` 早就特意写了同样的排序去对齐 SQLite 的 `ORDER BY`，
     * `types.ts` 里也有"两端同一操作产生不同行数，桌面用户会比网页用户少看到重复项却没人解释为什么"那条裁决。
     * 所以这条不是新产品决定，是**同一意图漏了两处**。
     *
     * 危害形态与 `sortOrder` 那条一样、但更隐蔽：Memory 不是生产路径，
     * 于是"测试宿主与桌面顺序不同而两边都绿"可以长期隐身——凡是断言列表顺序的用例都在断言一个桌面不会给的顺序。
     *
     * 已知限度（与 `listProjects` 同形，不额外加 tiebreaker）：`updatedAt` 撞在一起时
     * `Array#sort` 稳定 ⇒ Memory 保持插入序，而 SQLite 对并列行序未定义。
     */
    it("列表顺序：最近动过的在前（改过的那条排到前面）", async () => {
      const p = await makeProvider();
      const mk = (name: string) => ({
        id: "", name, description: "d", category: "日常", rarity: "稀有",
        mechanismTags: [] as string[], effects: [] as string[],
        imagePath: null, isPublic: true, authorId: "order-author",
      });
      const scene = (name: string) => ({
        id: "", name, description: "d", location: null, atmosphere: null,
        era: null, worldSetting: null, rules: "", tags: [] as string[],
        nodeTemplates: [] as unknown[], imagePath: null, isPublic: true,
        authorId: "order-author",
      });
      // **两次存之间必须真的过掉时间**，这不是装饰：两个后端的 `saveItem` 都在存的时候
      // 自己盖 `updatedAt = nowIso()`（`sqlite/assetPool.ts` 与 `memoryPools.ts`），
      // **调用方给的值根本进不去**。而 `nowIso()` 是毫秒级——连续两次存几乎必然同毫秒、
      // `updatedAt` 相同，于是这条判据量的其实是"并列"：Memory 靠 `Array#sort` 稳定退回插入序，
      // SQLite 对并列行序未定义（实测都是插入序）。那样子这条用例是绿的，却什么都没证明。
      const tick = () => new Promise((r) => setTimeout(r, 3));

      const a = await p.saveItem(mk("A") as never);
      expect(a.ok).toBe(true);
      if (!a.ok) return;
      await tick();
      const b = await p.saveItem(mk("B") as never);
      expect(b.ok).toBe(true);
      if (!b.ok) return;

      // 后存的 B 更新 ⇒ 排前面
      let list = await p.listItems({ authorId: "order-author" });
      expect(list.ok && list.data.map((x) => x.name)).toEqual(["B", "A"]);

      // 改 A ⇒ A 变成最近动过的 ⇒ 必须排到前面（这一跳正是原先两端分叉的那一跳）
      await tick();
      const got = await p.getItem(a.data.id);
      if (!got.ok) return;
      expect((await p.saveItem({ ...got.data, name: "A改" })).ok).toBe(true);
      list = await p.listItems({ authorId: "order-author" });
      expect(list.ok && list.data.map((x) => x.name)).toEqual(["A改", "B"]);

      // 场景同一规则（两端都是 ORDER BY updated_at DESC）
      const s1 = await p.saveScene(scene("S1") as never);
      expect(s1.ok).toBe(true);
      if (!s1.ok) return;
      await tick();
      const s2 = await p.saveScene(scene("S2") as never);
      expect(s2.ok).toBe(true);
      if (!s2.ok) return;
      const scenes = await p.listScenes({ authorId: "order-author" });
      expect(scenes.ok && scenes.data.map((x) => x.name)).toEqual(["S2", "S1"]);
    });

    it("道具范围：公开池可见、他人私有不可见（不伪装成空）", async () => {
      const p = await makeProvider();
      await p.saveItem({
        id: "", name: "公共地图", description: "", category: "日常", rarity: "普通",
        mechanismTags: [], effects: [], imagePath: null,
        isPublic: true, authorId: "someone-else", updatedAt: "",
      });
      await p.saveItem({
        id: "", name: "私藏", description: "", category: "日常", rarity: "普通",
        mechanismTags: [], effects: [], imagePath: null,
        isPublic: false, authorId: "someone-else", updatedAt: "",
      });
      const asPublic = await p.listItems();
      expect(asPublic.ok && asPublic.data.map((i) => i.name)).toContain("公共地图");
      expect(asPublic.ok && asPublic.data.map((i) => i.name)).not.toContain("私藏");

      const asMine = await p.listItems({ authorId: "me", includePublic: false });
      expect(asMine.ok && asMine.data.length).toBe(0);
    });

    it("场景：存→读回逐字段等价→删", async () => {
      const p = await makeProvider();
      const saved = await p.saveScene({
        id: "", name: "地窖", description: "潮湿的石室", location: "庄园北侧",
        atmosphere: "阴冷", era: "战后十年", worldSetting: "方舟", rules: "不得点灯",
        tags: ["密室"], nodeTemplates: [{ title: "发现暗格" }], imagePath: null,
        isPublic: true, authorId: "contract-author", updatedAt: "",
      });
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;
      const list = await p.listScenes({ authorId: "contract-author" });
      const hit = list.ok ? list.data.find((s) => s.id === saved.data.id) : undefined;
      expect(hit?.worldSetting).toBe("方舟");
      expect(hit?.rules).toBe("不得点灯");
      expect(hit?.nodeTemplates).toEqual([{ title: "发现暗格" }]);
      expect((await p.deleteScene(saved.data.id)).ok).toBe(true);
    });

    it("存档：写→列→读→覆写→清→读为 not_found（从未写过≠内容为空）", async () => {
      const p = await makeProvider();
      const proj = await p.createProject({ title: "存档宿主" });
      if (!proj.ok) throw new Error("create failed");
      const pid = proj.data.id;
      const token = "player-contract-0001";

      const first = await p.writeSave(pid, token, { slot: 2, state: { beat: "b1" }, summary: "第一层" });
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      expect(first.data.slot).toBe(2);

      const list = await p.listSaves(pid, token);
      expect(list.ok && list.data.map((s) => s.slot)).toEqual([2]);

      const read = await p.getSave(pid, token, 2);
      expect(read.ok && read.data.summary).toBe("第一层");

      await p.writeSave(pid, token, { slot: 2, state: { beat: "b2" }, summary: "第二层" });
      const reread = await p.getSave(pid, token, 2);
      expect(reread.ok && reread.data.summary).toBe("第二层");
      const afterOverwrite = await p.listSaves(pid, token);
      expect(afterOverwrite.ok && afterOverwrite.data.length).toBe(1); // 覆写不是追加

      expect((await p.clearSave(pid, token, 2)).ok).toBe(true);
      const gone = await p.getSave(pid, token, 2);
      expect(gone.ok).toBe(false);
      if (!gone.ok) expect(gone.error.code).toBe("not_found");
    });

    it("存档：不存在的工程 → not_found；他人 token 隔离", async () => {
      const p = await makeProvider();
      const proj = await p.createProject({ title: "隔离" });
      if (!proj.ok) throw new Error("create failed");
      await p.writeSave(proj.data.id, "token-a", { state: { x: 1 } });
      const other = await p.listSaves(proj.data.id, "token-b");
      expect(other.ok && other.data.length).toBe(0);
      const ghost = await p.writeSave("ghost-project", "token-a", { state: {} });
      expect(ghost.ok).toBe(false);
      if (!ghost.ok) expect(ghost.error.code).toBe("not_found");
    });

    it("成就：定义→解锁幂等（只一条记录）→按 key 读回→删定义", async () => {
      const p = await makeProvider();
      const proj = await p.createProject({ title: "成就宿主" });
      if (!proj.ok) throw new Error("create failed");
      const pid = proj.data.id;
      const token = "player-contract-0002";

      const def = await p.saveAchievement(pid, {
        id: "", key: "first_dark", title: "第一次黑暗", description: "",
        icon: "moon", condition: { beat: "b1" },
      });
      expect(def.ok).toBe(true);
      if (!def.ok) return;

      const defs = await p.listAchievements(pid);
      expect(defs.ok && defs.data.map((a) => a.key)).toContain("first_dark");

      expect((await p.unlockAchievement(pid, token, "first_dark")).ok).toBe(true);
      expect((await p.unlockAchievement(pid, token, "first_dark")).ok).toBe(true);
      const unlocked = await p.listUnlocked(pid, token);
      expect(unlocked.ok && unlocked.data.filter((u) => u.key === "first_dark").length).toBe(1);

      const unknown = await p.unlockAchievement(pid, token, "no_such_key");
      expect(unknown.ok).toBe(false);
      if (!unknown.ok) expect(unknown.error.code).toBe("not_found");

      expect((await p.deleteAchievement(pid, def.data.id)).ok).toBe(true);
    });

    /**
     * 2026-10-01 复审新增：同一工程内 `key` 必须唯一，撞了要显式失败。
     *
     * 原状是两端各行其是：SQLite 的 schema 有 `UNIQUE (project_id, akey)` ⇒ 第二次 `io`；
     * Memory 只按 id upsert ⇒ 两次都 `ok`、读回**两条同 key**。
     * 后果不是"多一行"那么轻：成就面板按列表渲染（用户看见重复项），
     * 而 `unlockAchievement` 按 **key** 解 ⇒ 另一条永远点不亮，是一条谁都够不着的死行。
     * 权威是 SQLite（`backend.ts` 的 schema 是桌面生产路径真正在用的那张表）。
     *
     * 同时钉住另一半：**同 id 仍然是更新**、不算冲突——
     * `saveAchievement` 的语义是按 id upsert，而 `updateAchievement` 会先取回当前定义再合并补丁，
     * 那一支的 key 不变，若把它当冲突就会把正常的"改标题"也堵死。
     * 分母：面板用 `ach_${Date.now().toString(36)}` 生成 key ⇒ 活路径不产生重复（同一毫秒连点才可能），
     * 所以这条是**潜在**的，值在把口径钉进契约、让下一个后端不必再猜。
     */
    it("成就：同工程内 key 唯一（撞 key 显式失败），同 id 仍是更新", async () => {
      const p = await makeProvider();
      const proj = await p.createProject({ title: "成就 key 唯一" });
      if (!proj.ok) throw new Error("create failed");
      const pid = proj.data.id;

      const first = await p.saveAchievement(pid, {
        id: "", key: "dup_key", title: "第一次", description: "",
        icon: "star", condition: { beat: "b1" },
      });
      expect(first.ok).toBe(true);
      if (!first.ok) return;

      // 换 id（这里是空 id ⇒ 新分配）但 key 相同 ⇒ 必须失败，且不留第二条
      const second = await p.saveAchievement(pid, {
        id: "", key: "dup_key", title: "第二次", description: "",
        icon: "star", condition: { beat: "b1" },
      });
      expect(second.ok).toBe(false);
      if (!second.ok) expect(second.error.code).toBe("io");

      const after = await p.listAchievements(pid);
      expect(after.ok && after.data.filter((a) => a.key === "dup_key").length).toBe(1);

      // 同 id 仍是更新：改标题必须成功，且不新增行
      const updated = await p.saveAchievement(pid, {
        ...first.data, title: "改过的标题",
      });
      expect(updated.ok).toBe(true);
      const afterUpdate = await p.listAchievements(pid);
      expect(afterUpdate.ok && afterUpdate.data.filter((a) => a.key === "dup_key").length).toBe(1);
      expect(afterUpdate.ok && afterUpdate.data[0]!.title).toBe("改过的标题");
    });
  });
}
