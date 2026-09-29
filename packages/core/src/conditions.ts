/**
 * 统一条件 / 效果求值器（桥3 语义内核）
 *
 * 语义与 backend/app/services/player.py 的 _evaluate_condition / _compare /
 * _apply_effects 严格对齐。v1.2 将删除后端重复实现，改为共用本模块的契约。
 */

import type {
  AtomCondition,
  CodexLedger,
  ComparisonOperator,
  Condition,
  Effect,
  GroupCondition,
  RuntimeVariables,
} from "./ir";
import { cloneCodex } from "./ir";

/** {_value: x} 单键包装解包（后端记忆/标志的存储形态） */
function unwrap(value: unknown): unknown {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "_value" in (value as Record<string, unknown>) &&
    Object.keys(value as Record<string, unknown>).length === 1
  ) {
    return (value as Record<string, unknown>)._value;
  }
  return value;
}

/** 布尔归一化：字符串 "true"/"false" ↔ 布尔 */
function normalize(v: unknown): unknown {
  if (typeof v === "string") {
    const lower = v.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return v;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
}

/** 比较两个值，语义对齐 player.py _compare */
export function compare(
  actual: unknown,
  operator: ComparisonOperator,
  expected: unknown,
): boolean {
  const actualNorm = normalize(actual);
  const expectedNorm = normalize(expected);

  switch (operator) {
    case "eq":
      return actualNorm === expectedNorm || String(actual) === String(expected);
    case "ne":
      return actualNorm !== expectedNorm && String(actual) !== String(expected);
    case "gt": {
      const a = toNumber(actual);
      const b = toNumber(expected);
      return a !== null && b !== null ? a > b : false;
    }
    case "lt": {
      const a = toNumber(actual);
      const b = toNumber(expected);
      return a !== null && b !== null ? a < b : false;
    }
    case "contains":
      if (Array.isArray(actual)) return actual.includes(expected);
      if (typeof actual === "string") return actual.includes(String(expected));
      return false;
    default:
      return false;
  }
}

function isGroup(c: Condition): c is GroupCondition {
  return (
    Array.isArray((c as GroupCondition).conditions) &&
    ((c as GroupCondition).type === "all" ||
      (c as GroupCondition).type === "any" ||
      (c as GroupCondition).type === "none")
  );
}

function matchAtom(
  cond: AtomCondition,
  vars: RuntimeVariables,
  completedBeats: ReadonlySet<string>,
  codex: CodexLedger,
  unlockedAchievements: ReadonlySet<string> = new Set(),
): boolean {
  const operator = cond.operator ?? "eq";
  const key = cond.key;

  switch (cond.type) {
    case "memory": {
      if (key === undefined || !(key in vars.memory)) return operator === "ne";
      return compare(unwrap(vars.memory[key]), operator, cond.value);
    }
    case "flag": {
      if (key === undefined || !(key in vars.flags)) return operator === "ne";
      return compare(unwrap(vars.flags[key]), operator, cond.value);
    }
    case "character_state": {
      // key 格式: "characterId.field"
      if (!key) return operator === "ne";
      const dot = key.indexOf(".");
      if (dot < 0) return operator === "ne";
      const charId = key.slice(0, dot);
      const field = key.slice(dot + 1);
      const state = vars.characters[charId];
      if (!state || !(field in state)) return operator === "ne";
      return compare(state[field], operator, cond.value);
    }
    case "relationship": {
      // key 格式: "charA.charB.field"
      if (!key) return operator === "ne";
      const parts = key.split(".");
      if (parts.length < 3) return operator === "ne";
      const [charA, charB, field] = parts;
      const bucket = vars.relationships?.[charA]?.[charB];
      if (!bucket || !(field in bucket)) return operator === "ne";
      return compare(bucket[field], operator, cond.value);
    }
    case "achievement":
      return key ? unlockedAchievements.has(key) : false;
    case "codex": {
      // key 格式: "characterRefId.memoryKey"（跨作品 IP 账本，v1.6）
      if (!key) return operator === "ne";
      const dot = key.indexOf(".");
      if (dot < 0) return operator === "ne";
      const charRef = key.slice(0, dot);
      const memKey = key.slice(dot + 1);
      const bucket = codex[charRef];
      if (!bucket || !(memKey in bucket)) return operator === "ne";
      return compare(unwrap(bucket[memKey]), operator, cond.value);
    }
    case "node_completed":
      return cond.value != null ? completedBeats.has(String(cond.value)) : false;
    default:
      return false;
  }
}

/**
 * 评估条件。空条件视为满足（true）。
 * @param completedBeats 已完成 Beat id 集合（用于 node_completed）
 * @param unlockedAchievements 已解锁成就 key 集合（v2 Ginkgo）
 */
export function evaluateCondition(
  condition: Condition | null | undefined,
  vars: RuntimeVariables,
  completedBeats: ReadonlySet<string> = new Set(),
  codex: CodexLedger = {},
  unlockedAchievements: ReadonlySet<string> = new Set(),
): boolean {
  if (!condition) return true;

  if (isGroup(condition)) {
    const results = condition.conditions.map((c) =>
      matchAtom(c, vars, completedBeats, codex, unlockedAchievements),
    );
    switch (condition.type) {
      case "all":
        return results.every(Boolean);
      case "any":
        return results.some(Boolean);
      case "none":
        return !results.some(Boolean);
      default:
        return false;
    }
  }

  return matchAtom(
    condition as AtomCondition,
    vars,
    completedBeats,
    codex,
    unlockedAchievements,
  );
}

/**
 * 深拷贝运行时变量（保证纯函数不可变）。
 *
 * 四个子表一律 `?? {}`：类型上它们必填，但 `restore()` 的入参来自磁盘/云端的旧存档，
 * 少一个键是真实可能（`relationships` 就是后加的）。原先只有 relationships 兜了底，
 * 旧档缺 `characters` 时播放页直接 `Cannot convert undefined or null to object` 白屏——
 * 边界上读来的数据按边界处理，不做类型上的乐观假设。
 */
export function cloneVariables(vars: RuntimeVariables): RuntimeVariables {
  const relationships = vars.relationships ?? {};
  return {
    memory: { ...vars.memory ?? {} },
    flags: { ...vars.flags ?? {} },
    characters: Object.fromEntries(
      Object.entries(vars.characters ?? {}).map(([k, v]) => [k, { ...v }]),
    ),
    relationships: Object.fromEntries(
      Object.entries(relationships).map(([a, targets]) => [
        a,
        Object.fromEntries(
          Object.entries(targets).map(([b, fields]) => [b, { ...fields }]),
        ),
      ]),
    ),
  };
}

/** 应用一组效果，返回新的变量对象（不修改入参）。语义对齐 player.py _apply_effects */
export function applyEffects(
  vars: RuntimeVariables,
  effects: readonly Effect[] | undefined,
): RuntimeVariables {
  if (!effects || effects.length === 0) return vars;
  const next = cloneVariables(vars);

  for (const effect of effects) {
    const { type, key, value } = effect;
    if (type === "codex_write") continue;
    if (type === "memory") {
      next.memory[key] = value;
    } else if (type === "flag") {
      next.flags[key] = value;
    } else if (type === "character_state") {
      const dot = key.indexOf(".");
      if (dot < 0) continue;
      const charId = key.slice(0, dot);
      const field = key.slice(dot + 1);
      if (!next.characters[charId]) next.characters[charId] = {};
      next.characters[charId][field] = value;
    } else if (type === "relationship") {
      const parts = key.split(".");
      if (parts.length < 3) continue;
      const [charA, charB, field] = parts;
      if (!next.relationships) next.relationships = {};
      if (!next.relationships[charA]) next.relationships[charA] = {};
      if (!next.relationships[charA][charB]) next.relationships[charA][charB] = {};
      next.relationships[charA][charB][field] = value;
    }
  }

  return next;
}

/** 应用 codex_write 效果，写入跨作品 IP 账本（v1.6） */
export function applyCodexWrites(
  codex: CodexLedger,
  effects: readonly Effect[] | undefined,
): CodexLedger {
  if (!effects?.length) return codex;
  const next = cloneCodex(codex);
  for (const effect of effects) {
    if (effect.type !== "codex_write") continue;
    const dot = effect.key.indexOf(".");
    if (dot < 0) continue;
    const charRef = effect.key.slice(0, dot);
    const memKey = effect.key.slice(dot + 1);
    if (!next[charRef]) next[charRef] = {};
    next[charRef][memKey] = effect.value;
  }
  return next;
}
