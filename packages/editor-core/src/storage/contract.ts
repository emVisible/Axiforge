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
        worldSetting: "近未来移动都市「交汇港」",
        rules: "不得在白天点亮灯火",
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
      expect(hit?.worldSetting).toBe("近未来移动都市「交汇港」");
      expect(hit?.rules).toBe("不得在白天点亮灯火");

      const loaded = await p.loadProject(id);
      expect(loaded.ok && loaded.data.meta.description).toBe("一座会下沉的城");

      // 局部 patch 不得连带改写其余字段：这是「已保存」提示之下的静默改写面
      const renamed = await p.updateProjectMeta(id, { title: "改名" });
      expect(renamed.ok).toBe(true);
      const after = await p.listProjects();
      const kept = after.ok ? after.data.find((m) => m.id === id) : undefined;
      expect(kept?.title).toBe("改名");
      expect(kept?.worldSetting).toBe("近未来移动都市「交汇港」");
      expect(kept?.themeTags).toEqual(["末日", "密室"]);
    });
  });

  describe("角色传记（Phase 13 S13-1：桌面无后端也要读写传记）", () => {
    it("建 → 列表 → 单条读 → 改 → 删；wordCount 由实现方重算；跨角色读不到", async () => {
      const p = await makeProvider();
      const owner = await p.saveCharacter({
        id: "",
        name: "凛",
        characterData: { anchor: { name: "凛" } },
        imagePath: null,
        isPublic: false,
        authorId: "u-contract",
      });
      if (!owner.ok) throw new Error("角色创建失败");
      const stranger = await p.saveCharacter({
        id: "",
        name: "邻",
        characterData: { anchor: { name: "邻" } },
        imagePath: null,
        isPublic: false,
        authorId: "u-other",
      });
      if (!stranger.ok) throw new Error("第二角色创建失败");
      const cid = owner.data.id;

      const created = await p.saveStory({
        id: "",
        characterId: cid,
        title: "序章",
        content: "她来了。\n又走了。",
        wordCount: 999,
        sortOrder: 1,
        updatedAt: "",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      const sid = created.data.id;

      const list = await p.listStories(cid);
      expect(list.ok && list.data.map((s) => s.title)).toEqual(["序章"]);
      // 入参写 999 也必须被实现方算的真实值覆盖：两端各信一份就是两个字数互相说谎
      expect(list.ok && list.data[0]?.wordCount).toBe(2);

      if (!list.ok) throw new Error("列表读取失败");
      const patched = await p.saveStory({
        ...list.data[0]!,
        title: "序章·改",
        sortOrder: 0,
      });
      expect(patched.ok && patched.data.id).toBe(sid);

      const got = await p.getStory(cid, sid);
      expect(got.ok && got.data.title).toBe("序章·改");
      expect(got.ok && got.data.sortOrder).toBe(0);

      // 归属即隔离：换角色读同一条按 not_found，不做「知道 id 就能读」
      const foreign = await p.getStory(stranger.data.id, sid);
      if (!foreign.ok) expect(foreign.error.code).toBe("not_found");
      else throw new Error("跨角色不应读到他人传记");

      const removed = await p.deleteStory(cid, sid);
      expect(removed.ok).toBe(true);
      const again = await p.deleteStory(cid, sid);
      if (!again.ok) expect(again.error.code).toBe("not_found");
      else throw new Error("删除不存在传记必须报错，不能演成成功");

      const empty = await p.listStories(cid);
      expect(empty.ok && empty.data).toEqual([]);
    });
  });

  describe("工程舞台增删（Phase 13 S13-2a：剪辑台在桌面要能建幕、删幕）", () => {
    it("新增给权威 id 并进 bundle；删舞台留节点，stageId 归 null", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "舞台" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;

      const added = await p.addProjectScene(id, { title: "第二幕" });
      expect(added.ok).toBe(true);
      if (!added.ok) return;

      const afterAdd = await p.loadProject(id);
      if (!afterAdd.ok) throw new Error("load failed");
      expect(afterAdd.data.scenes.map((s) => s.title)).toContain("第二幕");
      const first = afterAdd.data.nodes[0];
      expect(first).toBeDefined();

      await p.saveNarrative(id, {
        axsSource: null,
        nodes: [
          { ...first!, stageId: added.data.id },
          { id: "n-keep", stageId: null, editorData: {}, narrativeData: {}, sortOrder: 1 },
        ],
        edges: [],
      });

      const removed = await p.removeProjectScene(id, added.data.id);
      expect(removed.ok).toBe(true);

      const afterDelete = await p.loadProject(id);
      if (!afterDelete.ok) throw new Error("load failed");
      expect(afterDelete.data.scenes.map((s) => s.id)).not.toContain(added.data.id);
      // 删的是舞台，不是戏：两拍都还在，只是不再归属任何舞台
      expect(afterDelete.data.nodes.length).toBe(2);
      expect(afterDelete.data.nodes.every((n) => n.stageId === null)).toBe(true);

      const again = await p.removeProjectScene(id, added.data.id);
      if (!again.ok) expect(again.error.code).toBe("not_found");
      else throw new Error("重复删除舞台必须可见地失败");

      const foreign = await p.removeProjectScene("no-such-project", added.data.id);
      if (!foreign.ok) expect(foreign.error.code).toBe("not_found");
      else throw new Error("往不存在的工程里删舞台必须失败");
    });
  });
}

type StoredRoleLike = { characterRefId: string };
