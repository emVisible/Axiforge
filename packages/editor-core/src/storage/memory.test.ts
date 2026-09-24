import { describe, expect, it } from "vitest";
import { createDraft } from "../document";
import { MemoryStorageProvider } from "./memory";
import { runStorageContractSuite } from "./contract";
import { runStoragePoolContractSuite } from "./contractPools";
import type { StoredNode } from "./types";

runStorageContractSuite("Memory", () => new MemoryStorageProvider());
runStoragePoolContractSuite("Memory", () => new MemoryStorageProvider());

describe("Memory 实现的附加语义", () => {
  it("seedProject：Draft 快照可注入为工程（迁移/夹具通道）", async () => {
    const p = new MemoryStorageProvider();
    const draft = createDraft({
      nodes: [
        { id: "a", stageId: null, narrative: { title: "甲", script: [] }, sortOrder: 0 },
      ],
      edges: [],
      scenes: [{ id: "s1", title: "主场景" }],
    });
    p.seedProject("proj-x", "注入工程", draft);

    const load = await p.loadProject("proj-x");
    expect(load.ok).toBe(true);
    if (!load.ok) return;
    const node: StoredNode | undefined = load.data.nodes[0];
    expect(node?.narrativeData).toMatchObject({ title: "甲" });
    expect(node?.editorData).toMatchObject({ position: { x: 0, y: 0 } });
  });
});

describe("Memory 附加分支", () => {
  it("updateProjectMeta 仅写 axsSource 时标题不变；仅写标题时 axs 不变", async () => {
    const p = new MemoryStorageProvider();
    const created = await p.createProject({ title: "原题" });
    if (!created.ok) throw new Error("create");
    const id = created.data.id;

    await p.updateProjectMeta(id, { axsSource: "# 投影\n" });
    let load = await p.loadProject(id);
    if (!load.ok) throw new Error("load");
    expect(load.data.meta.title).toBe("原题");
    expect(load.data.axsSource).toBe("# 投影\n");

    await p.updateProjectMeta(id, { title: "新题" });
    load = await p.loadProject(id);
    if (!load.ok) throw new Error("load");
    expect(load.data.meta.title).toBe("新题");
    expect(load.data.axsSource).toBe("# 投影\n");
  });

  it("saveCharacter 空 id 走创建臂（服务端分配）", async () => {
    const p = new MemoryStorageProvider();
    const r = await p.saveCharacter({
      id: "",
      name: "新角色",
      characterData: {},
      imagePath: null,
      isPublic: false,
      authorId: "u1",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toMatch(/^char-/);
  });
});
