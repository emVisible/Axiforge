import { describe, expect, it } from "vitest";
import { MemoryStorageProvider } from "@axiforge/editor-core";
import type { StorageProvider } from "@axiforge/editor-core";
import { loadStoryOffline } from "./offlineStory";

/**
 * 桌面离线试玩编译（S13 验收里那条「离线渲染正确性」）。
 *
 * 用 Memory 支而不是 sql.js：sql.js 只装在 editor-core，apps/web 引它要新增依赖。
 * 这里要证的是**投影与取数语义**（引用怎么落到 IR、失败怎么归位），
 * 而 Memory/SQLite 两支的这些语义由同一份契约套件（contractAuthoring / contractPools）钉住；
 * SQLite 支的真身另有壳内冒烟（`desktopSmoke.ts`）在同一批断言上跑。
 */
const AUTHOR = "creator-offline";

/** 桌面首启后的真实形状：角色、舞台、道具全部私有（`.axsp` 导入明文「公开位不继承」） */
async function seedOfflineProject() {
  const p = new MemoryStorageProvider();
  const char = await p.saveCharacter({
    id: "",
    name: "凛",
    characterData: { sprites: { smile: "assets/lin-smile.png" } },
    imagePath: "assets/lin.png",
    isPublic: false,
    authorId: AUTHOR,
  });
  if (!char.ok) throw new Error("角色建档失败");

  const sceneAsset = await p.saveScene({
    id: "", name: "地窖", description: "", location: "方舟·地下", atmosphere: "潮、暗",
    era: null, worldSetting: null, rules: null, tags: [], nodeTemplates: [],
    imagePath: "assets/cellar.png", isPublic: false, authorId: AUTHOR, updatedAt: "",
  });
  if (!sceneAsset.ok) throw new Error("舞台建档失败");

  const item = await p.saveItem({
    id: "", name: "铜钥匙", description: "开地窖", category: "关键道具", rarity: "普通",
    mechanismTags: [], effects: [], imagePath: "assets/key.png",
    isPublic: false, authorId: AUTHOR, updatedAt: "",
  });
  if (!item.ok) throw new Error("道具建档失败");

  const proj = await p.createProject({ title: "离线编译" });
  if (!proj.ok) throw new Error("工程建档失败");
  const projectId = proj.data.id;

  await p.addRole(projectId, { characterRefId: char.data.id });
  const stage = await p.addProjectScene(projectId, {
    title: "第一幕", sceneRefId: sceneAsset.data.id, source: "reference",
  });
  if (!stage.ok) throw new Error("舞台挂载失败");
  const saved = await p.saveNarrative(projectId, {
    axsSource: null,
    nodes: [
      {
        id: "b1",
        stageId: stage.data.id,
        editorData: {},
        narrativeData: { title: "开场", script: [{ op: "say", speaker: "凛", text: "我来了。" }] },
        sortOrder: 0,
      },
    ],
    edges: [],
  });
  if (!saved.ok) throw new Error("叙事保存失败");

  const good = await p.addAssetRef(projectId, { assetType: "item", assetId: item.data.id });
  // 本体已删的引用：桌面允许留着（删道具不连带清引用），编译期该如实缺席
  await p.addAssetRef(projectId, { assetType: "item", assetId: "item-ghost" });
  if (!good.ok) throw new Error("道具引用挂载失败");

  return { p, projectId, charId: char.data.id, sceneAssetId: sceneAsset.data.id, itemId: item.data.id };
}

describe("桌面离线编译", () => {
  it("私有角色按引用解析得到：说话人表、立绘与表情差分都进 IR", async () => {
    const { p, projectId, charId } = await seedOfflineProject();
    const pkg = await loadStoryOffline(projectId, p);
    expect(pkg.projectId).toBe(projectId);
    // 此前这里走 listCharacters() 无作用域=「只剩公开」，桌面私有角色一条都不进 IR
    expect(pkg.characters.map((c) => c.name)).toEqual(["凛"]);
    expect(pkg.characters[0]?.id).toBe(charId);
    expect(pkg.characters[0]?.imagePath).toBe("assets/lin.png");
    expect(pkg.characters[0]?.expressions).toEqual({ smile: "assets/lin-smile.png" });
    expect(pkg.beats).toHaveLength(1);
    expect(pkg.beats[0]?.script[0]).toMatchObject({ op: "say", text: "我来了。" });
  });

  it("舞台本体（背景/地点/氛围）随 sceneRefId 落到 IR——导入的舞台不是没有背景", async () => {
    const { p, projectId } = await seedOfflineProject();
    const pkg = await loadStoryOffline(projectId, p);
    const stage = pkg.scenes.find((s) => s.title === "第一幕");
    expect(stage).toBeDefined();
    expect(stage?.backgroundImage).toBe("assets/cellar.png");
    expect(stage?.location).toBe("方舟·地下");
    expect(stage?.atmosphere).toBe("潮、暗");
  });

  it("编排台挂的道具进运行时清单；本体已删的那条如实缺席而不是编个空位", async () => {
    const { p, projectId, itemId } = await seedOfflineProject();
    const pkg = await loadStoryOffline(projectId, p);
    expect(pkg.items).toEqual([
      { id: itemId, name: "铜钥匙", category: "关键道具", imagePath: "assets/key.png" },
    ]);
  });

  it("池子读盘故障→抛出；工程不存在→404。都不许演成「这个工程什么都没有」", async () => {
    const { p, projectId } = await seedOfflineProject();
    const bundle = await p.loadProject(projectId);
    if (!bundle.ok) throw new Error("装载失败");

    const ioProvider = {
      loadProject: async () => bundle,
      getCharacter: async () => ({ ok: false, error: { code: "io", detail: "磁盘故障" } }),
      getScene: async () => ({ ok: false, error: { code: "not_found", entity: "scene", id: "s" } }),
      getItem: async () => ({ ok: false, error: { code: "not_found", entity: "item", id: "i" } }),
    } as unknown as StorageProvider;
    await expect(loadStoryOffline(projectId, ioProvider)).rejects.toThrow("io");

    await expect(loadStoryOffline("no-such-project", p)).rejects.toThrow("404");
  });
});
