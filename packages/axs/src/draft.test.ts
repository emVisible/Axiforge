import { describe, expect, it } from "vitest";
import { draftFromProse, proseToScriptDraft } from "./draft";

describe("proseToScriptDraft（散文切句与归属）", () => {
  it("切句：一句一行，空行不产指令但会收尾挂起的选项", () => {
    expect(proseToScriptDraft("甲说。\n\n乙说。").map((i) => i.op)).toEqual([
      "narration",
      "narration",
    ]);
  });

  it("说话人归属：在角色表里是 say，不在表里退回旁白且保留全角冒号", () => {
    const known = proseToScriptDraft("堰纱：你来接我？", ["堰纱"])[0]!;
    expect(known.op).toBe("say");
    expect(known.op === "say" && known.speaker).toBe("堰纱");

    const unknown = proseToScriptDraft("陌生人：别过来。", ["堰纱"])[0]!;
    expect(unknown.op).toBe("narration");
    expect(unknown.op === "narration" && unknown.text).toBe("陌生人：别过来。");
  });

  it("无角色表时任何「名：话」都按对白处理（与 Python 侧同一裁决）", () => {
    expect(proseToScriptDraft("甲：你好").map((i) => i.op)).toEqual(["say"]);
  });

  it("选项：一行竖线/斜杠分隔成多项，并作为单个 choice 指令排在末尾", () => {
    const script = proseToScriptDraft("甲：选吧\n> 左边 | 右边 / 原地");
    const choice = script.find((i) => i.op === "choice");
    expect(choice?.op === "choice" && choice.options.map((o) => o.label)).toEqual([
      "左边",
      "右边",
      "原地",
    ]);
  });

  it("舞台指令推断：五种括号速记各映射到对应 op 与规则现值", () => {
    const ops = proseToScriptDraft(
      "【背景 交汇港】\n【音乐 rain_theme】\n【旁白 雨夜】\n【转场 fade】\n【特效 flash】",
    );
    expect(ops.map((i) => i.op)).toEqual(["bg", "bgm", "narration", "transition", "fx"]);
    expect(ops[1]!.op === "bgm" && ops[1]!.loop).toBe(true);
    expect(ops[3]!.op === "transition" && ops[3]!.ms).toBe(500);
    expect(ops[4]!.op === "fx" && ops[4]!.ms).toBe(600);
  });

  it("括号后拖的正文另起一条旁白，但【旁白 x】本身不重复产出", () => {
    const ops = proseToScriptDraft("【背景 交汇港】塔钟敲了六下。");
    expect(ops.map((i) => i.op)).toEqual(["bg", "narration"]);
    expect(ops[1]!.op === "narration" && ops[1]!.text).toBe("塔钟敲了六下。");
  });
});

describe("draftFromProse（产物必须是 canonical 文本）", () => {
  it("标题为空回退「未命名」，内核不自己拼格式而是交回 printAxs", () => {
    expect(draftFromProse({ prose: "雨下个不停。" })).toBe("# 未命名\n雨下个不停。\n");
  });

  it("产物再被 parse 一次，op 序列与规则引擎直出的完全一致", async () => {
    const { parseAxs } = await import("./parse");
    const prose = "【背景 交汇港】\n堰纱: 你来了。\n> 握手 | 转身";
    const axs = draftFromProse({ prose, title: "测试", roleNames: ["堰纱"] });
    const doc = parseAxs(axs);

    expect(doc.diagnostics).toEqual([]);
    expect(doc.beats[0]!.script.map((i) => i.op)).toEqual(["bg", "say", "choice"]);
  });

  it("认不出的名字退成旁白后，产物里不会出现半角冒号的伪对白", () => {
    const axs = draftFromProse({ prose: "陌生人：别过来。", title: "t", roleNames: ["堰纱"] });
    expect(axs).toBe("# t\n陌生人：别过来。\n");
  });
});
