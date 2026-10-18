import type { Instruction } from "@axiforge/core";
import { describe, expect, it } from "vitest";
import { parseAxs } from "./parse";
import { printAxs } from "./print";
import type { AxsDocument } from "./types";

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
@relation 堰纱.玩家.trust = high
@codex 堰纱.trust = high`);
    const beat = doc.beats[0]!;
    expect(beat.script.map((s) => s.op)).toEqual(["bg", "bgm", "wait"]);
    expect(beat.effects).toEqual([
      { type: "flag", key: "met", value: true },
      { type: "memory", key: "score", value: 10 },
      { type: "character_state", key: "堰纱.mood", value: "calm" },
      { type: "relationship", key: "堰纱.玩家.trust", value: "high" },
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

  /**
   * 2026-10-01 复审新增。这一族与上面那条**不是同一件事**，上面按标题去重、这条按 slug 去重：
   * `Hello World` 与 `hello-world` 是两个不同标题，却共用同一个 slug，所以按标题计数时两者都拿到
   * n=0 ⇒ id 相同。后果不是"id 不好看"，而是**邻接边在投影层退化成自环**：
   * `beatIdToNodeId` 按 beat.id 建键，后者盖掉前者，一段"A 顺序走到 B"变成"B → B"，
   * 而解析侧**零诊断**（实测 `parseAxsToPlan` 出来 `gen-2 → gen-2`）。
   *
   * 分母：docs 的 axs 围栏 + testdata/axs-draft + 测试内联模板串共 33 段、34 条标题，
   * 唯一一处 slug 撞车是本文件下面那条"重复"夹具（同标题那一族，与本族无关）；
   * 三份随包 `.axsp` 的 `axsSource` 是**空串**（叙事在 `nodes` 里），侧分母为 0。
   * 所以今天没有既有作品会亮灯——修的是"下一个作者写下这种标题"的那一类。
   */
  it("不同标题但 slug 相同也要给出不同 id，且邻接边不得退化成自环", () => {
    const doc = parseAxs(`# Hello World
甲: 上路。

# hello-world
乙: 停下。`);

    expect(doc.beats.map((b) => b.id)).toEqual(["hello-world", "hello-world-2"]);
    // 自环是这一族真正的危害：id 撞车在这里才现形
    expect(doc.edges.some((e) => e.from === e.to)).toBe(false);
  });

  it("三个共用同一 slug 的标题按出现顺序编号（序号规则与同名那一族一致）", () => {
    const doc = parseAxs(`# Hello World
甲

# hello-world
乙

# HELLO-WORLD
丙`);
    expect(doc.beats.map((b) => b.id)).toEqual(["hello-world", "hello-world-2", "hello-world-3"]);
  });

  it("slug 去重不得改动同名那一族的既有时序（回归护栏）", () => {
    const same = parseAxs(`# 开场
甲

# 开场
乙`);
    expect(same.beats.map((b) => b.id)).toEqual(["开场", "开场-2"]);
  });

  /**
   * 上面那条修的是**计数器按什么记**；这一条钉住**修完之后的引用仍然指向对的拍**，
   * 因为修复给了第二个 beat 一个作者从没写过的 id（`hello-world-2`），
   * 而 `titleToId` 的匹配优先级是「原始标题先、id 后」——顺序错了就会静默指向第一拍。
   */
  it("slug 去重后往返不变（ADR-016 的 parse(print(beats)) ≡ beats）", () => {
    const src = `# Hello World
甲

# hello-world
> 去第三拍 -> HELLO-WORLD

# HELLO-WORLD
乙`;
    const doc = parseAxs(src, {});
    const back = parseAxs(printAxs(doc), {});

    expect(doc.beats.map((b) => b.id)).toEqual(["hello-world", "hello-world-2", "hello-world-3"]);
    // 打印侧发的是**原始标题**（可读），回读要逐条落回本拍——id 与标题都逐字不变
    expect(back.beats.map((b) => b.id)).toEqual(doc.beats.map((b) => b.id));
    expect(back.beats.map((b) => b.title)).toEqual(doc.beats.map((b) => b.title));
    expect(back.edges).toEqual(doc.edges);
    expect(back.edges.some((e) => e.from === e.to)).toBe(false);
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

describe("同名 Beat 被裸引用时给一条可操作的提示（ADR-016 补记的在册欠账）", () => {
  // 甲走 choice 解析、乙走 jump 解析：两个调用点各自都要报（同拍里 jumps 会 continue 掉 choice 分支，故分开）
  const SOURCE =
    "# 开场\n旁白：第一处。\n\n# 开场\n旁白：第二处。\n\n# 甲\n> 回头 -> 开场\n\n# 乙\n-> 开场\n";

  it("两个调用点各报一条 warning，并把该写成的消歧形式写进文案", () => {
    const doc = parseAxs(SOURCE);
    const hints = doc.diagnostics.filter(
      (d) => d.severity === "warning" && d.message.includes("开场-2"),
    );
    expect(hints).toHaveLength(2);
  });

  it("tie-break 本身一字不改：裸同名标题仍确定性指向第一拍", () => {
    const doc = parseAxs(SOURCE);
    expect(doc.beats.map((b) => b.id)).toEqual(["开场", "开场-2", "甲", "乙"]);
    expect(doc.edges.filter((e) => e.to === "开场")).toHaveLength(2);
  });

  it("标题唯一时不许报（防这条变成天天红的灯）", () => {
    const doc = parseAxs("# 开场\n旁白：只有一处。\n\n# 乙\n-> 开场\n");
    expect(doc.diagnostics.filter((d) => d.message.includes("同名"))).toHaveLength(0);
  });
});

describe("Beat 标题里认不出的方括号要给提示（#79：此前静默忽略）", () => {
  it("写成 [intro] 时不生效，但要说清可用形式", () => {
    const doc = parseAxs("# 第二拍 [intro]\n旁白：说明。\n");
    expect(doc.beats[0]!.key ?? null).toBeNull(); // 语义不变：不认得就是不生效
    const warn = doc.diagnostics.filter((d) => d.message.includes("未识别的 Beat 标记"));
    expect(warn).toHaveLength(1);
    expect(warn[0]!.message).toContain("[key: ");
    expect(warn[0]!.severity).toBe("warning");
  });

  it("三种合法形式都不许报", () => {
    const doc = parseAxs(
      "# A [key: intro]\n旁白。\n\n# B [ending: 真结局]\n旁白。\n\n# C [if: flag.x == true]\n旁白。\n",
    );
    expect(doc.diagnostics.filter((d) => d.message.includes("未识别的 Beat 标记"))).toHaveLength(0);
    expect(doc.beats.map((b) => b.key ?? null)).toEqual(["intro", null, null]);
  });
});

describe("指令取值不在合法集合里时不许静默通过（演出层三族 + 时长）", () => {
  const warns = (src: string, needle: string) =>
    parseAxs(src).diagnostics.filter((d) => d.message.includes(needle));

  it("`@transition` 的未知种类要给出路", () => {
    const doc = parseAxs("# 拍\n@transition banana\n");
    const instr = doc.beats[0]!.script[0]!;
    expect(instr.op === "transition" && instr.kind).toBe("banana"); // 语义不变：值照原样带着
    const w = warns("# 拍\n@transition banana\n", "转场种类");
    expect(w).toHaveLength(1);
    expect(w[0]!.severity).toBe("warning");
    expect(w[0]!.message).toContain("fade / dissolve / wipe / cut");
  });

  it("`@fx` 的未知特效与 `@camera` 的未知动作同形处理", () => {
    expect(warns("# 拍\n@fx disco\n", "特效")).toHaveLength(1);
    expect(warns("# 拍\n@fx disco\n", "特效")[0]!.message).toContain("flash / rain / snow / sakura / none");
    expect(warns("# 拍\n@camera wiggle\n", "镜头动作")).toHaveLength(1);
    expect(warns("# 拍\n@camera wiggle\n", "镜头动作")[0]!.message).toContain("zoom / pan / shake / reset");
  });

  it("`@wait` 的非数字参数要说清按 0 处理，缺参数也要说", () => {
    expect(warns("# 拍\n@wait soon\n", "不是毫秒数")).toHaveLength(1);
    expect(warns("# 拍\n@wait\n", "缺少毫秒数")).toHaveLength(1);
    expect(parseAxs("# 拍\n@wait soon\n").beats[0]!.script[0]!.op).toBe("wait");
  });

  it("`@camera zoom` 的缩放比非数字时也要说", () => {
    expect(warns("# 拍\n@camera zoom big\n", "缩放比")).toHaveLength(1);
    // 语义那一半也有变化，说清楚：旧代码把 `parseFloat("big") = NaN` 原样塞进 IR，
    // 而 NaN 进不了 JSON、打印时会变成字面量 "NaN"；现在它不进 IR，只留一条 warning。
    const instr = parseAxs("# 拍\n@camera zoom big\n").beats[0]!.script[0]!;
    expect(instr.op === "camera" && "scale" in instr).toBe(false);
    expect(printAxs(parseAxs("# 拍\n@camera zoom big\n"))).not.toContain("NaN");
  });

  it("文档里给过的写法一条都不许报（对照组）", () => {
    const doc = parseAxs(
      [
        "# 拍",
        "@transition fade 400",
        "@fx rain",
        "@camera zoom 1.2",
        "@wait 500",
        "@bgm rain loop",
        "@show 堰纱 smile left",
      ].join("\n") + "\n",
    );
    expect(
      doc.diagnostics.filter(
        (d) => /转场种类|特效|镜头动作|毫秒数|缩放比/.test(d.message),
      ),
    ).toEqual([]);
    expect(doc.beats[0]!.script.map((i) => i.op)).toEqual([
      "transition",
      "fx",
      "camera",
      "wait",
      "bgm",
      "show",
    ]);
  });
});

describe("对白分隔符只认半角冒号（这条规则此前只写在 ADR-027，用户文档与判据都没有）", () => {
  it("全角冒号的行整行变成旁白，说话人不会被猜出来", () => {
    const doc = parseAxs("# 拍\n堰纱：你来了。\n");
    const script = doc.beats[0]!.script;
    expect(script.map((i) => i.op)).toEqual(["narration"]);
    // 玩家端会看到连前缀一起的整行文本——这是当前契约，不是"反正会被剥掉"
    expect(script[0]!.op === "narration" && script[0]!.text).toBe("堰纱：你来了。");
  });

  it("半角冒号才生成 say（对照组，同时也是文档教的那种写法）", () => {
    const doc = parseAxs("# 拍\n堰纱: 你来了。\n");
    const script = doc.beats[0]!.script;
    expect(script.map((i) => i.op)).toEqual(["say"]);
    expect(script[0]!.op === "say" && script[0]!.speaker).toBe("堰纱");
  });
});

describe("说话人解不出来时不许印成 `: 台词`（发射器的产物必须能被回读）", () => {
  const docOf = (script: Instruction[]) => ({
    beats: [{ id: "x", title: "测试", line: 1, script }],
    edges: [],
    diagnostics: [],
  });

  it("空说话人的 say 按旁白那一支印出去，回读不再带冒号前缀", () => {
    const printed = printAxs(docOf([{ op: "say", text: "你来了。" }]));
    expect(printed).toBe("# 测试\n你来了。\n");
    expect(printed).not.toContain(": 你来了。");
    const back = parseAxs(printed).beats[0]!.script;
    expect(back.map((i) => i.op)).toEqual(["narration"]);
    expect(back[0]!.op === "narration" && back[0]!.text).toBe("你来了。");
  });

  it("`speaker` 是空串时同样处理（编排台「+ 台词」造的就是空说话人）", () => {
    expect(printAxs(docOf([{ op: "say", speaker: "", text: "在" }]))).toBe("# 测试\n在\n");
  });

  it("对照组：有说话人仍印 `名: 台词`，回读还是 say", () => {
    const printed = printAxs(docOf([{ op: "say", speaker: "堰纱", text: "你来了。" }]));
    expect(printed).toBe("# 测试\n堰纱: 你来了。\n");
    expect(parseAxs(printed).beats[0]!.script.map((i) => i.op)).toEqual(["say"]);
  });
});
