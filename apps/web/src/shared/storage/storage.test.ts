import { describe, expect, it } from "vitest";
import { MemoryStorageProvider, collectAssetRefs, unpackAxsp } from "@axiforge/editor-core";
import { exportProjectAsAxsp, importProjectFromAxsp } from "./index";

/**
 * .axsp 导出/导入组合的往返等价验证（Memory 基准实现）。
 * 导入 = 现有契约组合（createProject + saveNarrative + addRole），不新增接口方法。
 */

describe(".axsp 导出/导入组合", () => {
  it("export → import：新工程数据与原工程等价（新 id）", async () => {
    const provider = new MemoryStorageProvider();
    const created = await provider.createProject({ title: "原工程" });
    if (!created.ok) throw new Error("create failed");
    const id = created.data.id;

    await provider.saveNarrative(id, {
      axsSource: "# 开始\n旁白：往返验证。\n",
      nodes: [
        {
          id: "n1",
          stageId: "scene-main",
          editorData: { position: { x: 1, y: 2 } },
          narrativeData: { title: "开始", script: [{ op: "narration", text: "往返验证。" }] },
          sortOrder: 0,
        },
      ],
      edges: [],
    });
    await provider.addRole(id, { characterRefId: "char-9" });

    // 导出
    const packed = await exportProjectAsAxsp(provider, id);
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;

    // 容器结构：manifest + 素材清单
    const unpacked = unpackAxsp(packed.data);
    expect(unpacked.ok).toBe(true);
    if (!unpacked.ok) return;
    expect(unpacked.data.manifest.name).toBe("原工程");
    expect(collectAssetRefs(unpacked.data.project)).toEqual([]);

    // 导入 → 新 id、数据等价
    const imported = await importProjectFromAxsp(provider, packed.data);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.data.id).not.toBe(id);
    expect(imported.data.title).toBe("原工程");

    const orig = await provider.loadProject(id);
    const copy = await provider.loadProject(imported.data.id);
    expect(orig.ok && copy.ok).toBe(true);
    if (!orig.ok || !copy.ok) return;
    expect(copy.data.nodes).toEqual(orig.data.nodes);
    expect(copy.data.edges).toEqual(orig.data.edges);
    expect(copy.data.axsSource).toBe(orig.data.axsSource);
    expect(copy.data.roles.map((r) => r.characterRefId)).toEqual(
      orig.data.roles.map((r) => r.characterRefId),
    );
  });

  it("导入损坏文本 → corrupted，不产生半工程", async () => {
    const provider = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(provider, "broken{");
    expect(r.ok).toBe(false);
    const list = await provider.listProjects();
    expect(list.ok && list.data).toHaveLength(0);
  });
});
