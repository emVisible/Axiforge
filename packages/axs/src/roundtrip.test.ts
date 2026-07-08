import { describe, expect, it } from "vitest";
import { parseAxs } from "./parse";
import { printAxs } from "./print";
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
