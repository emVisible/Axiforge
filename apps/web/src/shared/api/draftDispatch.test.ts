import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Instruction } from "@axiforge/core";
import { applyDraft, draftDeps, requestAxsDraft, requestDraft, type ProseToScriptResult } from "./draftDispatch";

const old: Instruction[] = [{ op: "narration", text: "旧内容" } as Instruction];

const empty: ProseToScriptResult = { script: [], source: "rules", axs: "", needs_parse: false };
const originals = {
  isLocal: draftDeps.isLocal,
  remote: draftDeps.remote,
  settings: draftDeps.settings,
  model: draftDeps.model,
};

beforeEach(() => {
  draftDeps.isLocal = originals.isLocal;
  draftDeps.remote = originals.remote;
  draftDeps.settings = originals.settings;
  draftDeps.model = originals.model;
});

afterEach(() => {
  draftDeps.isLocal = originals.isLocal;
  draftDeps.remote = originals.remote;
  draftDeps.settings = originals.settings;
  draftDeps.model = originals.model;
});

describe("applyDraft（草稿结果 → 指令序列）", () => {
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
    expect(() => applyDraft(empty, old, "replace")).toThrow(/未解析出任何指令/);
  });

  it("模型不守语法、返回括号方言时拒绝写入——而不是静静插一堆当旁白的文本", () => {
    expect(() =>
      applyDraft(
        { script: [], source: "ollama", axs: "# 拍\n【背景 交汇港】\n甲: 你好\n", needs_parse: true },
        old,
        "replace",
      ),
    ).toThrow(/括号方言/);
  });

  it("正常旁白以【开头但不含舞台关键词时不误伤", () => {
    const next = applyDraft(
      { script: [], source: "ollama", axs: "# 拍\n【示范】序章那天的雨很大。\n", needs_parse: true },
      old,
      "replace",
    );
    expect(next.map((i) => i.op)).toEqual(["narration"]);
  });
});

describe("requestDraft（桌面本地支 / 浏览器远端支）", () => {
  it("桌面态在本地跑规则引擎，一个请求都不发，产物即 canonical 文本", async () => {
    let remoteCalls = 0;
    draftDeps.isLocal = () => true;
    draftDeps.remote = async () => {
      remoteCalls += 1;
      return empty;
    };

    const res = await requestDraft({
      prose: "【背景 交汇港】\n堰纱: 你来了。",
      roleNames: ["堰纱"],
      authorId: "c1",
    });

    expect(remoteCalls).toBe(0);
    expect(res.needs_parse).toBe(false);
    expect(res.source).toBe("rules");
    expect(res.script.map((i) => i.op)).toEqual(["bg", "say"]);
    expect(res.axs).toBe("# 未命名\n@bg 交汇港\n堰纱: 你来了。\n");
  });

  it("浏览器态仍走端点，参数按传输态 snake_case 送出", async () => {
    let seen: unknown = null;
    draftDeps.isLocal = () => false;
    draftDeps.remote = async (body) => {
      seen = body;
      return empty;
    };

    await requestDraft({ prose: "x", roleNames: ["甲"], authorId: "c1" });
    expect(seen).toEqual({ prose: "x", role_names: ["甲"], author_id: "c1" });
  });

  it("传记路径：桌面态本地成文，标题按调用方给的走而非回退「未命名」", async () => {
    draftDeps.isLocal = () => true;
    const res = await requestAxsDraft({
      prose: "【背景 交汇港】\n雨夜。",
      title: "序章",
      roleNames: ["堰纱"],
    });
    expect(res.source).toBe("rules");
    expect(res.axs).toBe("# 序章\n@bg 交汇港\n雨夜。\n");
  });
});

describe("桌面态本机模型（S13-4：配置了就用，用不了就退回规则且留下痕迹）", () => {
  const SETTINGS = { kind: "ollama" as const, baseUrl: "http://localhost:11434", model: "qwen2.5" };

  it("配了端点：文本交给模型、由本端解析，source 是模型名而非 rules", async () => {
    const seen: { system?: string; user?: string } = {};
    draftDeps.isLocal = () => true;
    draftDeps.settings = () => SETTINGS;
    draftDeps.model = async (system, user) => {
      seen.system = system;
      seen.user = user;
      return "# 序章\n@bg 交汇港\n堰纱: 你来了。\n";
    };

    const res = await requestDraft({ prose: "雨夜，她来了。", title: "序章", roleNames: ["堰纱"] });

    expect(res.source).toBe("ollama");
    expect(res.needs_parse).toBe(true);
    expect(res.script).toEqual([]);
    expect(res.axs).toBe("# 序章\n@bg 交汇港\n堰纱: 你来了。\n");
    expect(res.degradedFrom).toBeUndefined();
    // 提示词是两端共用的那一份，不是这里另拼的
    expect(seen.system).toContain("@bg ");
    expect(seen.system).toContain("禁止使用【背景】");
    expect(seen.user).toContain("可用角色：堰纱");
  });

  it("模型调不通：退回规则引擎让草稿仍然可用，但降级原因随结果出去", async () => {
    draftDeps.isLocal = () => true;
    draftDeps.settings = () => SETTINGS;
    draftDeps.model = async () => {
      throw new Error("llm_unavailable: Failed to fetch");
    };

    const res = await requestDraft({ prose: "堰纱: 你来了。", roleNames: ["堰纱"] });

    expect(res.source).toBe("rules");
    expect(res.needs_parse).toBe(false);
    expect(res.script.map((i) => i.op)).toEqual(["say"]);
    expect(res.degradedFrom).toContain("llm_unavailable");
  });

  it("没配端点：根本不碰模型通路（离线的默认必须是无感的）", async () => {
    let modelCalls = 0;
    draftDeps.isLocal = () => true;
    draftDeps.settings = () => null;
    draftDeps.model = async () => {
      modelCalls += 1;
      return "";
    };

    const res = await requestDraft({ prose: "雨。" });
    expect(modelCalls).toBe(0);
    expect(res.source).toBe("rules");
    expect(res.degradedFrom).toBeUndefined();
  });

  it("传记路径同样三段：模型成功时不降级、失败时带着原因退回", async () => {
    draftDeps.isLocal = () => true;
    draftDeps.settings = () => SETTINGS;
    draftDeps.model = async () => "# 传记\n她没见过海。\n";
    const ok = await requestAxsDraft({ prose: "她没见过海。", title: "传记" });
    expect(ok).toEqual({ axs: "# 传记\n她没见过海。\n", source: "ollama" });

    draftDeps.model = async () => {
      throw new Error("boom");
    };
    const degraded = await requestAxsDraft({ prose: "她没见过海。", title: "传记" });
    expect(degraded.source).toBe("rules");
    expect(degraded.degradedFrom).toBe("boom");
    expect(degraded.axs).toBe("# 传记\n她没见过海。\n");
  });
});
