import { describe, expect, it } from "vitest";
import type { ProjectBundle, StorageProvider } from "./types";
import type { StoredNode } from "./types";

/**
 * 存储契约套件——一切 StorageProvider 实现（Memory/HTTP/SQLite）的验收标准。
 * 用法：runStorageContractSuite("Memory", () => new MemoryStorageProvider());
 */

export function runStorageContractSuite(
  name: string,
  makeProvider: () => StorageProvider | Promise<StorageProvider>,
): void {
  describe(`存储契约 · ${name}`, () => {
    it("create → list → load：引导默认舞台与节点", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "契约工程" });
      expect(created.ok).toBe(true);

      const list = await p.listProjects();
      expect(list.ok && list.data.map((m) => m.title)).toContain("契约工程");

      const load = await p.loadProject(created.ok ? created.data.id : "");
      expect(load.ok).toBe(true);
      if (!load.ok) return;
      const bundle: ProjectBundle = load.data;
      expect(bundle.meta.title).toBe("契约工程");
      expect(bundle.scenes.length).toBeGreaterThanOrEqual(1);
      expect(bundle.nodes.length).toBeGreaterThanOrEqual(2);
      expect(bundle.edges.length).toBeGreaterThanOrEqual(1);
    });

    it("load 不存在 → not_found（空值五义：不存在≠空集合）", async () => {
      const p = await makeProvider();
      const r = await p.loadProject("ghost");
      expect(r).toEqual({
        ok: false,
        error: { code: "not_found", entity: "project", id: "ghost" },
      });
    });

    it("saveNarrative 原子覆写 + updateProjectMeta 写 axs_source", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "叙事" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;

      const nodes: StoredNode[] = [
        {
          id: "n1",
          stageId: null,
          editorData: { position: { x: 1, y: 2 } },
          narrativeData: {
            title: "唯一拍",
            script: [{ op: "say", speaker: "甲", text: "词" }],
          },
          sortOrder: 0,
        },
      ];
      const saved = await p.saveNarrative(id, {
        axsSource: "# 唯一拍\n甲: 词。\n",
        nodes,
        edges: [],
      });
      expect(saved.ok).toBe(true);

      const load = await p.loadProject(id);
      if (!load.ok) throw new Error("load failed");
      expect(load.data.nodes).toHaveLength(1);
      expect(load.data.nodes[0]!.narrativeData).toMatchObject({ title: "唯一拍" });
      expect(load.data.axsSource).toBe("# 唯一拍\n甲: 词。\n");

      const meta = await p.updateProjectMeta(id, { title: "改名" });
      expect(meta.ok).toBe(true);
      const relist = await p.listProjects();
      expect(relist.ok && relist.data.find((m) => m.id === id)?.title).toBe("改名");
    });

    it("saveNarrative 不存在 → not_found", async () => {
      const p = await makeProvider();
      const r = await p.saveNarrative("ghost", { axsSource: null, nodes: [], edges: [] });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("not_found");
    });

    it("角色：add → load 可见 → 重复拒绝 → remove 消失", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "角色工程" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;

      expect((await p.addRole(id, { characterRefId: "char-1" })).ok).toBe(true);
      const dup = await p.addRole(id, { characterRefId: "char-1" });
      expect(dup.ok).toBe(false);

      const load = await p.loadProject(id);
      if (!load.ok) throw new Error("load failed");
      expect(load.data.roles.map((r: StoredRoleLike) => r.characterRefId)).toContain("char-1");

      const roleId = load.data.roles[0]!.id;
      expect((await p.removeRole(id, roleId)).ok).toBe(true);
      const reload = await p.loadProject(id);
      if (!reload.ok) throw new Error("reload failed");
      expect(reload.data.roles).toHaveLength(0);
    });

    it("角色：工程不存在 → not_found", async () => {
      const p = await makeProvider();
      const r = await p.addRole("ghost", { characterRefId: "c" });
      expect(r.ok).toBe(false);
    });

    it("角色库：创建 → upsert 覆盖 → 范围可见性（我的 / 仅公开 / 他人不可见）", async () => {
      const p = await makeProvider();
      const created = await p.saveCharacter({
        id: "",
        name: "凛",
        characterData: { anchor: { name: "凛" } },
        imagePath: null,
        isPublic: false,
        authorId: "u-contract",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.data.id).toBeTruthy();

      const updated = await p.saveCharacter({
        id: created.data.id,
        name: "凛二",
        characterData: {},
        imagePath: "/x.png",
        isPublic: false,
        authorId: "u-contract",
      });
      expect(updated.ok && updated.data.id).toBe(created.data.id);

      const mine = await p.listCharacters({ authorId: "u-contract" });
      expect(mine.ok && mine.data).toHaveLength(1);
      expect(mine.ok && mine.data[0]!.name).toBe("凛二");

      const others = await p.listCharacters({ authorId: "u-other" });
      expect(others.ok && others.data).toHaveLength(0);

      const publicOnly = await p.listCharacters();
      expect(publicOnly.ok && publicOnly.data).toHaveLength(0);

      await p.saveCharacter({
        id: created.data.id,
        name: "凛二",
        characterData: {},
        imagePath: "/x.png",
        isPublic: true,
        authorId: "u-contract",
      });
      const shared = await p.listCharacters();
      expect(shared.ok && shared.data).toHaveLength(1);

      const got = await p.getCharacter(created.data.id);
      expect(got.ok && got.data.imagePath).toBe("/x.png");
      expect(got.ok && got.data.isPublic).toBe(true);
      const miss = await p.getCharacter("ghost");
      expect(miss.ok).toBe(false);
    });

    it("素材：saveAsset → readAsset 字节等价；同内容去重同 ref；异内容异 ref", async () => {
      const p = await makeProvider();
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const saved = await p.saveAsset({ name: "a.png", mime: "image/png", bytes });
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;
      expect(saved.data.ref).toBeTruthy();
      expect(saved.data.size).toBe(4);

      const read = await p.readAsset(saved.data.ref);
      expect(read.ok).toBe(true);
      if (read.ok) expect(Array.from(read.data)).toEqual([1, 2, 3, 4]);

      const again = await p.saveAsset({ name: "改名.png", mime: "image/png", bytes });
      expect(again.ok && again.data.ref).toBe(saved.data.ref);

      const other = await p.saveAsset({
        name: "b.png",
        mime: "image/png",
        bytes: new Uint8Array([9, 9]),
      });
      expect(other.ok && other.data.ref).not.toBe(saved.data.ref);
    });

    it("素材：空字节 → io；缺失/越界 ref → not_found（失败语义先填空）", async () => {
      const p = await makeProvider();
      const empty = await p.saveAsset({
        name: "e.png",
        mime: "image/png",
        bytes: new Uint8Array([]),
      });
      expect(empty.ok).toBe(false);
      if (!empty.ok) expect(empty.error.code).toBe("io");

      const miss = await p.readAsset("assets/nope.png");
      expect(miss.ok).toBe(false);
      if (!miss.ok) expect(miss.error.code).toBe("not_found");

      const traversal = await p.readAsset("assets/../../etc/passwd");
      expect(traversal.ok).toBe(false);
      if (!traversal.ok) expect(traversal.error.code).toBe("not_found");
    });

    it("deleteProject：删除后 list/load 均消失，重复删除 not_found", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "将删" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;
      expect((await p.deleteProject(id)).ok).toBe(true);
      expect((await p.deleteProject(id)).ok).toBe(false);
      const list = await p.listProjects();
      expect(list.ok && list.data.find((m) => m.id === id)).toBeUndefined();
    });

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

    it("工程元数据：patch 写→重读逐字段一致（桌面卡片不再「暂无描述」的根因修复）", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "元数据" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;
      expect(created.data.description).toBe("");
      expect(created.data.themeTags).toEqual([]);

      const patched = await p.updateProjectMeta(id, {
        description: "一座会下沉的城",
        themeTags: ["末日", "密室"],
        mechanism: "密室逃脱",
        genre: "悬疑",
        coverImage: "assets/cover.png",
        isMeta: true,
      });
      expect(patched.ok).toBe(true);

      const list = await p.listProjects();
      const hit = list.ok ? list.data.find((m) => m.id === id) : undefined;
      expect(hit?.description).toBe("一座会下沉的城");
      expect(hit?.themeTags).toEqual(["末日", "密室"]);
      expect(hit?.mechanism).toBe("密室逃脱");
      expect(hit?.genre).toBe("悬疑");
      expect(hit?.coverImage).toBe("assets/cover.png");
      expect(hit?.isMeta).toBe(true);

      const loaded = await p.loadProject(id);
      expect(loaded.ok && loaded.data.meta.description).toBe("一座会下沉的城");
    });
  });
}

type StoredRoleLike = { characterRefId: string };
