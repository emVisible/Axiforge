import type { StoredAssetItem, StoredAssetScene } from "@axiforge/editor-core";
import { describe, expect, it } from "vitest";
import { storedItemToResponse, storedSceneToResponse } from "./assetRecords";

/**
 * 存储态 → 传输态投影的判据。
 *
 * 这层映射的全部意义是**两件事**：字段口径只有一处（否则桌面与浏览器会各自演化），
 * 以及**本地拿不到的东西如实缺席而不是编一个值**。第二条最容易在"顺手统一一下"中被改掉，
 * 而后果是直接显示假事实：道具/舞台卡片的「N 个剧本引用」角标靠 `ref_count === undefined` 隐藏，
 * 一旦有人把它"对齐"成 0，界面上就会出现一个谁都没数过的「0 个剧本引用」。
 * 所以这里钉的不是"字段有没有映射对"，而是**三处刻意的不对称**与一处别名防护。
 */

const item = (): StoredAssetItem => ({
  id: "item-1",
  name: "铜钥匙",
  description: "开锁",
  category: "关键道具",
  rarity: "普通",
  mechanismTags: ["开锁", "隐藏"],
  effects: ["开门"],
  imagePath: "assets/k.png",
  isPublic: false,
  authorId: null,
  updatedAt: "2026-10-01T00:00:00.000Z",
});

const scene = (): StoredAssetScene => ({
  id: "scene-1",
  name: "变电站",
  description: "近郊",
  location: "塔基平台",
  atmosphere: "铁锈味",
  era: null,
  worldSetting: "当代",
  rules: "入夜不得上塔",
  tags: ["夜"],
  nodeTemplates: [{ a: 1 }],
  imagePath: null,
  isPublic: true,
  authorId: "creator-1",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

describe("道具投影 storedItemToResponse", () => {
  it("键集合就是传输态声明的那些，不多不少（口径只有一处）", () => {
    expect(Object.keys(storedItemToResponse(item())).sort()).toEqual(
      [
        "author_id",
        "category",
        "created_at",
        "description",
        "effects",
        "id",
        "image_path",
        "is_public",
        "mechanism_tags",
        "name",
        "rarity",
        "updated_at",
        "view_count",
      ].sort(),
    );
  });

  it("本地不统计浏览：view_count 恒 0，而 ref_count 这个键根本不该出现", () => {
    const r = storedItemToResponse(item());

    expect(r.view_count).toBe(0);
    expect("ref_count" in r).toBe(false);
  });

  it("数组是拷贝：改响应不会脏写存储记录", () => {
    const src = item();
    const r = storedItemToResponse(src);

    (r.effects as string[]).push("被页面改过");
    (r.mechanism_tags as string[]).pop();

    expect(src.effects).toEqual(["开门"]);
    expect(src.mechanismTags).toEqual(["开锁", "隐藏"]);
  });

  it("authorId 为空给空串（传输态是必填字符串），created_at 如实等于 updatedAt", () => {
    const r = storedItemToResponse(item());

    expect(r.author_id).toBe("");
    expect(r.created_at).toBe(r.updated_at);
    expect(r.image_path).toBe("assets/k.png");
  });
});

describe("舞台投影 storedSceneToResponse", () => {
  it("三处刻意缺席：ref_count 键在但值为 undefined（角标据此隐藏），fork_from_id 恒 null", () => {
    const r = storedSceneToResponse(scene());

    expect("ref_count" in r).toBe(true);
    expect(r.ref_count).toBeUndefined();
    expect(r.fork_from_id).toBeNull();
    expect(r.view_count).toBe(0);
  });

  it("可空字段原样透传（不折成空串），非空 authorId 直接用", () => {
    const r = storedSceneToResponse(scene());

    expect(r.era).toBeNull();
    expect(r.image_path).toBeNull();
    expect(r.world_setting).toBe("当代");
    expect(r.author_id).toBe("creator-1");
    expect(Object.keys(r).sort()).toEqual(
      [
        "author_id",
        "atmosphere",
        "created_at",
        "description",
        "era",
        "fork_from_id",
        "id",
        "image_path",
        "is_public",
        "location",
        "name",
        "node_templates",
        "ref_count",
        "rules",
        "tags",
        "updated_at",
        "view_count",
        "world_setting",
      ].sort(),
    );
  });

  it("tags 与 node_templates 同样是拷贝", () => {
    const src = scene();
    const r = storedSceneToResponse(src);

    (r.tags as string[]).push("脏写");
    (r.node_templates as unknown[]).shift();

    expect(src.tags).toEqual(["夜"]);
    expect(src.nodeTemplates).toEqual([{ a: 1 }]);
  });
});
