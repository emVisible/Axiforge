import { useState } from "react";
import { evaluateCondition } from "@axiforge/core";
import type { Condition, RuntimeVariables } from "@axiforge/core";
import { cn, labelSm } from "@/shared/components/ui";

export interface SimTarget {
  edgeId: string;
  label: string;
  targetTitle: string;
  trigger: Condition | null;
}

interface FakeVar {
  scope: "memory" | "flag" | "character";
  key: string;
  value: string;
}

function parseValue(raw: string): unknown {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
  return raw;
}

function buildVars(list: FakeVar[]): RuntimeVariables {
  const vars: RuntimeVariables = { memory: {}, flags: {}, characters: {}, relationships: {} };
  for (const v of list) {
    if (!v.key) continue;
    const val = parseValue(v.value);
    if (v.scope === "memory") vars.memory[v.key] = val;
    else if (v.scope === "flag") vars.flags[v.key] = val;
    else {
      const dot = v.key.indexOf(".");
      if (dot < 0) continue;
      const cid = v.key.slice(0, dot);
      const field = v.key.slice(dot + 1);
      (vars.characters[cid] ??= {})[field] = val;
    }
  }
  return vars;
}

const SCOPE_LABEL: Record<FakeVar["scope"], string> = {
  memory: "记忆",
  flag: "标志",
  character: "角色",
};

/**
 * 条件模拟器（桥3）：填入假 memory/标志/关系值，用 @axiforge/core 的同一求值器
 * 预演从当前节点出发会走哪条边——编辑器、编译器、运行时三处行为一致的可视化证据。
 */
export default function ConditionSimulator({ targets }: { targets: SimTarget[] }) {
  const [vars, setVars] = useState<FakeVar[]>([]);

  const runtimeVars = buildVars(vars);
  const results = targets.map((t) => ({
    ...t,
    enabled: evaluateCondition(t.trigger, runtimeVars),
  }));
  const firstEnabled = results.find((r) => r.enabled);

  const setVar = (i: number, patch: Partial<FakeVar>) =>
    setVars(vars.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-3">
      <div>
        <label className={cn(labelSm, "block")}>模拟变量</label>
        <p className="mt-1 text-2xs leading-relaxed text-ink-muted">
          填入假设的记忆/关系值，预览从本节点将走向哪条分支。角色用
          <code className="mx-1 rounded bg-canvas px-1">角色id.字段</code>
          形式（如 <code className="rounded bg-canvas px-1">c1.affection</code>）。
        </p>
      </div>

      {vars.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <select
            className="rounded-md border border-border bg-surface px-1.5 py-1 text-2xs"
            value={v.scope}
            onChange={(e) => setVar(i, { scope: e.target.value as FakeVar["scope"] })}
          >
            {(Object.keys(SCOPE_LABEL) as FakeVar["scope"][]).map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABEL[s]}
              </option>
            ))}
          </select>
          <input
            className="w-24 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs"
            placeholder="键"
            value={v.key}
            onChange={(e) => setVar(i, { key: e.target.value })}
          />
          <input
            className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-xs"
            placeholder="值"
            value={v.value}
            onChange={(e) => setVar(i, { value: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setVars(vars.filter((_, j) => j !== i))}
            className="px-1 text-red-400 hover:text-red-600"
            aria-label="删除"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setVars([...vars, { scope: "memory", key: "", value: "" }])
        }
        className="rounded-lg border border-dashed border-border px-2.5 py-1 text-2xs text-ink-muted hover:border-brand hover:text-brand"
      >
        + 添加变量
      </button>

      <div className="pt-2">
        <label className={cn(labelSm, "block")}>出边预演（{results.length}）</label>
        {results.length === 0 ? (
          <p className="mt-1 text-xs text-ink-muted">本节点没有出边</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {results.map((r) => {
              const isTaken = firstEnabled?.edgeId === r.edgeId;
              return (
                <div
                  key={r.edgeId}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                    r.enabled
                      ? isTaken
                        ? "border-brand bg-brand/5"
                        : "border-emerald-200 bg-emerald-50/50"
                      : "border-border bg-canvas/40 opacity-60",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink">{r.targetTitle}</span>
                    {r.label && (
                      <span className="rounded bg-brand/10 px-1 py-0.5 text-[9px] text-brand">
                        {r.label}
                      </span>
                    )}
                  </span>
                  <span className={r.enabled ? "text-emerald-600" : "text-ink-muted"}>
                    {isTaken ? "将走此边" : r.enabled ? "可行" : "条件不满足"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
