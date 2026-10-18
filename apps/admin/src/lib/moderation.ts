import type {
  AdminReport,
  EngineCalibration,
  LabelTargetAxis,
  ModerationAnswer,
  ModerationVocabulary,
  QueueStaleness,
  RequeueStatus,
  WhatIfReport,
} from "@/api/adminClient";

const WEB_ORIGIN =
  import.meta.env.VITE_WEB_ORIGIN?.replace(/\/$/, "") || "http://localhost:5174";

export function webDiscoverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${WEB_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatReportTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function maskToken(token: string | null | undefined): string {
  if (!token) return "匿名";
  if (token.length <= 8) return token;
  return `…${token.slice(-8)}`;
}

export const targetTypeLabel: Record<string, string> = {
  project: "作品",
  character: "角色",
  comment: "评论",
};

export function reportSummaryLine(r: AdminReport): string {
  const p = r.target_preview;
  if (p.exists) return p.title;
  return `${targetTypeLabel[r.target_type] || r.target_type} · ${r.target_id.slice(0, 8)}…`;
}

export function reportTargetKey(r: AdminReport): string {
  return `${r.target_type}:${r.target_id}`;
}

export function countSiblingReports(items: AdminReport[], selected: AdminReport): number {
  return items.filter(
    (r) => r.target_type === selected.target_type && r.target_id === selected.target_id,
  ).length;
}

/** 词汇表未到位时的空表。标签函数会落回内部 id——那是可见的缺口，不是兜底文案。 */
export const EMPTY_VOCABULARY: ModerationVocabulary = {
  clauses: {},
  axis_clauses: [],
  suggestions: {},
  rules: {},
  actions: {},
  questions: {},
  human_only_clauses: [],
  policy_version: "",
  questions_version: "",
};

export function questionLabel(v: ModerationVocabulary, name: string): string {
  return v.questions[name] || name;
}

/** 温度表覆盖面的一行话。tone 是状态不是布尔：
 *  "没标定"与"标定被网格截断"是两个不同的下一步（前者要补标注，后者要放宽搜索网格）。 */
export function calibrationSummary(
  v: ModerationVocabulary,
  c: EngineCalibration,
): { text: string; tone: "ok" | "warn" | "error" } {
  if (!c.reachable) {
    return { text: `${c.engine} 标定状态取不到${c.error ? `（${c.error}）` : ""}`, tone: "error" };
  }
  const names = (list: string[], cap = 3) =>
    list.slice(0, cap).map((n) => questionLabel(v, n)).join("、") +
    (list.length > cap ? `…共 ${list.length} 题` : "");
  const covered = `${c.covered.length}/${c.declared.length} 题`;
  if (c.missing.length) {
    return { text: `标定 ${covered}，缺 ${names(c.missing)}`, tone: "warn" };
  }
  const flat = c.flattened ?? [];
  if (flat.length) {
    // 「标定 10/10 题」在这里是一句会骗人的话：题数齐了，但其中这几题的缩放后概率
    // 打不过"完全不看模型"的常数预测器——它们不携带信息，却在 approve 的取 min 里
    // 否决整条自动通道。这一枚必须说"没有判断力"，不能说"标定完成"。
    // 顶格（censored）是另一件下一步（放宽网格），两类都命中时两条都要说，别只报前面那个。
    const censoredNote = c.censored.length ? `·另有 ${c.censored.length} 题触到网格上限` : "";
    return {
      text: `标定 ${covered}，其中 ${names(flat)} 打不过常数预测器（不携带信息，却按 min 压住自动通道）${censoredNote}`,
      tone: "warn",
    };
  }
  if (c.censored.length) {
    return {
      text: `标定 ${covered}，其中 ${names(c.censored)} 的拟合触到网格上限（置信仍偏高）`,
      tone: "warn",
    };
  }
  if (c.flattening_reported !== true) {
    // 旧温度表没上报判断力。这里给 warn 不是"有问题"，是"这一维看不见"——
    // 把它显示成 ok 会让人以为 10/10 且题题有信息。
    return { text: `标定 ${covered}（这张表没上报判断力，无法判断有无空转轴）`, tone: "warn" };
  }
  return { text: `标定 ${covered}`, tone: "ok" };
}

export function clauseLabel(v: ModerationVocabulary, clause: string): string {
  return v.clauses[clause] || clause;
}

/** 单选题「最主要一条」的读法。它和条款不是一个取值域：多一个 `none`。 */
export function suggestionLabel(v: ModerationVocabulary, suggestion: string): string {
  return v.suggestions[suggestion] || suggestion;
}

/** 命中即建议人工的规则 → 中文（`via=suggested_human:<rule>` 的后半段）。 */
export function ruleLabel(v: ModerationVocabulary, rule: string): string {
  return v.rules[rule] || rule;
}

/** 动作的稳定中文（队列的"结论"列与预览面板共用，不能一处中文一处英文）。 */
export function actionLabel(v: ModerationVocabulary, action: string): string {
  return v.actions[action] || action || "—";
}

/** 带后缀的 via 全部走这里剥前缀：手写 `slice(19)` 是一个没人能一眼验住的数字。 */
function tail(via: string, prefix: string): string {
  return via.startsWith(prefix) ? via.slice(prefix.length) : via;
}

/**
 * `via` 是"这条结论为什么是这个动作"的机器标签，直接摊给运营看等于让人读源码。
 * 后端保持稳定前缀、前端负责把前缀排成一句人话；**句子里的条款名与规则名来自词汇表**，
 * 不在这里另抄一份。
 *
 * 带后缀的 via（`human_only_clause:doxxing`、`below_approve_line 0.77<0.90`）
 * 保留数字与条款名：一队列里全是"转人工"时，运营就无法回答"这条跟那条有什么不同"。
 */
export function viaLabel(v: ModerationVocabulary, via: string): string {
  if (!via) return "—";
  if (via.startsWith("auto@")) return `自动执行（线 ${tail(via, "auto@")}）`;
  if (via.startsWith("below_approve_line")) return `低于通过线（${tail(via, "below_approve_line ")}）`;
  if (via.startsWith("below_reject_line")) return `低于驳回线（${tail(via, "below_reject_line ")}）`;
  if (via.startsWith("engine_error")) return "引擎异常，转人工";
  if (via.startsWith("refusal:")) {
    // 引擎"有话但不能执行"与"没标定"是两件事：混起来会让人去重拟温度表，
    // 而真正要做的可能是把长文分段。
    const detail = tail(via, "refusal:");
    return detail.startsWith("over_length:")
      ? `正文超出模型窗口（${tail(detail, "over_length:")}），不做截断后自动裁决`
      : `引擎拒绝自动执行：${detail}`;
  }
  if (via.startsWith("human_only_clause:")) {
    return `命中需人工判断的条款：${clauseLabel(v, tail(via, "human_only_clause:"))}`;
  }
  if (via.startsWith("suggested_human:")) {
    return `规则建议人工：${ruleLabel(v, tail(via, "suggested_human:"))}`;
  }
  return VIA_SUFFIX_FREE[via] ?? via;
}

/** 不带后缀的 via 就是几个固定状态，措辞属于展示层，留在前端。 */
const VIA_SUFFIX_FREE: Record<string, string> = {
  non_authoritative_engine: "引擎不权威，转人工",
  uncalibrated: "置信度未校准，不自动执行",
  engine_abstained: "所有引擎弃权",
  engine_unavailable: "审核引擎不可用",
};

/**
 * 处置时逐轴真值该发什么。这里的两个"空"完全不同，混掉就毁了标定数据：
 * - `undefined` → 请求体里根本没这个键 → 库里 NULL → 导出按"沿用机器条款"处理；
 * - `[]` → 人明确说"机器报的条款一条都不成立" → 这批数据里最值钱的负样本。
 * 所以未勾选时绝不发空数组，勾选了就算全不选也要发出去。
 */
export function humanClausesPayload(
  asserted: boolean,
  selected: string[],
): string[] | undefined {
  return asserted ? [...selected] : undefined;
}

/**
 * 批量重判的读数。这里的原则与 D14 同一条：**"跑完了"不等于"模型看过了"**。
 * 第一次上线时计数器把 147 条只到词表的也算成判完，而库里只多了 1 条模型证据——
 * 所以 `lexicon_only` 必须单独说出来，且它一出现就是黄/红而不是绿。
 */
export function requeueSummary(s: RequeueStatus): {
  tone: "idle" | "running" | "ok" | "warn" | "danger";
  text: string;
} {
  if (s.running) {
    const done = s.judged + s.lexicon_only + s.would_close + s.no_content + s.no_case + s.failed;
    return { tone: "running", text: `重判中 ${done}/${s.queued}` };
  }
  if (s.queued === 0) return { tone: "idle", text: "还没跑过批量重判" };
  const parts: string[] = [`模型答了 ${s.judged} 条`];
  if (s.would_close > 0) parts.push(`${s.would_close} 条已过门（未结案，等人确认）`);
  if (s.lexicon_only > 0) parts.push(`${s.lexicon_only} 条只有词表说话`);
  if (s.no_content > 0) parts.push(`${s.no_content} 条原内容已不在`);
  if (s.failed > 0) parts.push(`${s.failed} 条失败`);
  if (s.cancelled) parts.push("已取消");
  const tone: "ok" | "warn" | "danger" =
    s.failed > 0 ? "danger" : s.judged === 0 || s.lexicon_only > 0 || s.cancelled ? "warn" : "ok";
  return { tone, text: parts.join(" · ") };
}

/**
 * 一条类型化答案该怎么显示。标量按题型放在不同键下（`noul|score|choice`），
 * 没有统一的 `value`——以前界面读 `a.value`，于是依据表里新形状的行整列 `undefined`。
 *
 * 但库里三种形状**并存**（实测：D13 前的 `{type,value}`、D13 后的分型键、D20 后多一个 `raw`），
 * 而这一屏的职责就是"让运营核对机器说了什么"，所以对旧行也不许显示成空白：
 * 读得到就报出来，同时用 `legacy` 标出"这是废弃形状"。
 * 这只是显示层的兜底，**判据路径不放水**：what-if 与拟合仍旧整行跳过旧行。
 *
 * 兜底只认三种已知题型：`type` 都不认识的行是坏数据不是旧数据，
 * 把它那个裸 `value` 标成「旧形状」是在给一个无法解释的数编一个来源。
 */
const ANSWER_TYPES = ["noul", "score", "choice"] as const;

export function answerDisplay(a: ModerationAnswer | undefined | null): {
  text: string;
  legacy: boolean;
} {
  if (!a || typeof a !== "object") return { text: "—", legacy: false };
  const typed = a.type === "noul" ? a.noul : a.type === "score" ? a.score : a.type === "choice" ? a.choice : undefined;
  if (typeof typed === "number") return { text: typed.toFixed(2), legacy: false };
  if (typeof typed === "string" && typed) return { text: typed, legacy: false };
  if (!ANSWER_TYPES.includes(a.type as (typeof ANSWER_TYPES)[number])) {
    return { text: "—", legacy: false };
  }
  const legacy = (a as { value?: unknown }).value;
  if (typeof legacy === "number") return { text: legacy.toFixed(2), legacy: true };
  if (typeof legacy === "string" && legacy) return { text: legacy, legacy: true };
  return { text: "—", legacy: false };
}

/**
 * 逐轴真值控件该以什么为初值。
 * 已确认过的行读回自己勾的那些（含"一条都不成立"的空集），没确认过的行以机器条款起步——
 * 起步不等于认可：不点"我核对过"就仍然发 `undefined`（见 humanClausesPayload）。
 */
export function initialTruth(
  row: { clause_ids: string[]; human_clauses: string[] | null },
): { asserted: boolean; picked: string[] } {
  return row.human_clauses !== null
    ? { asserted: true, picked: [...row.human_clauses] }
    : { asserted: false, picked: [...row.clause_ids] };
}

/**
 * 一条轴的"该不该先标它"读数。三种状态是三件不同的下一步，压成一个布尔就会有人
 * 去标那些已经能用的轴：
 * - `false`：这条轴的缩放后概率打不过"完全不看模型"的常数预测器——标它才补得回判断力；
 * - `true`：已经有判断力，再标是加密度（价值低一档）；
 * - `null/undefined`：这张温度表没上报这一维，是"看不见"不是"没问题"。
 *
 * 顺带报 `has_raw` 的条数：处置一条**没有缩放前分布**的旧行，拟合仍旧拿不到样本，
 * 那一次人工劳动对温度表是零贡献（不是零价值——案件该处置还是得处置）。
 */
export function labelAxisNote(
  v: ModerationVocabulary,
  axis: LabelTargetAxis,
): { text: string; tone: "ok" | "warn" | "muted" } {
  const named = questionLabel(v, axis.question);
  const withRaw = axis.top.filter((r) => r.has_raw).length;
  const rawNote =
    axis.top.length && withRaw < axis.top.length
      ? `｜队头 ${axis.top.length} 条里只有 ${withRaw} 条带缩放前分布`
      : "";
  // 「可拟样本」用的是导出／拟合那同一个判据（缺缩放前分布的行整行不算），
  // 所以它不等于"处置过几条"：处置十条旧形状的行，这一栏照样是 0。
  const fit = `｜可拟样本 ${axis.label_samples} 条（正 ${axis.label_positives}·勾过 ${axis.label_explicit}）`;
  if (axis.informative === false) {
    return {
      text: `${named}：打不过常数预测器，标它才补得回判断力${fit}${rawNote}`,
      tone: "warn",
    };
  }
  if (axis.informative == null) {
    return {
      text: `${named}：判断力未上报（旧温度表），先重拟${fit}${rawNote}`,
      tone: "muted",
    };
  }
  return { text: `${named}：已有判断力，再标是加密度${fit}${rawNote}`, tone: "ok" };
}

/** 按某条轴排序时那行说明。它必须一直在，因为"排在最上面"很容易被读成"最危险"。 */
export function axisSortNote(v: ModerationVocabulary, axis: string | null): string {
  if (!axis) return "";
  return `正在按「${questionLabel(v, axis)}」报警的可能性排序——它只决定先看哪条，不是结论，也不是风险高低`;
}

/**
 * 队列结论的版本新鲜度读数。存在的理由：判定只在内容被保存那一刻发生，
 * 题集/词表改版**不会自己回头重算**——"待处置 994 条"看起来像 994 条同等新鲜的证据，
 * 实测其中 264 条是旧题集判的。这条文案说的就是"要重判才会刷新"这个动作缺口。
 */
export function stalenessSummary(
  s: QueueStaleness | null | undefined,
): { text: string; tone: "ok" | "warn" } {
  if (!s || s.total === 0) return { text: "", tone: "ok" };
  const parts: string[] = [];
  if (s.stale_questions > 0) parts.push(`${s.stale_questions} 条是 ${s.current_questions} 之前的题集判的`);
  if (s.stale_lexicon > 0) parts.push(`${s.stale_lexicon} 条挂着旧词表版本`);
  if (parts.length === 0) {
    return { text: `结论都在当前版本上（${s.total} 条）`, tone: "ok" };
  }
  return { text: `版本已推进但结论没重算：${parts.join("、")}`, tone: "warn" };
}

/**
 * 阈值假设的一行读数。status 而不是布尔：
 * "有人判过且机器与之相反"(conflict) 与 "根本没人判过"(undecided) 是两种完全不同的下一步，
 * 前者是风险、后者是缺标注——压成一个 boolean 就会有人去下调阈值而不是去攒处置。
 */
export function whatIfVerdict(
  report: Pick<WhatIfReport, "conflicts" | "auto_approve" | "auto_reject" | "undecided">,
): { tone: "ok" | "warn" | "danger"; text: string } {
  const auto = report.auto_approve + report.auto_reject;
  if (report.conflicts > 0) {
    return { tone: "danger", text: `这条线会误放/误伤 ${report.conflicts} 条已处置过的案件` };
  }
  if (auto === 0) {
    return { tone: "ok", text: "这条线下没有案件会被自动执行" };
  }
  if (report.undecided > 0) {
    return {
      tone: "warn",
      text: `会自动执行 ${auto} 条，其中 ${report.undecided} 条还没有人工结论可对`,
    };
  }
  return { tone: "ok", text: `会自动执行 ${auto} 条，与人工结论全部一致` };
}

/** 引擎没答话那行依据的标记。后端只有一处生成点（`moderation/engine.py` 的 `未答话`），
 * 这里复用它：界面上"这台模型刚才死了"必须一眼看得见，而不是只躺在依据里。 */
export const ENGINE_SILENCE_MARK = "未答话";

/** 依据里最后一条"某台权威引擎没答话"；没有则空串。 */
export function engineSilenceNote(reasons: string[] | null | undefined): string {
  const hits = (reasons ?? []).filter((r) => r.includes(ENGINE_SILENCE_MARK));
  return hits.length > 0 ? hits[hits.length - 1] : "";
}

/**
 * what-if 读数的样本量尾巴。窗口截断必须跟在那句"会自动执行 N 条"旁边说，
 * 否则"这条线只影响 3 条"实际意思是"在我看得见的这 500 条里影响 3 条"——
 * 队列分页那一轮（D12）学的同一课：没被读到的案件在界面上等于不存在。
 */
export function whatIfSampleNote(
  r: Pick<WhatIfReport, "scanned" | "population">,
): string {
  return r.scanned < r.population
    ? ` · 全库 ${r.population} 条，这里只取最新 ${r.scanned} 条`
    : "";
}

/**
 * "可回放 N 条"里的真实分母。案件数会被重复文本膨胀：dev 库实测 292 条可回放
 * 只对应 32 篇不同稿子。不说这句，面板上的数字就会被当成 n=292 去支撑挪阈值。
 */
export function whatIfEvidenceNote(
  r: Pick<WhatIfReport, "evaluated" | "distinct_contents">,
): string {
  return r.evaluated > r.distinct_contents
    ? `（不同内容仅 ${r.distinct_contents} 篇，重复文本不增加样本量）`
    : "";
}
