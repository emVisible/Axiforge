import type { Instruction } from "@axiforge/core";
import { printAxs } from "./print";
import type { AxsBeat } from "./types";

/**
 * 演绎内核（规则路径）：散文/粗写 → 指令序列 → canonical AXS 文本。
 *
 * 与 `backend/app/domains/narrative/ai_draft.py` 的同名规则**语义相同**，由
 * `testdata/axs-draft/*.json` 那批共享向量锁住等价（两端 runner 各跑同一批）。
 * 之所以在 TS 再实现一份：桌面壳连不上后端，规则路径不在本地跑就没有离线演绎辅助；
 * 而文本形状一律交回 `printAxs` 打印，内核不自己发明第二套发射器。
 */

const SPEAKER_RE = /^([^\s：:]{1,20})[：:]\s*(.+)$/;
const STAGE_RE = /^【(背景|音乐|旁白|转场|特效)[:：]?\s*(.*)】\s*(.*)$/;
const CHOICE_RE = /^>\s*(.+)$/;
const OPTION_SPLIT = /\s*[|｜/]\s*/;

export interface DraftInput {
  prose: string;
  title?: string;
  roleNames?: string[];
  defaultSpeaker?: string;
}

/**
 * 散文 → 指令序列。舞台指令的时长（转场 500ms / 特效 600ms）与 `loop` 恒真是规则引擎现值，
 * 与 Python 侧一致；改变它们属于语义变更，要两端同批改。
 */
export function proseToScriptDraft(prose: string, roleNames?: string[]): Instruction[] {
  const names = new Set((roleNames ?? []).map((n) => n.trim()).filter(Boolean));
  const script: Instruction[] = [];
  let pendingChoice: string[] | null = null;

  const flushChoice = () => {
    if (pendingChoice?.length) {
      script.push({ op: "choice", options: pendingChoice.map((label) => ({ label })) });
    }
    pendingChoice = null;
  };

  for (const raw of prose.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushChoice();
      continue;
    }

    const stage = STAGE_RE.exec(line);
    if (stage) {
      flushChoice();
      const kind = stage[1];
      const arg = (stage[2] ?? "").trim();
      const rest = (stage[3] ?? "").trim();
      if (kind === "背景") script.push({ op: "bg", image: arg || rest || "default" });
      else if (kind === "音乐") script.push({ op: "bgm", track: arg || rest || null, loop: true });
      else if (kind === "旁白") script.push({ op: "narration", text: arg || rest });
      else if (kind === "转场") script.push({ op: "transition", kind: (arg || "fade") as "fade", ms: 500 });
      else if (kind === "特效") script.push({ op: "fx", effect: (arg || "flash") as "flash", ms: 600 });
      if (rest && kind !== "旁白") script.push({ op: "narration", text: rest });
      continue;
    }

    const choice = CHOICE_RE.exec(line);
    if (choice) {
      pendingChoice = (choice[1] ?? "").trim().split(OPTION_SPLIT).filter(Boolean);
      continue;
    }

    const speaker = SPEAKER_RE.exec(line);
    if (speaker) {
      flushChoice();
      const name = speaker[1] ?? "";
      const text = speaker[2] ?? "";
      // 认不出的名字不猜角色，退回旁白并保留全角冒号原样——与 Python 侧同一裁决
      if (names.size === 0 || names.has(name)) script.push({ op: "say", speaker: name, text });
      else script.push({ op: "narration", text: `${name}：${text}` });
      continue;
    }

    flushChoice();
    script.push({ op: "narration", text: line });
  }

  flushChoice();
  return script;
}

/** 散文 → canonical AXS 源文本（打印交给 printAxs，内核不另立发射器） */
export function draftFromProse(input: DraftInput): string {
  const defaultSpeaker = input.defaultSpeaker?.trim() || "旁白";
  const script = proseToScriptDraft(input.prose, input.roleNames).map((i) =>
    i.op === "say" && !i.speaker ? { ...i, speaker: defaultSpeaker } : i,
  );

  const beat: AxsBeat = {
    id: "draft",
    title: input.title?.trim() || "未命名",
    line: 1,
    script,
  };

  return printAxs({ beats: [beat], edges: [], diagnostics: [] });
}
