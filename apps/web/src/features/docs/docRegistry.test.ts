import { describe, expect, it } from "vitest";
import { docNav, getDocBySlug, getDocReadme, listDocSlugs } from "./docRegistry";

/**
 * 文档站完整性：`docs/user/_nav.json` 与实际 Markdown 文件不得漂移。
 * 模块加载时已有 assertNavIntegrity() 抛错，但那只在线上跑到该路由时才暴露；
 * 这里把它变成 CI 门禁里的一条断言。
 */
describe("文档站注册表", () => {
  it("_nav.json 每一项都能解析到 Markdown 正文", () => {
    const slugs = listDocSlugs();
    for (const section of docNav) {
      for (const item of section.items) {
        expect(slugs, `导航项未登记到文档表：${item.slug}`).toContain(item.slug);
        const body = getDocBySlug(item.slug);
        expect(body, `缺文档正文：${item.slug}`).toBeTruthy();
        expect(body!.length, `正文过短：${item.slug}`).toBeGreaterThan(200);
      }
    }
  });

  it("首页 README 可读", () => {
    expect(getDocReadme().length).toBeGreaterThan(50);
  });

  it("桌面版文档存在且覆盖了能力边界（不能只写好处）", () => {
    const body = getDocBySlug("desktop/desktop-and-axsp") ?? "";
    expect(body).toContain(".axsp");
    expect(body).toContain("已知限制");
    expect(body).toContain("需要后端");
  });
});
