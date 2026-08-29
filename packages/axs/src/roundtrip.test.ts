import { describe, expect, it } from "vitest";
import { parseAxs } from "./parse";
import { printAxs } from "./print";
import { instructionLineForNode } from "../../editor-core/src/projection/axs";
import type { AxsBeat, AxsDocument } from "./types";

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
