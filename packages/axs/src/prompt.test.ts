import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { proseToAxsSystem, proseToAxsUser } from "./prompt";

/**
 * 提示词指纹。同一个摘要也写在 `backend/tests/test_prompt_parity.py` 里——
 * 两端各自算一遍再比对，测的不是"文件存在"，而是**两端加载出来的文本逐字节相同**。
 *
 * 为什么要钉摘要而不是文本：这份提示词的内容就是 AXS 语法，改它等于改对模型的契约，
 * 应该是有人刻意为之的动作；顺手润色一句而忘了模型侧的后果，正是本仓库已经吃过一次的
 * "静默漂移"（认不出的行被当旁白读，diagnostics 为空）。要改就一起改两处摘要并说明理由。
 */
const SYSTEM_SHA256 = "756070e37ea171f85f9a27f13f60db992f091227d12f0dcd5a0f5d7f32eccc0f";

const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

describe("AXS 提示词单一真相源", () => {
  it("system 与 user 模板逐字节等于两端共同锁定的摘要", () => {
    expect(sha(proseToAxsSystem())).toBe(SYSTEM_SHA256);
    expect(sha(proseToAxsUser({ prose: "下雨了", title: "序章", roleNames: ["甲", "乙"] }))).toBe(
      sha("标题：序章\n可用角色：甲、乙\n\n散文：\n下雨了"),
    );
  });

  it("语法清单覆盖解析器实际接受的每条指令——漏一条就是模型不会写它", () => {
    const sys = proseToAxsSystem();
    for (const token of [
      "# ", "@bg ", "@bgm ", "@se ", "@voice ", "@wait ",
      "@transition ", "@fx ", "@camera ", "@show ", "@hide ", "@move ", "> ",
    ]) {
      expect(sys, `提示词里缺了 ${token.trim()}`).toContain(token);
    }
    expect(sys).toContain("禁止使用【背景】");
  });

  it("角色为空时退回 defaultSpeaker，再为空退回「旁白」", () => {
    expect(proseToAxsUser({ prose: "x", roleNames: [] })).toContain("可用角色：旁白");
    expect(proseToAxsUser({ prose: "x", roleNames: [], defaultSpeaker: "堰纱" })).toContain("可用角色：堰纱");
    expect(proseToAxsUser({ prose: "x", roleNames: ["甲", ""] })).toContain("可用角色：甲");
  });
});
