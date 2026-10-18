/**
 * AXS 的**条件表达式与字面量**（从 `parse.ts` 外提，G1 行数预算下按域切分）。
 *
 * 这一族只管一件事：`[if: …]` 里那半句话怎么在文本与结构体之间来回。
 * 它是三处共用的底部依赖——Beat 标题行（`./parse` 的 `parseHeadingLine`）、
 * 指令行取值（`./parse` 的 `parseEffectDirective`）、打印侧（`./print` 的 `printCondition`）。
 * 耦合点：`OP_MAP`（文本→枚举）与 `print.ts::OP_PRINT`（枚举→文本）必须同键同集合，
 * 求值那一半在 `@axiforge/core` 的 `conditions.ts::compare`——枚举在这里加一支，
 * 打印与求值两处都得跟上，单独改一边会静默换语义。
 */
import type {
  AtomCondition,
  ComparisonOperator,
  Condition,
  GroupCondition,
} from "@axiforge/core";

const OP_MAP: Record<string, ComparisonOperator> = {
  "==": "eq",
  "!=": "ne",
  ">": "gt",
  "<": "lt",
  // 缺这两键时 `>=` 会经 `?? "eq"` 静默变相等（#82）：词法认得、文档承诺、语义却降级。
  ">=": "gte",
  "<=": "lte",
};

/** 解析字面量：数字、布尔、引号字符串、裸词 */
export function parseLiteral(raw: string): unknown {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

/** 字面量 → AXS 文本 */
export function printLiteral(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (/^[a-zA-Z_\u4e00-\u9fff][\w\u4e00-\u9fff.-]*$/.test(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

/** 词法侧的运算符记号表；`OP_MAP` 必须接住它产出的每一个记号（漂移由 `condition.test.ts` 那条不变量拦住） */
export const COND_OP_RE = /(==|!=|>=|<=|>|<|contains)\s+/;

/** 解析条件表达式（支持 `&&` 组合为 all 组） */
export function parseCondition(expr: string): Condition | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s*&&\s*/).filter(Boolean);
  const atoms: AtomCondition[] = parts
    .map(parseAtomCondition)
    .filter(Boolean) as AtomCondition[];

  if (atoms.length === 0) return null;
  if (atoms.length === 1) return atoms[0]!;
  return { type: "all", conditions: atoms } satisfies GroupCondition;
}

function parseAtomCondition(part: string): AtomCondition | null {
  const m = part.match(COND_OP_RE);
  if (!m) return null;
  const opStr = m[1]!;
  // 这里原来是 `OP_MAP[opStr] ?? "eq"`——那个兜底就是 #82 的成因：词法认得记号、映射表缺键时
  // 它替作者猜一个语义，而且猜的是最不像出错的那个（`>=` 静默变 `==`）。
  // 现在缺键即整条条件判为不可解析，交给 `[if:` 那条既有 warning 接住；映射表不再补语义。
  const operator: ComparisonOperator | undefined =
    opStr === "contains" ? "contains" : OP_MAP[opStr];
  if (!operator) return null;
  const left = part.slice(0, m.index).trim();
  const right = part.slice(m.index! + opStr.length).trim();
  const value = parseLiteral(right);

  if (left.startsWith("flag.")) {
    return { type: "flag", key: left.slice(5), operator, value };
  }
  if (left.startsWith("memory.")) {
    return { type: "memory", key: left.slice(7), operator, value };
  }
  if (left.startsWith("codex.")) {
    return { type: "codex", key: left.slice(6), operator, value };
  }
  if (left.startsWith("state.")) {
    return { type: "character_state", key: left.slice(6), operator, value };
  }
  if (left.startsWith("relation.")) {
    return { type: "relationship", key: left.slice(9), operator, value };
  }
  if (left.startsWith("relationship.")) {
    return { type: "relationship", key: left.slice(13), operator, value };
  }
  return null;
}
