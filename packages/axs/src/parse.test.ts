import { describe, expect, it } from "vitest";
import { parseAxs, parseCondition, parseLiteral, printLiteral } from "./parse";
import { printAxs } from "./print";
import type { AxsDocument } from "./types";

describe("parseLiteral / printLiteral", () => {
  it("round-trips primitives", () => {
    for (const v of [true, false, 42, 3.14, "hello", "bare_word"]) {
      expect(printLiteral(parseLiteral(printLiteral(v)))).toBe(printLiteral(v));
    }
  });
});

describe("parseCondition", () => {
  it("parses atom and group", () => {
    const atom = parseCondition("flag.trust == true");
    expect(atom).toEqual({
      type: "flag",
      key: "trust",
      operator: "eq",
      value: true,
    });

    const group = parseCondition("flag.a == 1 && memory.b != 2");
    expect(group).toEqual({
      type: "all",
      conditions: [
        { type: "flag", key: "a", operator: "eq", value: 1 },
        { type: "memory", key: "b", operator: "ne", value: 2 },
      ],
    });
  });
});

describe("parseAxs basics", () => {
  it("parses beat heading annotations", () => {
    const doc = parseAxs(
      `# 雨夜 @stage(公寓) [key: intro] [ending: 真结局] [if: flag.done == true]
堰纱: 你好`,
    );
    expect(doc.beats).toHaveLength(1);
    const beat = doc.beats[0]!;
    expect(beat.title).toBe("雨夜");
    expect(beat.stage).toBe("公寓");
    expect(beat.key).toBe("intro");
    expect(beat.isEnding).toBe(true);
    expect(beat.endingLabel).toBe("真结局");
    expect(beat.trigger).toEqual({
      type: "flag",
      key: "done",
      operator: "eq",
      value: true,
    });
    expect(beat.script[0]).toMatchObject({ op: "say", text: "你好" });
  });

  it("parses directives and effects", () => {
    const doc = parseAxs(`# 开场
@bg apartment
@bgm rain loop
@wait 500
@flag met = true
@memory score = 10
@state 堰纱.mood = calm
@codex 堰纱.trust = high`);
    const beat = doc.beats[0]!;
    expect(beat.script.map((s) => s.op)).toEqual(["bg", "bgm", "wait"]);
    expect(beat.effects).toEqual([
      { type: "flag", key: "met", value: true },
      { type: "memory", key: "score", value: 10 },
      { type: "character_state", key: "堰纱.mood", value: "calm" },
      { type: "codex_write", key: "堰纱.trust", value: "high" },
    ]);
  });

  it("parses dialogue with expression", () => {
    const doc = parseAxs(`# 对白
堰纱(smile): 谢谢`);
    expect(doc.beats[0]!.script).toEqual([
      { op: "show", characterId: "堰纱", expression: "smile" },
      { op: "say", characterId: "堰纱", speaker: "堰纱", text: "谢谢" },
    ]);
  });

  it("parses choices and sequential edges", () => {
    const source = `# 开始
> 帮忙 -> 信任
> 离开

# 信任
堰纱: 多谢`;
    const doc = parseAxs(source);
    expect(doc.beats).toHaveLength(2);
    const choice = doc.beats[0]!.script.find((s) => s.op === "choice");
    expect(choice).toMatchObject({
      op: "choice",
      options: [
        { label: "帮忙", to: "信任" },
        { label: "离开", to: null },
      ],
    });
    expect(doc.edges).toContainEqual({
      from: doc.beats[0]!.id,
      to: doc.beats[1]!.id,
      label: "帮忙",
    });
    expect(doc.edges).toContainEqual({
      from: doc.beats[0]!.id,
      to: doc.beats[1]!.id,
      label: "离开",
    });
  });

  it("parses explicit jump overriding sequential edge", () => {
    const doc = parseAxs(`# A
-> B

# B
旁白

# C`);
    const a = doc.beats[0]!;
    const b = doc.beats[1]!;
    expect(doc.edges).toContainEqual({ from: a.id, to: b.id });
    expect(doc.edges.some((e) => e.from === a.id && e.to === doc.beats[2]!.id)).toBe(
      false,
    );
    expect(doc.edges).toContainEqual({ from: b.id, to: doc.beats[2]!.id });
  });

  it("warns on unknown directive", () => {
    const doc = parseAxs(`# X
@unknown foo`);
    expect(doc.diagnostics.some((d) => d.severity === "warning")).toBe(true);
    expect(doc.beats[0]!.passthrough).toEqual(["@unknown foo"]);
  });

  it("deduplicates beat ids for duplicate titles", () => {
    const doc = parseAxs(`# 重复
旁白

# 重复
旁白2`);
    expect(doc.beats[0]!.id).not.toBe(doc.beats[1]!.id);
    expect(doc.beats[1]!.id).toMatch(/-2$/);
  });
});

describe("printAxs", () => {
  it("prints parsed document", () => {
    const source = `# 雨夜 @stage(公寓)
@bg rain
堰纱: 你好`;
    const printed = printAxs(parseAxs(source));
    expect(printed).toContain("# 雨夜 @stage(公寓)");
    expect(printed).toContain("@bg rain");
    expect(printed).toContain("堰纱: 你好");
  });
});

function normalizeDoc(doc: AxsDocument): unknown {
  return {
    beats: doc.beats.map((b) => ({
      title: b.title,
      stage: b.stage ?? null,
      key: b.key ?? null,
      isEnding: b.isEnding ?? false,
      endingLabel: b.endingLabel ?? null,
      trigger: b.trigger ?? null,
      script: b.script,
      effects: b.effects ?? [],
      jumps: b.jumps ?? [],
    })),
    edges: doc.edges.map((e) => ({
      fromTitle: doc.beats.find((b) => b.id === e.from)?.title,
      toTitle: doc.beats.find((b) => b.id === e.to)?.title,
      label: e.label ?? null,
    })),
  };
}

describe("roundtrip", () => {
  const samples = [
    `# 开场 @stage(街道) [key: s1]
@bg street_day
@bgm theme loop
路人: 天气不错
这是旁白
> 点头
> 摇头 -> 结局

# 结局 [ending: 坏结局]
@flag bad = true
-> 开场`,
    `# A
堰纱(smile): 你好
@hide 堰纱`,
  ];

  for (const sample of samples) {
    it(`parse(print(parse(x))) for sample`, () => {
      const once = parseAxs(sample);
      const printed = printAxs(once);
      const twice = parseAxs(printed);
      expect(normalizeDoc(twice)).toEqual(normalizeDoc(once));
    });
  }
});
