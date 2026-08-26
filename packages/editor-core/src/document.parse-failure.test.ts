import { describe, expect, it, vi } from "vitest";

// 模拟 L1 解析器抛异常的病态场景，覆盖 axs.import 的 parse_failed 防御路径
vi.mock("@axiforge/axs", () => ({
  parseAxs: () => {
    throw new Error("病态输入");
  },
  printAxs: () => "",
}));

import { apply, createDraft } from "./document";

describe("axs.import 防御路径", () => {
  it("解析器异常转为 parse_failed，不产生半应用状态（I4）", () => {
    const draft = createDraft({
      nodes: [{ id: "a", narrative: { title: "甲" } }],
    });
    const r = apply(
      draft,
      {
        tx: { kind: "axs.import", source: "# x\n", roles: {} },
        origin: "writer",
      },
      () => "gen",
    );
    expect(r).toEqual({
      ok: false,
      error: { code: "parse_failed", detail: "病态输入" },
    });
    // 原 Draft 原封不动
    expect(draft.nodes.size).toBe(1);
    expect(draft.rev).toBe(0);
  });
});
