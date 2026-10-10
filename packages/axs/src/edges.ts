/**
 * AXS 的**目标解析与边物化**（从 `parse.ts` 外提，G1 行数预算）。
 *
 * 这一族只管一件事：Beat 之间怎么互相指上去。
 * 契约文本在 [ADR-016 的「补记 2026-09-30」](../../../docs/ADR/016-axs-narrative-language.md)：
 * 目标按标题寻址、同名按出现顺序消歧（第一拍裸 slug，其后 `标题-N`）、
 * 裸同名标题确定性指向第一拍（并给一条可操作的 warning），beat 模型里存 id、标题映射只发生在打印那一刻。
 * 改这里之前先读那一节——序号规则与 `print.ts::idToBeatRef` 是咬合的两半，单独"简化"一边会静默换靶。
 *
 * **本文件当前仍有一处已登记的残留（2026-10-01 复审实测，不是新引入）**：
 * `标题-N` 这个消歧写法**不是保留命名空间**——一个字面标题正好等于 `标题-N` 时，
 * 它与自动生成的 id 相同。`# 开场` / `# 开场` / `# 开场-2` 实测得到
 * `开场` / `开场-2` / `开场-2`（重复 id + 邻接边退化自环，零诊断），**修改前后一样红**。
 * 它之所以不能在本地顺手修：`titleToId` 的匹配优先级是**原始标题先、id 后**，
 * 所以字面标题一旦占住 `标题-N`，那个自动生成的引用就会解析到字面标题那一拍。
 * 要真正关掉它必须改**消歧方案本身**（换一族标题产生不了的形式，或给字面标题让路），
 * 那是 ADR-016 的语法冻结面 ⇒ 登记为待决，不由这一刀自行决定。
 * 分母：见 `parse.test.ts` 那条 describe 的注释（今天 0 处命中）。
 */
import type { AxsBeat, AxsDiagnostic, AxsEdge } from "./types";

/** 将标题转为 beat id（slug） */
export function slugifyTitle(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
  return s || "beat";
}

export function parseChoiceLine(line: string): { label: string; to: string | null } | null {
  const m = line.match(/^>\s*(.*?)(?:\s*->\s*(.+))?$/);
  if (!m) return null;
  return {
    label: m[1]!.trim(),
    to: m[2]?.trim() ?? null,
  };
}

export function parseJumpLine(line: string): string | null {
  const m = line.match(/^->\s*(.+)$/);
  return m ? m[1]!.trim() : null;
}

export function assignBeatIds(beats: AxsBeat[]): void {
  const seen = new Map<string, number>();
  for (const beat of beats) {
    const base = slugifyTitle(beat.title);
    // 计数器必须按 **base（slug）** 记，不能按原始 title——2026-10-01 复审修掉的静默缺陷。
    // id 是拿 base 拼的，而 `Hello World` 与 `hello-world` 是**两个不同标题却共用同一个 base**：
    // 按 title 记的话两者都拿到 n=0 ⇒ id 相同 ⇒ `beatIdToNodeId` 按 beat.id 建键时后者盖掉前者，
    // 于是一段本该是「A 顺序走到 B」的邻接边在投影层退化成**自环**（实测 `gen-2 → gen-2`），零诊断。
    // 这与已登记的「同名 Beat 塌成一个节点」是同一族，但维度不同：那条按 title 计数是对的，
    // 漏的是"不同标题、相同 slug"这一格。改按 base 记之后，已承认的同名规则逐字不变
    // （两个「开场」仍然得到 `开场` / `开场-2`）。
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    beat.id = n === 0 ? base : `${base}-${n + 1}`;
  }
}

function titleToId(
  title: string,
  beats: AxsBeat[],
  diagnostics: AxsDiagnostic[],
  line: number,
): string | null {
  const matches = beats.filter((b) => b.title === title);
  if (matches.length === 1) return matches[0]!.id;
  if (matches.length > 1) {
    // 第一个赢是 ADR-016 补记第 3 条定下的**确定性规则**，不是未定义行为；
    // 但它对作者不显眼——写错第二拍时不会有任何东西挡一下，所以这里报一条可操作的 warning：
    // 文案直接给出该写成的消歧形式（第二拍的 id 就是那个写法），语义本身不改。
    const alt = matches[1]!.id;
    diagnostics.push({
      line,
      message: `同名 Beat「${title}」有 ${matches.length} 处，这里指向第 1 个；要指向第 2 个请写「${alt}」`,
      severity: "warning",
    });
    return matches[0]!.id;
  }
  const byId = beats.find((b) => b.id === slugifyTitle(title));
  return byId?.id ?? null;
}

export function buildEdges(beats: AxsBeat[], diagnostics: AxsDiagnostic[]): AxsEdge[] {
  const edges: AxsEdge[] = [];

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]!;
    const choiceInstr = beat.script.find((s) => s.op === "choice");
    const hasJumps = (beat.jumps?.length ?? 0) > 0;

    if (hasJumps) {
      for (const targetTitle of beat.jumps ?? []) {
        const to = titleToId(targetTitle, beats, diagnostics, beat.line);
        if (!to) {
          diagnostics.push({
            line: beat.line,
            message: `跳转目标未找到: ${targetTitle}`,
            severity: "warning",
          });
          continue;
        }
        edges.push({ from: beat.id, to });
      }
      continue;
    }

    if (choiceInstr && choiceInstr.op === "choice") {
      for (const opt of choiceInstr.options) {
        const targetTitle = opt.to;
        let to: string | null = null;
        if (targetTitle) {
          to = titleToId(targetTitle, beats, diagnostics, beat.line);
          if (!to) {
            diagnostics.push({
              line: beat.line,
              message: `选项目标未找到: ${targetTitle}`,
              severity: "warning",
            });
          }
        } else if (i + 1 < beats.length) {
          to = beats[i + 1]!.id;
        }
        if (to) {
          edges.push({ from: beat.id, to, label: opt.label });
        }
      }
      continue;
    }

    if (i + 1 < beats.length) {
      edges.push({ from: beat.id, to: beats[i + 1]!.id });
    }
  }

  return edges;
}
