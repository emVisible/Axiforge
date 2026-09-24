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
  });
}
