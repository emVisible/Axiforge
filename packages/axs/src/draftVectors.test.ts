import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { draftFromProse, parseAxs, printAxs } from "./index";

/**
 * 共享 golden 向量的 TS 侧 runner（ADR-027）。
 *
 * 这一侧才是「产物是不是合法 AXS」的裁判：Python 没有 canonical 解析器，
 * 用它自己的正则自证等于让被验对象签发自己的合格证。故向量由人手写期望文本，
 * 由 parseAxs 判定合法性，并要求 print 回到自身（canonical 的固定点）。
 */

interface DraftVector {
  name: string;
  title: string;
  prose: string;
  axs: string;
  /**
   * 期望的指令 op 序列。**这一项才是判别力所在**：`【背景 x】` 会作为旁白干净地解析、
   * 并原样回印，所以「无诊断 + 固定点」两条都放过方言。只有断言 op 序列，
   * 才能证明 @指令真的被读成了 bg/bgm/transition，而不是被兜底当文本。
   */
  expected_ops: string[];
  role_names?: string[];
  default_speaker?: string;
}

const VECTOR_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../testdata/axs-draft");

function loadVectors(): DraftVector[] {
  return readdirSync(VECTOR_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(VECTOR_DIR, f), "utf8")) as DraftVector);
}

const vectors = loadVectors();

describe("AXS 演绎向量：Python 产物必须是可解析的 canonical", () => {
  it("向量目录非空（防止 glob 静默无匹配造成假绿）", () => {
    expect(vectors.length).toBeGreaterThanOrEqual(4);
  });

  for (const v of vectors) {
    it(`${v.name}：parse 无诊断、op 序列符合期望、print 回到自身`, () => {
      const doc = parseAxs(v.axs);

      expect(doc.beats).toHaveLength(1);
      expect(doc.diagnostics).toEqual([]);
      // 关键一条：@指令必须真被读成对应 op，而不是被 :568 的兜底当旁白文本
      expect(doc.beats[0]!.script.map((s) => s.op)).toEqual(v.expected_ops);

      // 固定点：canonical 发射器再印一遍必须逐字节相同，否则向量与实现会各自漂移
      expect(printAxs(doc)).toBe(v.axs);

      // 三方锁：TS 内核（桌面离线用）与 Python 规则引擎（web 用）必须产同一份文本，
      // 而这份文本就是向量本身——任何一端偏走，这里就红。
      expect(
        draftFromProse({
          prose: v.prose,
          title: v.title,
          roleNames: v.role_names,
          defaultSpeaker: v.default_speaker,
        }),
      ).toBe(v.axs);
    });
  }
});
