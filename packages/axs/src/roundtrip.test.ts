import { describe, expect, it } from "vitest";
import type { Instruction } from "@axiforge/core";
import { parseAxs } from "./parse";
import { printAxs } from "./print";
import { instructionLineForNode } from "../../editor-core/src/projection/axs";
import type { AxsBeat, AxsDiagnostic, AxsDocument } from "./types";

function structuralKey(doc: AxsDocument) {
  const titleOf = (id: string) => doc.beats.find((b) => b.id === id)?.title ?? id;
  return JSON.stringify({
    beats: doc.beats.map((b: AxsBeat) => ({
      title: b.title,
      stage: b.stage ?? null,
      key: b.key ?? null,
      ending: b.endingLabel ?? null,
      trigger: b.trigger ?? null,
      scriptOps: b.script.map((s) => s.op),
      effects: b.effects ?? [],
      jumps: b.jumps ?? [],
    })),
    edges: doc.edges.map((e) => ({
      from: titleOf(e.from),
      to: titleOf(e.to),
      label: e.label ?? null,
    })),
  });
}

describe("instruction-level lineMap（ADR-025 指令级锚点）", () => {
  it("每条指令都有对应的源行号", () => {
    const source = `# 开始
@bg 教室
凛九: 你好。
\旁白内容`;
    const doc = parseAxs(source);
    const beat = doc.beats[0]!;
    expect(beat.lineMap).toBeDefined();
    expect(beat.lineMap).toEqual([2, 3, 4]);
  });

  it("show+say 合写占同一行", () => {
    const source = `# 开始
凛九(smile): 你好。`;
    const doc = parseAxs(source);
    const beat = doc.beats[0]!;
    // show + say 两条指令，均来自第 2 行
    expect(beat.script.length).toBe(2);
    expect(beat.lineMap).toEqual([2, 2]);
  });

  it("instructionLineForNode 返回指令级行号", () => {
    const source = `# 开始
@bg 教室
凛九: 你好。`;
    const doc = parseAxs(source);
    const beat = doc.beats[0]!;
    const line = instructionLineForNode(source, {}, beat.id, 1, undefined);
    expect(line).toBe(3);
  });

  it("lineMap 缺失时回退到 beat 标题行号", () => {
    const source = `# 开始
凛九: 你好。`;
    const doc = parseAxs(source);
    // 手动删除 lineMap 模拟旧数据
    const beat = doc.beats[0]!;
    delete (beat as any).lineMap;
    const line = instructionLineForNode(source, {}, beat.id, 0, undefined);
    expect(line).toBe(2);
  });
});

describe("roundtrip relation（RN 关系）", () => {
  it("relation effect and condition round-trip", () => {
    const source = `# 开始
@relation 堰纱.玩家.trust = high
堰纱: 你好`;
    const doc = parseAxs(source);
    expect(doc.beats[0]!.effects).toEqual([{ type: "relationship", key: "堰纱.玩家.trust", value: "high" }]);
    const round = parseAxs(printAxs(doc));
    expect(round.beats[0]!.effects).toEqual(doc.beats[0]!.effects);

    const source2 = `# 信任 [if: relation.堰纱.玩家.trust == high]
堰纱(smile): 谢谢`;
    const doc2 = parseAxs(source2);
    expect(doc2.beats[0]!.trigger).toEqual({ type: "relationship", key: "堰纱.玩家.trust", operator: "eq", value: "high" });
    const round2 = parseAxs(printAxs(doc2));
    expect(round2.beats[0]!.trigger).toEqual(doc2.beats[0]!.trigger);
  });
});

describe("roundtrip structural equivalence", () => {
  it("empty choice options remain choice instructions", () => {
    const source = "# 开始\n>\n";
    const printed = printAxs(parseAxs(source));
    const round = parseAxs(printed);

    expect(printed).toBe(source);
    expect(round.beats[0]!.script).toEqual([
      { op: "choice", options: [{ label: "", to: null }] },
    ]);
    expect(round.diagnostics).toEqual([]);
  });

  it("choice target node IDs print as Beat titles and parse back to edges", () => {
    const sourceId = "11111111-1111-4111-8111-111111111111";
    const targetId = "22222222-2222-4222-8222-222222222222";
    const doc: AxsDocument = {
      beats: [
        {
          id: sourceId,
          title: "抉择",
          line: 1,
          script: [{ op: "choice", options: [{ label: "向东", to: targetId }] }],
        },
        {
          id: targetId,
          title: "东方",
          line: 4,
          script: [{ op: "narration", text: "抵达东方。" }],
        },
      ],
      edges: [{ from: sourceId, to: targetId, label: "向东" }],
      diagnostics: [],
    };

    const source = printAxs(doc);
    const round = parseAxs(source);

    expect(source).toContain("> 向东 -> 东方");
    expect(round.diagnostics).toEqual([]);
    expect(round.edges).toEqual([
      { from: "抉择", to: "东方", label: "向东" },
    ]);
  });

  it("同名 Beat 的 choice 目标必须打印成消歧后的 id，回读不许落到第一个", () => {
    const sourceId = "33333333-3333-4333-8333-333333333333";
    const firstSameTitle = "44444444-4444-4444-8444-444444444444";
    const secondSameTitle = "55555555-5555-4555-8555-555555555555";
    const doc: AxsDocument = {
      beats: [
        {
          id: sourceId,
          title: "抉择",
          line: 1,
          script: [
            { op: "choice", options: [{ label: "向东", to: secondSameTitle }] },
          ],
        },
        {
          id: firstSameTitle,
          title: "开场",
          line: 4,
          script: [{ op: "narration", text: "第一个开场。" }],
        },
        {
          id: secondSameTitle,
          title: "开场",
          line: 7,
          script: [{ op: "narration", text: "第二个开场。" }],
        },
      ],
      edges: [{ from: sourceId, to: secondSameTitle, label: "向东" }],
      diagnostics: [],
    };

    const printed = printAxs(doc);
    const round = parseAxs(printed);

    // 只印标题会撞名：解析侧按标题唯一匹配，第二个「开场」永远指不到
    expect(printed).toContain("> 向东 -> 开场-2");
    expect(round.diagnostics).toEqual([]);
    expect(round.edges).toEqual([
      { from: "抉择", to: "开场-2", label: "向东" },
      // 相邻 Beat 之间的隐式顺承边（解析器既有规则），与分支边并存
      { from: "开场", to: "开场-2" },
    ]);
  });

  it("裸同名标题按出现顺序确定性地指向第一个（同名消歧规则的另一半）", () => {
    const source = [
      "# 抉择",
      "> 向东 -> 开场",
      "# 开场",
      "第一个开场。",
      "# 开场",
      "第二个开场。",
      "",
    ].join("\n");

    const round = parseAxs(source);

    // assignBeatIds 的规则：第一个同名拿裸 slug、后续加 -N，所以 `-> 开场` 的含义是确定的（第一个）。
    // 2026-10-01：这条确定性不再"无声"——ADR-016 补记登记的欠账在此清偿，报一条把消歧写法送到眼前的 warning。
    // 语义仍由下面两条断言钉住；这里改成断言"确实有提示"，而不是删掉这条历史断言。
    expect(round.beats.map((b) => b.id)).toEqual(["抉择", "开场", "开场-2"]);
    expect(round.diagnostics).toEqual([
      {
        line: 1,
        severity: "warning",
        message: "同名 Beat「开场」有 2 处，这里指向第 1 个；要指向第 2 个请写「开场-2」",
      },
    ]);
    expect(round.edges).toEqual([
      { from: "抉择", to: "开场", label: "向东" },
      { from: "开场", to: "开场-2" },
    ]);
  });

  it("显式跳转行同样能吃下同名消歧形式 `-> 标题-2`", () => {
    const source = [
      "# 抉择",
      "-> 开场-2",
      "",
      "# 开场",
      "第一个开场。",
      "",
      "# 开场",
      "第二个开场。",
      "",
    ].join("\n");

    const round = parseAxs(source);

    expect(round.beats.map((b) => b.id)).toEqual(["抉择", "开场", "开场-2"]);
    expect(round.diagnostics).toEqual([]);
    // 抉择显式跳第二个；第一个「开场」按既有规则顺承到下一个桥段
    expect(round.edges).toContainEqual({ from: "抉择", to: "开场-2" });
    // 打印侧对 jumps 原样回写，不把它退化成裸标题（那会指回第一个）
    expect(printAxs(round)).toContain("-> 开场-2");
  });

  it("full showcase script", () => {
    const source = `# 雨夜 @stage(公寓) [key: intro]
@bg apartment_rain
@bgm rain_piano loop
@wait 300
堰纱: ……你为什么会来这里？
> 我来帮你 -> 信任
> 只是路过

# 信任 [ending: 信任结局]
@codex 堰纱.trust = high
堰纱(smile): ……谢谢。我会记住今晚。`;

    const doc = parseAxs(source);
    const round = parseAxs(printAxs(doc));
    expect(structuralKey(round)).toBe(structuralKey(doc));
  });

  it("print is idempotent on canonical output", () => {
    const source = `# One
@bg x
> A -> Two

# Two
旁白`;
    const once = printAxs(parseAxs(source));
    const twice = printAxs(parseAxs(once));
    expect(twice).toBe(once);
  });
});

describe("一个 Beat 放两个分支组：文本层今天只留第一组（已登记待决，不是遗漏）", () => {
  // 界面上没有任何守卫：`ScriptEditor.tsx:81` 的 `add(op)` 就是 `[...script, defaultInstruction(op)]`，
  // 连点两次「分支」就会得到两个 choice 指令。而 `printBeatBody` 用 `script.find(op === "choice")` 只取第一个，
  // 第二个组连同它的选项一起消失——违反 ADR-016 质量要求 `parse(print(beats)) ≡ beats`，且没有任何诊断。
  // 这条断言钉的是**当前实态**：三种修法（合并成一组 / 扩语法支持多组 / 发射侧给诊断）都属产品决策，
  // 定档之后要**改写**这条断言而不是删掉它（它同时是"这条曾经会丢"的凭据）。
  const two = [
    { op: "choice", options: [{ label: "左", to: null }] },
    { op: "choice", options: [{ label: "右", to: null }] },
  ] as unknown as Instruction[];

  it("第二个分支组不出现在打印结果里", () => {
    const doc: AxsDocument = {
      beats: [{ id: "x", title: "测试", line: 1, script: two }],
      edges: [],
      diagnostics: [],
    };
    const printed = printAxs(doc);
    expect(printed).not.toContain("右");
    expect(parseAxs(printed).beats[0]!.script.filter((i) => i.op === "choice")).toHaveLength(1);
  });
});

describe("发射侧诊断：第二组分支被丢掉时要说出口，但文本一字不变", () => {
  /*
   * 上一段那条特征化断言钉的是"会丢"；这一段钉的是"丢了必须说出来"，两头成对：
   * ① 诊断要有（含拍名、丢了几组、几个选项、行号）；② **输出文本必须与不带诊断时逐字相同**——
   * 语义不由发射器单方面改（合并成一组＝改叙事语义、扩语法＝动语法冻结面，两条都还在待决清单里）。
   * 变异证据见 §4：把这段 push 删掉 ⇒ 三条全红；让发射器顺手把第二组也印出来 ⇒ "文本不变"那条红。
   */
  const group = (label: string) => ({ op: "choice", options: [{ label, to: null }] });
  const docOf = (script: unknown[]) =>
    ({ beats: [{ id: "x", title: "测试", line: 1, script }], edges: [], diagnostics: [] }) as AxsDocument;

  it("两组分支：一条 warning，且带诊断的输出与不带的逐字相同", () => {
    const two = [group("左"), group("右")] as unknown as Instruction[];
    const plain = printAxs(docOf(two));
    const diagnostics: AxsDiagnostic[] = [];
    const withDiag = printAxs(docOf(two), { diagnostics });
    expect(withDiag).toBe(plain);
    expect(withDiag).not.toContain("右");
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe("warning");
    expect(diagnostics[0]?.message).toContain("2 组分支");
    expect(diagnostics[0]?.message).toContain("1 个选项");
    expect(diagnostics[0]?.line).toBe(1);
  });

  it("只有一组分支时不许响（否则每条正常剧本都会带一条噪音 warning）", () => {
    const diagnostics: AxsDiagnostic[] = [];
    printAxs(docOf([group("只有一个")]), { diagnostics });
    expect(diagnostics).toEqual([]);
  });

  it("行号要落在真正出问题那一拍上（多拍文档）", () => {
    const doc = {
      beats: [
        { id: "a", title: "第一拍", line: 1, script: [] },
        {
          id: "b",
          title: "第二拍",
          line: 2,
          script: [group("左"), group("右"), group("再一个")] as unknown as Instruction[],
        },
      ],
      edges: [],
      diagnostics: [],
    } as unknown as AxsDocument;
    const diagnostics: AxsDiagnostic[] = [];
    const printed = printAxs(doc, { diagnostics });
    expect(diagnostics).toHaveLength(1);
    const line = diagnostics[0]?.line ?? 0;
    expect(printed.split("\n")[line - 1]).toContain("# 第二拍");
    expect(diagnostics[0]?.message).toContain("3 组分支");
    expect(diagnostics[0]?.message).toContain("2 个选项");
  });
});
