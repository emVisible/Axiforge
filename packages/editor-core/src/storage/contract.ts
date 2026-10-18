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

    /**
     * 重复 node id 必须显式失败，且**失败后旧图不变**。2026-10-01 复审补的：
     * Memory 原形状用 `new Map(nodes.map(n => [n.id, n]))`，重复 id 被静默吃掉并返回 ok
     * （实测送 2 个 ⇒ 读回 1 个、且是后者）；SQLite 因主键而报 io 并整体回滚。
     * 同一个契约方法在两个本地后端给出相反语义——桌面测试宿主悄悄丢节点、真桌面报 io。
     * 只断言 `code === "io"` 是刻意的：两端 detail 措辞不同，语义必须一致、文本不必。
     */
    it("saveNarrative 重复 node id → io，且旧图不被改动", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "契约-重复 id" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;

      const before = await p.loadProject(id);
      if (!before.ok) throw new Error("load failed");
      const beforeCount = before.data.nodes.length;

      const dup = await p.saveNarrative(id, {
        axsSource: null,
        edges: [],
        nodes: [
          { id: "dup", stageId: null, editorData: {}, narrativeData: { title: "一" }, sortOrder: 0 },
          { id: "dup", stageId: null, editorData: {}, narrativeData: { title: "二" }, sortOrder: 1 },
        ],
      });
      expect(dup.ok).toBe(false);
      if (!dup.ok) expect(dup.error.code).toBe("io");

      const after = await p.loadProject(id);
      if (!after.ok) throw new Error("reload failed");
      expect(after.data.nodes).toHaveLength(beforeCount);
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

      // 移同一个 role 第二次 / 移一个从未存在的 role ⇒ not_found，不做幂等吞掉。
      // 2026-10-01 复审：后端 `remove_role` 在删不到时抛 404，HTTP provider 原样转成本地码；
      // 而 Memory 与 SQLite 此前都报 ok ⇒ 同一个操作在桌面态与浏览器态给出相反的成功/失败。
      // 这条写进契约套件（本套件同跑 Memory 与 SQLite(sql.js)），所以下一个新后端也会被它拦住。
      const again = await p.removeRole(id, roleId);
      expect(again.ok).toBe(false);
      if (!again.ok) expect(again.error.code).toBe("not_found");
      const ghost = await p.removeRole(id, "role-从不存在");
      expect(ghost.ok).toBe(false);
      if (!ghost.ok) expect(ghost.error.code).toBe("not_found");
    });

    /**
     * 舞台排序号：**给了就照给，没给才算下一个**。2026-10-01 复审补的。
     *
     * 原状是两端各行其是：Memory 原样存调用方的值（不传 ⇒ 读回 `null`），
     * SQLite 硬编码 `COUNT(*)`（不传 ⇒ `0,1,2`；传了也**照收不误**，那个值被整个忽略）。
     * 后果分两层：① `ProjectSceneInput` 里声明过的 `sortOrder` 在**生产路径**上被忽略
     * （`.axsp` 导入显式传的就是它）；② 契约套件跑的是 Memory，于是测试宿主与桌面读回不同、
     * 而两边都绿——这是最难查的那类偏差。
     *
     * 分母：随包三份 `.axsp` 的 `sortOrder` 全是 `null`（运行时不满足那个可选数字的声明），
     * 所以 `null` 与 `undefined` 必须同义走"算下一个"，否则现有内容行为会变。
     * 写进契约套件是为了让**下一个**后端也别再各行其是。
     */
    it("舞台排序号：给了照给、没给按已有数量算（两端同一语义）", async () => {
      const p = await makeProvider();
      const created = await p.createProject({ title: "契约-舞台序" });
      if (!created.ok) throw new Error("create failed");
      const id = created.data.id;
      const fresh = await p.loadProject(id);
      if (!fresh.ok) throw new Error("load failed");
      for (const s of fresh.data.scenes) await p.removeProjectScene(id, s.id);

      // 没给 ⇒ 按已有数量顺延
      await p.addProjectScene(id, { title: "甲" });
      await p.addProjectScene(id, { title: "乙" });
      await p.addProjectScene(id, { title: "丙" });
      let got = await p.loadProject(id);
      if (!got.ok) throw new Error("load failed");
      expect(got.data.scenes.map((s) => [s.title, s.sortOrder])).toEqual([
        ["甲", 0],
        ["乙", 1],
        ["丙", 2],
      ]);

      // 给了就照给（哪怕跳跃、哪怕与已有值重复）
      await p.addProjectScene(id, { title: "丁", sortOrder: 10 });
      await p.addProjectScene(id, { title: "戊", sortOrder: 3 });
      got = await p.loadProject(id);
      if (!got.ok) throw new Error("load failed");
      const byTitle = Object.fromEntries(got.data.scenes.map((s) => [s.title, s.sortOrder]));
      expect(byTitle["丁"]).toBe(10);
      expect(byTitle["戊"]).toBe(3);
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

    /**
     * 2026-10-01 复审新增：把「同一内容 → 同一 ref」这句契约**改准**，并钉住改准后的形状。
     *
     * 原句（`types.ts` 与 `assets.ts` 各一份）写的是「同一内容 → 同一 ref」，
     * 而实现把扩展名拼进 ref（本地那侧 ref 就是**落盘文件名**，去掉后缀就没有类型、
     * 读路径也认不出来）⇒ 同一份字节换一个后缀会得到**两个** ref（实测 `…<key>.png` 与 `…<key>.jpg`）。
     * 于是有人照那句措辞去找代码缺陷，会把实现"修"成真的缺陷。
     *
     * **本条钉的是"精确后的不变量"，不是把代码改成符合旧措辞**：
     * ① 同一内容 + 同一后缀 ⇒ 同 ref（上面那条用例已经在钉，这里不重复）；
     * ② 同一内容 + **不同**后缀 ⇒ **不同** ref，且两个 ref 都能 `readAsset` 回同一份字节。
     * ② 是关键：它同时证明"身份含后缀"与"字节没丢"，而只断言 ① 的话两种实现都能过。
     *
     * 两条用户承诺不受影响（推导见 `assets.ts::contentKey` 上方）：
     * 重复导入意味着同一个文件名、因而同一个后缀；而 `.axsp` 的 ref 随包走、接收方不重算摘要。
     */
    it("素材：同一内容换后缀给两个 ref（身份含后缀），且两个都读得回同一份字节", async () => {
      const p = await makeProvider();
      const bytes = new Uint8Array([7, 7, 7]);
      const asPng = await p.saveAsset({ name: "cover.png", mime: "image/png", bytes });
      const asJpg = await p.saveAsset({ name: "cover.jpg", mime: "image/jpeg", bytes });
      expect(asPng.ok && asJpg.ok).toBe(true);
      if (!asPng.ok || !asJpg.ok) return;

      expect(asJpg.data.ref).not.toBe(asPng.data.ref);
      // 身份含后缀，但字节仍是同一份
      for (const ref of [asPng.data.ref, asJpg.data.ref]) {
        const back = await p.readAsset(ref);
        expect(back.ok).toBe(true);
        if (back.ok) expect(Array.from(back.data)).toEqual([7, 7, 7]);
      }
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
}

type StoredRoleLike = { characterRefId: string };
