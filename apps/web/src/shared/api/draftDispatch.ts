import { draftFromProse, parseAxs, proseToAxsSystem, proseToAxsUser, proseToScriptDraft } from "@axiforge/axs";
import type { Instruction } from "@axiforge/core";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import { loadLlmSettings } from "@/shared/lib/llmSettings";
import { generateAxsText, LlmError } from "./localLlm";
import { aiApi, type ProseToScriptResult } from "./ai";

export type { ProseToScriptResult };
export type DraftMode = "replace" | "append";

/** 分派口自己的返回：比传输态多一个"配了模型但退回规则"的可见标记 */
export interface DraftResult extends ProseToScriptResult {
  /** 非空 = 本次没能用上配置的模型，原因在此。UI 必须显示它，否则降级就成了撒谎 */
  degradedFrom?: string;
}

/** 只要文本的消费方的返回（`requestAxsDraft`）：没有 IR，也就没有 needs_parse */
export interface AxsDraftResult {
  axs: string;
  source: string;
  degradedFrom?: string;
}

export interface DraftRequest {
  prose: string;
  title?: string;
  roleNames?: string[];
  defaultSpeaker?: string;
  authorId?: string;
}

export const draftDeps: {
  isLocal: () => boolean;
  settings: () => ReturnType<typeof loadLlmSettings>;
  model: (system: string, user: string) => Promise<string>;
  remote: (body: { prose: string; role_names?: string[]; author_id?: string }) => Promise<ProseToScriptResult>;
} = {
  isLocal: isTauriEnvironment,
  settings: loadLlmSettings,
  model: (system, user) => {
    const s = draftDeps.settings();
    if (!s) return Promise.reject(new LlmError("llm_unavailable", "未配置端点"));
    return generateAxsText(s, system, user);
  },
  remote: (body) => aiApi.proseToScript(body),
};

/** 桌面离线的保底通路：规则引擎自己成拍，不依赖任何服务（已锁定决策） */
function rulesDraft(req: DraftRequest): DraftResult {
  return {
    script: proseToScriptDraft(req.prose, req.roleNames),
    source: "rules",
    axs: draftFromProse({
      prose: req.prose,
      title: req.title,
      roleNames: req.roleNames,
      defaultSpeaker: req.defaultSpeaker,
    }),
    needs_parse: false,
  };
}

function promptOf(req: DraftRequest): string {
  return proseToAxsUser({
    prose: req.prose,
    title: req.title,
    roleNames: req.roleNames,
    defaultSpeaker: req.defaultSpeaker,
  });
}

/**
 * AI 演绎草稿的分派口（沿用 `playerSavesDeps` 那套已验证形状）。
 *
 * 桌面态三段：配了端点就交给自己机器上的模型（只拿文本，回 IR 由本端 parseAxs 做）；
 * 没配或调不通就退回规则引擎——**退回是必须发生的，不是错误**，因为桌面离线要能独立成拍。
 * 但退回的痕迹（degradedFrom）随结果一起出去：静默降级会被用户当成"模型在干活"，
 * 那是比失败更糟的状态。
 * 浏览器态逐字不变，仍走 `/editor/ai/prose-to-script`。
 *
 * 注入点存在的技术理由：`isTauriEnvironment()` 在 Playwright/node 下恒为 false，
 * 本地支若不可注入就**结构上永不被执行**——上一版已经为此付过一笔判据不可达的债。
 */
export async function requestDraft(req: DraftRequest): Promise<DraftResult> {
  if (draftDeps.isLocal()) {
    const settings = draftDeps.settings();
    if (!settings) return rulesDraft(req);
    try {
      return {
        script: [],
        axs: await draftDeps.model(proseToAxsSystem(), promptOf(req)),
        source: settings.kind,
        needs_parse: true,
      };
    } catch (e) {
      return { ...rulesDraft(req), degradedFrom: e instanceof Error ? e.message : String(e) };
    }
  }

  return draftDeps.remote({
    prose: req.prose,
    role_names: req.roleNames,
    author_id: req.authorId,
  });
}

/**
 * 只要文本的消费方（角色传记 → AXS 草稿）走这一支。
 * 桌面态与 `requestDraft` 同一套三段（模型 → 退回规则），提示词也同一份；
 * 浏览器态仍走 `/editor/ai/prose-to-axs`——不另写第二套规则引擎，也不另写第二份提示词。
 */
export async function requestAxsDraft(req: DraftRequest): Promise<AxsDraftResult> {
  if (draftDeps.isLocal()) {
    const settings = draftDeps.settings();
    if (!settings) {
      const draft = rulesDraft(req);
      return { axs: draft.axs, source: draft.source };
    }
    try {
      return { axs: await draftDeps.model(proseToAxsSystem(), promptOf(req)), source: settings.kind };
    } catch (e) {
      const draft = rulesDraft(req);
      return {
        axs: draft.axs,
        source: draft.source,
        degradedFrom: e instanceof Error ? e.message : String(e),
      };
    }
  }

  return aiApi.proseToAxs({
    prose: req.prose,
    title: req.title,
    role_names: req.roleNames,
    default_speaker: req.defaultSpeaker,
    author_id: req.authorId,
  });
}

/**
 * 草稿结果 → 下一版指令序列（与 `requestDraft` 同一个关注点：怎么把一份草稿变成可落文的 IR）。
 *
 * 模型路径只给 canonical 文本，由本端 `parseAxs` 解析（ADR-027）——Python 没有 canonical
 * AXS 解析器，原先在服务端把文本读回 IR 的做法是第二套解析器，已废除。
 * 解析不出指令时必须抛错：AXS 的兜底是「认不出的行当旁白」，静默接受会把脚本灌成一堆
 * 读给玩家听的 `【背景 …】` 文本，且 diagnostics 为空、不会报警。
 */
export function applyDraft(
  res: ProseToScriptResult,
  current: Instruction[],
  mode: DraftMode,
): Instruction[] {
  const doc = res.needs_parse ? parseAxs(res.axs) : null;
  const next = doc ? doc.beats.flatMap((b) => b.script) : res.script;

  if (!next.length) {
    const bad = doc?.diagnostics.find((d) => d.severity !== "info");
    throw new Error(bad ? `第 ${bad.line} 行：${bad.message}` : "生成文本未解析出任何指令");
  }

  // 只拦这一种已证实的形态：模型若把括号方言当语法吐回来，它会以旁白身份通过解析
  const dialect = next.find(
    (i) => i.op === "narration" && /^【(背景|音乐|旁白|转场|特效)/.test((i as { text?: string }).text ?? ""),
  );
  if (dialect) {
    throw new Error("模型返回了非 AXS 的括号方言舞台指令，已拒绝写入");
  }

  return mode === "replace" ? next : [...current, ...next];
}
