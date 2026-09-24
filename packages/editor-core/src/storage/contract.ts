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

    it("角色库：save（空 id 创建并返回服务端 id）→ upsert 覆盖 → list/get", async () => {
      const p = await makeProvider();
      const created = await p.saveCharacter({
        id: "",
        name: "凛",
        characterData: { anchor: { name: "凛" } },
        imagePath: null,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.data.id).toBeTruthy();

      // 以返回 id upsert 覆盖
      const updated = await p.saveCharacter({
        id: created.data.id,
        name: "凛二",
        characterData: {},
        imagePath: "/x.png",
      });
      expect(updated.ok && updated.data.id).toBe(created.data.id);

      const list = await p.listCharacters();
      expect(list.ok && list.data).toHaveLength(1);
      expect(list.ok && list.data[0]!.name).toBe("凛二");

      const got = await p.getCharacter(created.data.id);
      expect(got.ok && got.data.imagePath).toBe("/x.png");
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
  });
}

type StoredRoleLike = { characterRefId: string };
