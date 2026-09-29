// @vitest-environment node
import { describe, expect, it } from "vitest";
import { characterTabs, visibleCharacterTabs } from "./characterTabs";

/**
 * 「桌面该不该给这一栏入口」的判据。
 *
 * 起因是一条已经过期一次的白名单：`CharacterDetailPage` 里手抄着
 * `t.key === "info" || t.key === "sprites"`，写的时候传记确实还只有云端通路，
 * S13-1 把它落进本地契约（`StoredStory` + SQLite v4 + `storySaves`）之后没人回来加这一栏——
 * 于是**本地化做完却没有入口**，桌面上等于没有传记功能（点不进去的失败至少还能被发现，
 * 根本不存在的入口连失败都不发生）。
 */
describe("角色详情页的桌面入口", () => {
  it("桌面态给 info / 传记 / 立绘——传记必须有入口，否则 S13-1 那套本地通路是死代码", () => {
    expect(visibleCharacterTabs(true).map((t) => t.key)).toEqual(["info", "stories", "sprites"]);
  });

  it("浏览器态四栏全给，顺序按声明", () => {
    expect(visibleCharacterTabs(false).map((t) => t.key)).toEqual([
      "info",
      "relations",
      "stories",
      "sprites",
    ]);
  });

  /**
   * 云端专属那一栏是一份**在册清单**而不是派生布尔：
   * 新增一栏时这里会红，逼着写清楚它凭什么算云端（数据通路在哪一侧），
   * 而不是默认「看着像云端」就进桌面黑名单。
   */
  it("只有关系一栏真的是云端专属", () => {
    expect(characterTabs.filter((t) => t.cloudOnly).map((t) => t.key)).toEqual(["relations"]);
  });
});
