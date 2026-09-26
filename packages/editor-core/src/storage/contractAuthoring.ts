/**
 * 创作主数据域的契约用例（角色传记 / 工程内舞台）——Phase 13 桌面本地化补进来的两块。
 *
 * 与 `contractPools.ts` 同一拆分理由：一份测试源、多实现验收，
 * 拆成两个 runner 只为让每个文件留在 G1 的 400 行预算内。
 * 契约测试的价值在覆盖面，不在挤进同一个文件。
 */

import { describe, expect, it } from "vitest";
import type { StorageProvider } from "./types";

export function runStorageAuthoringContractSuite(
  name: string,
  makeProvider: () => StorageProvider | Promise<StorageProvider>,
): void {
  describe(`存储契约 · ${name} · 创作主数据`, () => {
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

      it("导入带来的地点/氛围/引用 id 读得回来——写进去读不回就是静默降级", async () => {
        const p = await makeProvider();
        const created = await p.createProject({ title: "导入" });
        if (!created.ok) throw new Error("create failed");
        const added = await p.addProjectScene(created.data.id, {
          title: "地窖",
          description: "只能从正门进",
          location: "方舟·地下",
          atmosphere: "潮、暗",
          sceneRefId: "asset-scene-1",
          source: "reference",
        });
        expect(added.ok).toBe(true);
        if (!added.ok) return;

        const bundle = await p.loadProject(created.data.id);
        if (!bundle.ok) throw new Error("load failed");
        expect(bundle.data.scenes.find((s) => s.id === added.data.id)).toMatchObject({
          title: "地窖",
          description: "只能从正门进",
          location: "方舟·地下",
          atmosphere: "潮、暗",
          sceneRefId: "asset-scene-1",
          source: "reference",
        });
      });
    });
  });
}
