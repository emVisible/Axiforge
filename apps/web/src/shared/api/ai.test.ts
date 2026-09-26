import { describe, expect, it } from "vitest";
import type { Instruction } from "@axiforge/core";
import { applyDraft } from "./ai";

const old: Instruction[] = [{ op: "narration", text: "旧内容" } as Instruction];

describe("applyDraft（AI 草稿响应 → 指令序列）", () => {
  it("规则路径直接用服务端给的 IR，不走本端解析", () => {
    const next = applyDraft(
      { script: [{ op: "narration", text: "新" } as Instruction], source: "rules", axs: "", needs_parse: false },
      old,
      "replace",
    );
    expect(next.map((i) => (i as { text?: string }).text)).toEqual(["新"]);
  });

  it("append 保留既有指令，新内容排在后面", () => {
    const next = applyDraft(
      { script: [{ op: "narration", text: "新" } as Instruction], source: "rules", axs: "", needs_parse: false },
      old,
      "append",
    );
    expect(next).toHaveLength(2);
    expect(next[0]).toEqual(old[0]);
    expect((next[1] as { text?: string }).text).toBe("新");
  });

  it("模型路径把 canonical 文本解析成指令：@bg 读出 bg 而不是旁白", () => {
    const next = applyDraft(
      { script: [], source: "ollama", axs: "# 拍\n甲: 你好\n@bg 交汇港\n", needs_parse: true },
      old,
      "replace",
    );
    expect(next.map((i) => i.op)).toEqual(["say", "bg"]);
  });

  it("模型文本解析不出指令时抛错带原因，不静默插入空脚本", () => {
    expect(() =>
      applyDraft({ script: [], source: "ollama", axs: "# 只有标题\n", needs_parse: true }, old, "replace"),
    ).toThrow(/未解析出任何指令/);
  });

  it("规则侧给出空 IR 也抛错——异常不能演成成功", () => {
    expect(() =>
      applyDraft({ script: [], source: "rules", axs: "", needs_parse: false }, old, "replace"),
    ).toThrow(/未解析出任何指令/);
  });
});
