// @vitest-environment node
import { MemoryStorageProvider } from "@axiforge/editor-core";
import { describe, expect, it } from "vitest";
import { exportProjectAsAxsp, importProjectFromAxsp } from "./index";

/**
 * `.axsp` 往返的**完整字段**等价（S13-2 期间的第 4 个同类缺口自查）。
 *
 * 既有的 `storage.test.ts` 组合往返只断言 nodes / edges / axsSource / roles
 * 与 title——而导入侧的实现是 `createProject({ title })` + `saveNarrative` +
 * `addRole` + `addAssetRef`，也就是说**工程元信息从来没人要求它过去**。
 * 本地列在 #21 那批已经补齐（描述/世界观/规则/机制/题材/标签都是真列），
 * 于是"能建能显示"掩盖了"导回来是空的"。
 */
const META = {
  description: "一版会变的简介",
  worldSetting: "近郊变电站",
  rules: "入夜后不得独自上塔",
  mechanism: "密室逃脱",
  genre: "悬疑",
  themeTags: ["夜", "电"],
};

async function seededProvider() {
  const provider = new MemoryStorageProvider();
  const created = await provider.createProject({ title: "带元信息的工程" });
  if (!created.ok) throw new Error("create failed");
  const id = created.data.id;

  const patched = await provider.updateProjectMeta(id, META);
  if (!patched.ok) throw new Error("meta failed");

  const scene = await provider.addProjectScene(id, {
    title: "塔基",
    location: "塔基平台",
    atmosphere: "铁锈味",
    sceneRefId: "pool-scene-1",
    sortOrder: 7,
  });
  if (!scene.ok) throw new Error("scene failed");

  const ref = await provider.addAssetRef(id, { assetType: "item", assetId: "pool-item-1" });
  if (!ref.ok) throw new Error(`assetRef failed：${ref.error.code}`);

  return { provider, id };
}

describe(".axsp 往返不漏字段", () => {
  it("工程元信息（描述/世界观/规则/机制/题材/标签）跟着包走", async () => {
    const { provider, id } = await seededProvider();
    const packed = await exportProjectAsAxsp(provider, id);
    if (!packed.ok) throw new Error(`导出失败：${packed.error.code}`);

    const imported = await importProjectFromAxsp(provider, packed.data);
    if (!imported.ok) throw new Error(`导入失败：${imported.error.code}`);

    const copy = await provider.loadProject(imported.data.id);
    if (!copy.ok) throw new Error("load failed");
    expect(copy.data.meta).toMatchObject({ ...META, title: "带元信息的工程" });
  });

  it("舞台与其池引用（sceneRefId）、道具引用一起过去", async () => {
    const { provider, id } = await seededProvider();
    const packed = await exportProjectAsAxsp(provider, id);
    if (!packed.ok) throw new Error(`导出失败：${packed.error.code}`);

    const imported = await importProjectFromAxsp(provider, packed.data);
    if (!imported.ok) throw new Error(`导入失败：${imported.error.code}`);

    const copy = await provider.loadProject(imported.data.id);
    if (!copy.ok) throw new Error("load failed");
    const origin = await provider.loadProject(id);
    if (!origin.ok) throw new Error("load failed");

    // 舞台按 id 重映射，比的是「同名字段的集合」而不是 id
    type SceneRow = { title: string; location?: string | null; sceneRefId?: string | null };
    const shape = (list: readonly SceneRow[]) =>
      list.map((s) => ({ title: s.title, location: s.location, sceneRefId: s.sceneRefId }));
    expect(shape(copy.data.scenes)).toEqual(shape(origin.data.scenes));
    expect(copy.data.assetRefs.map((r) => r.assetType)).toEqual(["item"]);
    expect(copy.data.assetRefs[0]?.assetId).toBe("pool-item-1");

    // 节点的舞台归属必须**落在导入出来的舞台上**：
    // 旧实现照抄导出侧的 stageId，于是节点指向一个本项目里不存在的舞台（上一版组合用例
    // 恰好把这件事断言成了"等价"），现在按归属可解析性这一真实不变量来测。
    const sceneIds = new Set(copy.data.scenes.map((s) => s.id));
    for (const n of copy.data.nodes) {
      if (n.stageId) expect(sceneIds.has(n.stageId), `节点 ${n.id} 挂在缺失舞台 ${n.stageId}`).toBe(true);
    }
    const titleOf = (list: readonly { id: string; title: string }[], id: string | null) =>
      list.find((s) => s.id === id)?.title ?? null;
    expect(titleOf(copy.data.scenes, copy.data.nodes[0]?.stageId ?? null)).toBe(
      titleOf(origin.data.scenes, origin.data.nodes[0]?.stageId ?? null),
    );
  });
});
