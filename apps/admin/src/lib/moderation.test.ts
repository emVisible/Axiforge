import { describe, expect, it } from "vitest";

import type {
  EngineCalibration,
  LabelTargetAxis,
  ModerationVocabulary,
  RequeueStatus,
} from "@/api/adminClient";
import {
  EMPTY_VOCABULARY,
  actionLabel,
  answerDisplay,
  axisSortNote,
  calibrationSummary,
  clauseLabel,
  humanClausesPayload,
  initialTruth,
  engineSilenceNote,
  labelAxisNote,
  maskToken,
  questionLabel,
  requeueSummary,
  stalenessSummary,
  suggestionLabel,
  viaLabel,
  whatIfEvidenceNote,
  whatIfSampleNote,
  whatIfVerdict,
} from "@/lib/moderation";

/** 后端 `/admin/moderation/vocabulary` 那份投影的测试替身（取值域一致，措辞同源）。 */
const VOCAB: ModerationVocabulary = {
  clauses: { spam_promotion: "导流垃圾", doxxing: "真人隐私", rating_mismatch: "分级不符" },
  axis_clauses: ["doxxing", "spam_promotion"],
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
  flattened: [],
  flattening_reported: true,
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

describe("温度表覆盖面的几种读法", () => {
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

  it("题数齐但其中有轴打不过常数预测器——不许显示成标定完成", () => {
    // D25 实测：34 行标注下 8/10 题没有判断力，而覆盖面仍是 10/10。
    // approve 的置信度是各轴取 min，所以这些轴正在否决自动通道。
    const flat = calibrationSummary(
      VOCAB,
      calib({ flattened: ["pii_real_person", "severity"], censored: ["pii_real_person"] }),
    );
    expect(flat.tone).toBe("warn");
    expect(flat.text).toContain("打不过常数预测器");
    expect(flat.text).toContain("真人隐私、危害量级");
    expect(flat.text).toContain("3/3 题");
    // 两类缺口各自的下一步不同（补标注 vs 放宽网格），命中两个时不许只说一个
    expect(flat.text).toContain("另有 1 题触到网格上限");
  });

  it("旧温度表没上报判断力时也不是绿灯：看不见 ≠ 没问题", () => {
    const old = calibrationSummary(VOCAB, calib({ flattening_reported: false }));
    expect(old.tone).toBe("warn");
    expect(old.text).toContain("没上报判断力");
    const missingKey = calibrationSummary(VOCAB, {
      ...calib({}), flattening_reported: undefined,
    });
    expect(missingKey.tone).toBe("warn");
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

  it("可回放条数与不同内容数不一致时，要说清真正的分母", () => {
    // dev 库实测：292 条可回放只对应 32 篇不同稿子
    expect(whatIfEvidenceNote({ evaluated: 292, distinct_contents: 32 }))
      .toContain("不同内容仅 32 篇");
  });

  it("一条案件一篇稿子时不报这句——不许制造假的怀疑", () => {
    expect(whatIfEvidenceNote({ evaluated: 32, distinct_contents: 32 })).toBe("");
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

describe("批量重判的读数", () => {
  const base: RequeueStatus = {
    running: false, queued: 150, judged: 1, lexicon_only: 147, would_close: 0,
    no_content: 2, no_case: 0, failed: 0, cancelled: false,
  };

  it("跑完了但绝大多数只有词表说话，不许报绿——那次就是 147/150 被算成判完", () => {
    const s = requeueSummary(base);
    expect(s.tone).toBe("warn");
    expect(s.text).toContain("模型答了 1 条");
    expect(s.text).toContain("147 条只有词表说话");
  });

  it("模型真答了话才是绿的 ok，且过门的要说明还没结案", () => {
    const s = requeueSummary({ ...base, judged: 140, lexicon_only: 0, would_close: 3 });
    expect(s.tone).toBe("ok");
    expect(s.text).toContain("3 条已过门（未结案，等人确认）");
  });

  it("一条都没答话时不是 ok；失败则直接是 danger", () => {
    expect(requeueSummary({ ...base, judged: 0, lexicon_only: 150 }).tone).toBe("warn");
    expect(requeueSummary({ ...base, judged: 0, lexicon_only: 0, failed: 9 }).tone).toBe("danger");
    expect(requeueSummary({ ...base, running: true }).tone).toBe("running");
    expect(requeueSummary({ ...base, queued: 0 }).text).toBe("还没跑过批量重判");
  });
});

describe("类型化答案的显示", () => {
  // 2026-09-28 从真库的一条案件里抄下来的三种形状（键按题型分，没有统一的 value）
  it("noul / score / choice 各自读自己的键，数字保留两位", () => {
    expect(answerDisplay({ type: "noul", noul: 0.08619228209583947 })).toEqual({
      text: "0.09",
      legacy: false,
    });
    expect(answerDisplay({ type: "score", score: 1.000922232363851 })).toEqual({
      text: "1.00",
      legacy: false,
    });
    expect(answerDisplay({ type: "choice", choice: "all" })).toEqual({
      text: "all",
      legacy: false,
    });
  });

  it("读不到该题型的键时显示「—」而不是 undefined——依据表不能整列空白", () => {
    // 这正是旧代码的失败形状：它读 `a.value`，而快照里从来没这个键
    expect(answerDisplay({ type: "noul" })).toEqual({ text: "—", legacy: false });
    expect(answerDisplay(undefined)).toEqual({ text: "—", legacy: false });
  });

  it("题集 D13 前的 {type,value} 行照样报出取值，并标出是旧形状", () => {
    // 这一屏的职责是"核对机器说了什么"，旧行显示「—」等于把话藏起来。
    // 实测 dev 库里三种形状并存（新形状 389/400，旧形状 11 条）。
    expect(answerDisplay({ type: "noul", value: 0.086 } as never)).toEqual({
      text: "0.09",
      legacy: true,
    });
    expect(answerDisplay({ type: "choice", value: "all" } as never)).toEqual({
      text: "all",
      legacy: true,
    });
  });

  it("题型本身不认识就不兜底：坏数据不该被戴上「旧形状」这个来源", () => {
    expect(answerDisplay({ type: "weird", value: 1 } as never)).toEqual({
      text: "—",
      legacy: false,
    });
  });
});

describe("标注配额的逐轴读数", () => {
  const axis = (over: Partial<LabelTargetAxis> = {}): LabelTargetAxis => ({
    question: "pii_real_person",
    informative: false,
    pending_candidates: 492,
    distinct_candidates: 24,
    label_samples: 2,
    label_positives: 1,
    label_explicit: 1,
    top: [
      { case_id: "c1", subject_type: "comment", subject_id: "s1", state: "pending",
        probability: 0.62, has_raw: true },
      { case_id: "c2", subject_type: "comment", subject_id: "s2", state: "pending",
        probability: 0.41, has_raw: false },
    ],
    ...over,
  });

  it("三种判断力状态说的是三件不同的下一步，压成一个布尔就会标错轴", () => {
    expect(labelAxisNote(VOCAB, axis()).text).toContain("打不过常数预测器");
    expect(labelAxisNote(VOCAB, axis()).tone).toBe("warn");
    expect(labelAxisNote(VOCAB, axis({ informative: true })).text).toContain("已有判断力");
    expect(labelAxisNote(VOCAB, axis({ informative: null })).text).toContain("判断力未上报");
    // 题名走词汇表，不印内部 id
    expect(labelAxisNote(VOCAB, axis()).text).toContain("真人隐私");
    expect(labelAxisNote(VOCAB, axis()).text).not.toContain("pii_real_person");
  });

  it("可拟样本三条数一起报：处置过 ≠ 拟合用得上，勾过 ≠ 沿用机器条款", () => {
    const text = labelAxisNote(VOCAB, axis()).text;
    expect(text).toContain("可拟样本 2 条（正 1·勾过 1）");
    expect(labelAxisNote(VOCAB, axis({ label_samples: 0, label_positives: 0, label_explicit: 0 }))
      .text).toContain("可拟样本 0 条（正 0·勾过 0）");
  });

  it("队头里缺缩放前分布的条数必须报出来——那种行处置完拟合仍旧拿不到样本", () => {
    expect(labelAxisNote(VOCAB, axis()).text).toContain("队头 2 条里只有 1 条带缩放前分布");
    expect(labelAxisNote(VOCAB, axis({ top: [axis().top[0]] })).text).not.toContain("只有");
  });

  it("按轴排序时那行说明不许让人把它读成风险高低", () => {
    expect(axisSortNote(VOCAB, null)).toBe("");
    const note = axisSortNote(VOCAB, "pii_real_person");
    expect(note).toContain("真人隐私");
    expect(note).toContain("不是结论");
  });
});

describe("逐轴真值控件的初值", () => {
  it("没确认过的行以机器条款起步，但不算表态", () => {
    expect(initialTruth({ clause_ids: ["doxxing"], human_clauses: null }))
      .toEqual({ asserted: false, picked: ["doxxing"] });
  });

  it("确认过的行读回自己勾的——空列表是「一条都不成立」，不是没勾", () => {
    expect(initialTruth({ clause_ids: ["doxxing"], human_clauses: [] }))
      .toEqual({ asserted: true, picked: [] });
    expect(initialTruth({ clause_ids: [], human_clauses: ["spam_promotion"] }))
      .toEqual({ asserted: true, picked: ["spam_promotion"] });
  });
});

describe("处置时的逐轴真值", () => {

  it("没勾选就不发这个键——发空数组等于替运营说「一条都不成立」", () => {
    expect(humanClausesPayload(false, [])).toBeUndefined();
    expect(humanClausesPayload(false, ["spam_promotion"])).toBeUndefined();
  });

  it("勾了但一条都不选，必须真的发出空数组（那是最有价值的负样本）", () => {
    expect(humanClausesPayload(true, [])).toEqual([]);
    expect(humanClausesPayload(true, ["doxxing"])).toEqual(["doxxing"]);
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

describe("队列结论的版本新鲜度", () => {
  // 2026-09-28 dev 库真机量到的形状（994 条待处置）
  const stale = {
    total: 994,
    stale_questions: 264,
    stale_lexicon: 111,
    current_questions: "questions-3",
    current_lexicon: "lexicon-f9cbaf14",
    without_authoritative_verdict: 977,
  };

  it("旧题集与旧词表各自点名，并说清当前是哪一版", () => {
    const v = stalenessSummary(stale);
    expect(v.tone).toBe("warn");
    expect(v.text).toContain("264 条是 questions-3 之前的题集判的");
    expect(v.text).toContain("111 条挂着旧词表版本");
  });

  it("全都在当前版本上时读 ok，而不是留一片空白或假报警", () => {
    const fresh = { ...stale, stale_questions: 0, stale_lexicon: 0 };
    expect(stalenessSummary(fresh).tone).toBe("ok");
    expect(stalenessSummary(fresh).text).toContain("994 条");
    expect(stalenessSummary({ ...stale, total: 0 }).text).toBe("");
  });
});
