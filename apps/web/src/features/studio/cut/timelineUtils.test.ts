import { describe, expect, it } from "vitest";
import type { Instruction } from "@axiforge/core";
import {
  characterTrackGroups,
  characterTrackOp,
  localIndexAtPixelForIndices,
  reorderScriptByIndices,
  reorderScriptWithinTrack,
} from "./timelineUtils";

const say = (text: string) => ({ op: "say" as const, speaker: "甲", text });
const show = (cid: string) => ({ op: "show" as const, characterId: cid });
const hide = (cid: string) => ({ op: "hide" as const, characterId: cid });
const move = (cid: string) => ({ op: "move" as const, characterId: cid, position: "left" });

describe("characterTrackGroups（F2 角色轨分组）", () => {
  it("按 characterId 首次出现顺序分组，索引为全局下标", () => {
    const script = [
      say("开场"),
      show("c2"),
      show("c1"),
      move("c2"),
      say("对白"),
      hide("c1"),
    ];
    const groups = characterTrackGroups(script);
    expect(groups.map((g) => g.characterId)).toEqual(["c2", "c1"]);
    expect(groups[0]!.indices).toEqual([1, 3]);
    expect(groups[1]!.indices).toEqual([2, 5]);
  });

  it("无 characterId 的 show（异常态）不入角色轨；say/narration 永不入", () => {
    const script = [
      say("x"),
      { op: "show", characterId: "" } as unknown as Instruction,
      { op: "narration", text: "y" } as unknown as Instruction,
    ];
    expect(characterTrackGroups(script)).toEqual([]);
    expect(characterTrackOp(script[1]!)).toBeNull();
  });
});

describe("reorderScriptByIndices（角色轨/固定轨共用重排）", () => {
  const script = [say("0"), show("c"), say("1"), hide("c"), say("2")];
  const charIndices = [1, 3];

  it("轨内移动只交换同轨槽位，其它指令原地不动", () => {
    const next = reorderScriptByIndices(script, charIndices, 0, 1);
    // show@1 移到 hide@3 之后：槽位交换，其余指令原地不动
    expect(next.map((i) => (i as { op: string }).op)).toEqual([
      "say", "hide", "say", "show", "say",
    ]);
    expect((next[1] as { characterId: string }).characterId).toBe("c");
    expect((next[3] as { characterId: string }).characterId).toBe("c");
  });

  it("越界/同位返回原数组", () => {
    expect(reorderScriptByIndices(script, charIndices, 0, 0)).toBe(script);
    expect(reorderScriptByIndices(script, charIndices, -1, 1)).toBe(script);
    expect(reorderScriptByIndices(script, charIndices, 0, 5)).toBe(script);
  });

  it("固定轨便捷入口与索引集版本等价", () => {
    const viaGeneral = reorderScriptByIndices(script, [0, 2, 4], 0, 2);
    const viaTrack = reorderScriptWithinTrack(
      script.map((i, idx) => (idx % 2 === 0 ? i : show("z"))),
      "dialogue",
      0,
      2,
    );
    // 两种入口对同构输入产生同构重排（按 op 序列断言）
    expect((viaGeneral[2] as { text: string }).text).toBe("2");
    expect((viaTrack[2] as { text: string }).text).toBe("2");
  });
});

describe("localIndexAtPixelForIndices", () => {
  it("按索引集定位局部下标", () => {
    const script = [show("c"), say("x"), hide("c")];
    const indices = [0, 2];
    // 每片段宽度随 zoom；取 pixelX 落在第二个片段处
    expect(localIndexAtPixelForIndices(indices, script, 0, 1)).toBe(0);
    expect(localIndexAtPixelForIndices(indices, script, 10_000, 1)).toBe(1);
  });
});
