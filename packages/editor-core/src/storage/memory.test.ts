import { describe, expect, it } from "vitest";
import { createDraft } from "../document";
import { MemoryStorageProvider } from "./memory";
import { runStorageContractSuite } from "./contract";
import type { StoredNode } from "./types";

runStorageContractSuite("Memory", () => new MemoryStorageProvider());

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
