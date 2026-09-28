import { describe, expect, it } from "vitest";

import type { EngineCalibration, ModerationVocabulary } from "@/api/adminClient";
import {
  EMPTY_VOCABULARY,
  actionLabel,
  calibrationSummary,
  clauseLabel,
  engineSilenceNote,
  maskToken,
  questionLabel,
  suggestionLabel,
  viaLabel,
  whatIfSampleNote,
  whatIfVerdict,
} from "@/lib/moderation";

/** 后端 `/admin/moderation/vocabulary` 那份投影的测试替身（取值域一致，措辞同源）。 */
const VOCAB: ModerationVocabulary = {
  clauses: { spam_promotion: "导流垃圾", doxxing: "真人隐私", rating_mismatch: "分级不符" },
  suggestions: { spam_promotion: "导流垃圾", none: "无问题" },
  rules: { high_severity: "危害量级偏高", spam_only: "导流垃圾" },
  actions: { approve: "自动通过", reject: "自动驳回", human_review: "转人工" },
  questions: { severity: "危害量级", pii_real_person: "真人隐私", age_rating: "年龄分级" },
  human_only_clauses: ["doxxing"],
  policy_version: "policy-1",
  questions_version: "questions-3",
};

const calib = (over: Partial<EngineCalibration>): EngineCalibration => ({
  engine: "laya:sidecar",
  reachable: true,
  declared: ["age_rating", "pii_real_person", "severity"],
  covered: ["age_rating", "pii_real_person", "severity"],
  missing: [],
  temperatures: {},
  grid_max: 20,
  censored: [],
  path: "",
  error: "",
  ...over,
});

describe("via 的中文展开", () => {
  it("每种前缀都换成人话，并保留数字与条款名", () => {
    expect(viaLabel(VOCAB, "auto@policy-1/comment")).toBe("自动执行（线 policy-1/comment）");
    expect(viaLabel(VOCAB, "below_approve_line 0.77<0.90")).toBe("低于通过线（0.77<0.90）");
    expect(viaLabel(VOCAB, "below_reject_line 0.80<0.95")).toBe("低于驳回线（0.80<0.95）");
    expect(viaLabel(VOCAB, "engine_error:timeout")).toBe("引擎异常，转人工");
    expect(viaLabel(VOCAB, "human_only_clause:doxxing")).toBe(
      "命中需人工判断的条款：真人隐私",
    );
    expect(viaLabel(VOCAB, "suggested_human:high_severity")).toBe("规则建议人工：危害量级偏高");
  });

  it("超窗拒绝与未标定是两件事，措辞不许混", () => {
    // 混起来的后果是有人去重拟温度表，而真正要做的可能是把长文分段。
    expect(viaLabel(VOCAB, "refusal:over_length:7003>6000")).toBe(
      "正文超出模型窗口（7003>6000），不做截断后自动裁决",
    );
    expect(viaLabel(VOCAB, "refusal:no_checkpoint")).toBe("引擎拒绝自动执行：no_checkpoint");
    expect(viaLabel(VOCAB, "uncalibrated")).toBe("置信度未校准，不自动执行");
  });

  it("词表里没有的 id 落回原样，不编一个中文名", () => {
    // 这是可见的缺口：接口挂了要看得见，而不是被一句兜底文案盖住。
    expect(clauseLabel(VOCAB, "hate_incitement")).toBe("hate_incitement");
    expect(viaLabel(VOCAB, "human_only_clause:hate_incitement")).toBe(
      "命中需人工判断的条款：hate_incitement",
    );
    expect(viaLabel(EMPTY_VOCABULARY, "suggested_human:spam_only")).toBe(
      "规则建议人工：spam_only",
    );
    expect(questionLabel(EMPTY_VOCABULARY, "pii_real_person")).toBe("pii_real_person");
  });

  it("整份词表为空时也照常工作（首帧/离线）", () => {
    expect(clauseLabel(EMPTY_VOCABULARY, "spam_promotion")).toBe("spam_promotion");
    expect(actionLabel(EMPTY_VOCABULARY, "reject")).toBe("reject");
    expect(suggestionLabel(EMPTY_VOCABULARY, "none")).toBe("none");
  });

  it("空值与未知 via 不假装成功", () => {
    expect(viaLabel(VOCAB, "")).toBe("—");
    expect(actionLabel(VOCAB, "")).toBe("—");
    expect(actionLabel(VOCAB, "human_review")).toBe("转人工");
    expect(viaLabel(VOCAB, "brand_new_reason")).toBe("brand_new_reason");
  });
});

describe("温度表覆盖面的三态", () => {
  it("全绿只在既覆盖满又没有顶格时出现", () => {
    expect(calibrationSummary(VOCAB, calib({}))).toEqual({
      text: "标定 3/3 题",
      tone: "ok",
    });
  });

  it("缺题与顶格都是 warn，但说的是两件下一步（重拟 vs 放宽网格）", () => {
    const missing = calibrationSummary(
      VOCAB,
      calib({ covered: ["age_rating"], missing: ["pii_real_person", "severity"] }),
    );
    expect(missing.tone).toBe("warn");
    expect(missing.text).toBe("标定 1/3 题，缺 真人隐私、危害量级");

    const censored = calibrationSummary(VOCAB, calib({ censored: ["severity"] }));
    expect(censored.tone).toBe("warn");
    expect(censored.text).toContain("拟合触到网格上限");
    expect(censored.text).toContain("危害量级");
  });

  it("取不到覆盖面是 error：此时整链不可执行，不能显示成没问题", () => {
    const down = calibrationSummary(VOCAB, calib({ reachable: false, error: "RuntimeError" }));
    expect(down.tone).toBe("error");
    expect(down.text).toBe("laya:sidecar 标定状态取不到（RuntimeError）");
  });

  it("长列表点名到第三条为止，其余只报数量", () => {
    const many = calibrationSummary(
      VOCAB,
      calib({
        declared: Array.from({ length: 10 }, (_, i) => `q${i}`),
        covered: ["q0"],
        missing: Array.from({ length: 9 }, (_, i) => `q${i + 1}`),
      }),
    );
    expect(many.text).toContain("共 9 题");
    expect(many.text).toContain("q1、q2、q3");
    expect(many.text).not.toContain("q9");
  });
});

describe("阈值假设的读数", () => {
  const base = { conflicts: 0, auto_approve: 0, auto_reject: 0, undecided: 0 };

  it("有误放就是 danger，且报出条数", () => {
    const v = whatIfVerdict({ ...base, auto_approve: 3, conflicts: 1 });
    expect(v.tone).toBe("danger");
    expect(v.text).toContain("1 条");
  });

  it("没有一条会被执行时读作 ok，而不是留一片空白", () => {
    expect(whatIfVerdict(base).tone).toBe("ok");
    expect(whatIfVerdict(base).text).toContain("没有案件会被自动执行");
  });

  it("会自动执行但缺人工对照时是 warn，不是 ok", () => {
    // 压成布尔就会有人去下调阈值而不是去攒处置——这两件事的下一步完全相反。
    const v = whatIfVerdict({ ...base, auto_approve: 2, undecided: 5 });
    expect(v.tone).toBe("warn");
    expect(v.text).toContain("2 条");
    expect(v.text).toContain("5 条还没有人工结论");
  });

  it("会自动执行且与人工全部一致才是 ok", () => {
    expect(whatIfVerdict({ ...base, auto_reject: 2 }).tone).toBe("ok");
  });

  it("样本被窗口截断时，读数要连着样本量一起说", () => {
    // 真机量到的形状：默认只看最新 500 条，而队列有 900+ 条待处置。
    const n = whatIfSampleNote({ scanned: 500, population: 950 });
    expect(n).toContain("全库 950 条");
    expect(n).toContain("只取最新 500 条");
  });

  it("全都扫过了就不许再挂一句「只取最新」——那是假的心虚", () => {
    expect(whatIfSampleNote({ scanned: 950, population: 950 })).toBe("");
    expect(whatIfSampleNote({ scanned: 12, population: 12 })).toBe("");
  });
});

describe("举报人凭据的显示", () => {
  it("长 token 只留尾 8 位，绝不整段回显", () => {
    expect(maskToken("dev-admin-very-long-secret-token")).toBe("…et-token");
    expect(maskToken("abcdefghij")).toBe("…cdefghij");
    expect(maskToken("short")).toBe("short");
    expect(maskToken(null)).toBe("匿名");
  });
});

describe("引擎没答话的那行依据", () => {
  // 2026-09-27 真机 sidecar 崩溃时落库的原文（案件 154973d5 的依据末行）
  const reasons = [
    "model=multilingual",
    "规则「仇恨 / 隐私 / 违法教程」→ 自动驳回 置信 0.98",
    "laya:sidecar 未答话：sidecar 不可达：URLError",
  ];

  it("能把权威引擎没答话读出来，并带上它为什么没说", () => {
    expect(engineSilenceNote(reasons)).toBe("laya:sidecar 未答话：sidecar 不可达：URLError");
  });

  it("健康案件的依据里读不出东西来——不许把正常结论误报成引擎死了", () => {
    expect(engineSilenceNote(["model=multilingual", "temperature fitted"])).toBe("");
    expect(engineSilenceNote(undefined)).toBe("");
  });
});
