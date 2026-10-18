/**
 * 散文 → canonical AXS 的模型提示词（ADR-027：语法单一真相源在 `packages/axs`）。
 *
 * 文本本体放在 `packages/axs/prompts/prose-to-axs.json`，**由 TS 与 Python 同一份读取**
 * （后端 `llm/prompts.py` 现在也读这个文件）。理由：这份文本的内容就是语法本身，
 * 两边各抄一份必然漂移；而 AXS 的兜底是"认不出的行当旁白"，提示词一漂，
 * 模型开始吐上一代方言时是静默的——diagnostics 为空，草稿看着正常，读给玩家听的却是 `【背景 …】`。
 *
 * 顺带一条实测教训：手抄这份文本时我把它末两句改成了换行分隔，而原文是紧接的——
 * 差一个 `\n` 也是行为差异。所以这里不做任何字符串加工，读什么发什么。
 */

import prompt from "../prompts/prose-to-axs.json";

export interface AxsPromptInput {
  readonly prose: string;
  readonly title?: string;
  readonly roleNames?: readonly string[];
  readonly defaultSpeaker?: string;
}

export function proseToAxsSystem(): string {
  return prompt.system;
}

/** 占位符替换而非模板字符串：填法要与 JSON 里那份共用，免得两端各拼一次 */
export function proseToAxsUser(input: AxsPromptInput): string {
  const roles =
    input.roleNames?.filter(Boolean).join("、") || input.defaultSpeaker?.trim() || "旁白";
  return prompt.user_template
    .replace("{title}", input.title?.trim() || "未命名")
    .replace("{roles}", roles)
    .replace("{prose}", input.prose);
}
