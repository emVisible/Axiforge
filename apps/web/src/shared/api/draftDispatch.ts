import { draftFromProse, parseAxs, proseToScriptDraft } from "@axiforge/axs";
import type { Instruction } from "@axiforge/core";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import { aiApi, type ProseToScriptResult } from "./ai";

export type { ProseToScriptResult };
export type DraftMode = "replace" | "append";

export interface DraftRequest {
  prose: string;
  title?: string;
  roleNames?: string[];
  defaultSpeaker?: string;
  authorId?: string;
}

export const draftDeps: {
  isLocal: () => boolean;
  remote: (body: { prose: string; role_names?: string[]; author_id?: string }) => Promise<ProseToScriptResult>;
} = {
  isLocal: isTauriEnvironment,
  remote: (body) => aiApi.proseToScript(body),
};

/**
 * AI 演绎草稿的分派口（沿用 `playerSavesDeps` 那套已验证形状）。
 *
 * 桌面态规则引擎在**本地**跑：壳目前没有任何指向后端的方式（`deployment.ts` 的既有判据），
 * 走 HTTP 只会得到一条网络错误，等于桌面离线没有演绎辅助。
 * 浏览器态逐字不变，仍走 `/editor/ai/prose-to-script`。
 *
 * 注入点存在的技术理由：`isTauriEnvironment()` 在 Playwright/node 下恒为 false，
 * 本地支若不可注入就**结构上永不被执行**——上一版已经为此付过一笔判据不可达的债。
 */
export async function requestDraft(req: DraftRequest): Promise<ProseToScriptResult> {
  if (draftDeps.isLocal()) {
    return {
      script: proseToScriptDraft(req.prose, req.roleNames),
      source: "rules",
      axs: draftFromProse({ prose: req.prose, title: req.title, roleNames: req.roleNames, defaultSpeaker: req.defaultSpeaker }),
      needs_parse: false,
    };
  }

  return draftDeps.remote({
    prose: req.prose,
    role_names: req.roleNames,
    author_id: req.authorId,
  });
}

/**
 * 只要文本的消费方（角色传记 → AXS 草稿）走这一支。
 * 桌面态本地成文，浏览器态仍走 `/editor/ai/prose-to-axs`——同一个规则引擎，不另写第二套。
 */
export async function requestAxsDraft(
  req: DraftRequest,
): Promise<{ axs: string; source: string }> {
  if (draftDeps.isLocal()) {
    return {
      axs: draftFromProse({
        prose: req.prose,
        title: req.title,
        roleNames: req.roleNames,
        defaultSpeaker: req.defaultSpeaker,
      }),
      source: "rules",
    };
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
