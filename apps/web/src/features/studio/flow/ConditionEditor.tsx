import { cn, inputCompact, labelSm } from "@/shared/components/ui";

import {
  CHARACTER_STATE_PRESETS,
  CONDITION_TYPES,
  OPERATORS,
  flowSelectClass,
  parseCharStateKey,
  type ConditionItem,
  type ProjectRoleOption,
} from "./types";

interface ConditionEditorProps {
  conditions: ConditionItem[];
  onChange: (c: ConditionItem[]) => void;
  roles: ProjectRoleOption[];
}

export default function ConditionEditor({
  conditions,
  onChange,
  roles,
}: ConditionEditorProps) {
  const add = () =>
    onChange([
      ...conditions,
      { type: "memory", key: "", operator: "eq", value: "" },
    ]);
  const update = (i: number, d: Partial<ConditionItem>) => {
    const u = [...conditions];
    u[i] = { ...u[i], ...d };
    if (d.type && d.type !== conditions[i]?.type) {
      u[i].key = "";
      u[i].value = "";
    }
    onChange(u);
  };
  const remove = (i: number) => onChange(conditions.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelSm}>触发条件</label>
        <button
          type="button"
          onClick={add}
          className="text-3xs font-medium text-brand hover:underline"
        >
          + 添加
        </button>
      </div>
      {conditions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-canvas/50 py-6 text-center">
          <p className="text-2xs text-ink-muted/60">无条件 — 始终可用</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((c, i) => {
            const tc =
              CONDITION_TYPES.find((t) => t.value === c.type) ||
              CONDITION_TYPES[0];
            const isCS = c.type === "character_state";
            const isCodex = c.type === "codex";
            const { charId, field: spk } = parseCharStateKey(c.key);
            const { charId: codexChar, field: codexMemKey } = parseCharStateKey(
              isCodex ? c.key : "",
            );
            const mp = CHARACTER_STATE_PRESETS.find((p) => p.key === spk);
            return (
              <div
                key={i}
                className={`rounded-xl border bg-surface p-3 ${tc.color}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={c.type}
                    onChange={(e) =>
                      update(i, {
                        type: e.target.value as ConditionItem["type"],
                      })
                    }
                    className="cursor-pointer border-none bg-transparent text-2xs font-medium outline-none"
                  >
                    {CONDITION_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="ml-auto text-xs text-ink-muted/60 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                {c.type === "node_completed" ? (
                  <input
                    value={c.key}
                    onChange={(e) => update(i, { key: e.target.value })}
                    placeholder="节点 ID"
                    className={cn(inputCompact, "w-full bg-surface")}
                  />
                ) : isCodex ? (
                  <div className="space-y-1.5">
                    <select
                      value={codexChar}
                      onChange={(e) => {
                        const cid = e.target.value;
                        update(i, {
                          key: cid && codexMemKey ? `${cid}.${codexMemKey}` : "",
                        });
                      }}
                      className={flowSelectClass}
                    >
                      <option value="">选择角色...</option>
                      {roles.map((r) => (
                        <option key={r.characterRefId} value={r.characterRefId}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={codexMemKey}
                        onChange={(e) => {
                          update(i, {
                            key: codexChar && e.target.value
                              ? `${codexChar}.${e.target.value}`
                              : "",
                          });
                        }}
                        placeholder="记忆键名"
                        className={cn(flowSelectClass, "flex-1")}
                      />
                      <select
                        value={c.operator}
                        onChange={(e) =>
                          update(i, {
                            operator: e.target
                              .value as ConditionItem["operator"],
                          })
                        }
                        className={cn(flowSelectClass, "w-12 px-1")}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      value={c.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                      placeholder="期望值"
                      className={cn(inputCompact, "w-full bg-surface")}
                    />
                    <p className="text-3xs text-ink-muted">
                      查询玩家在其它作品中留下的角色记忆（RN Codex）
                    </p>
                  </div>
                ) : isCS ? (
                  <div className="space-y-1.5">
                    <select
                      value={charId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        update(i, {
                          key: cid && spk ? `${cid}.${spk}` : "",
                        });
                      }}
                      className={flowSelectClass}
                    >
                      <option value="">选择角色...</option>
                      {roles.map((r) => (
                        <option key={r.characterRefId} value={r.characterRefId}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={spk}
                        onChange={(e) => {
                          const p = CHARACTER_STATE_PRESETS.find(
                            (x) => x.key === e.target.value,
                          );
                          update(i, {
                            key: charId && e.target.value
                              ? `${charId}.${e.target.value}`
                              : "",
                            value: p?.values?.[0] || "",
                          });
                        }}
                        className={cn(flowSelectClass, "flex-1")}
                      >
                        <option value="">选择状态...</option>
                        {CHARACTER_STATE_PRESETS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={c.operator}
                        onChange={(e) =>
                          update(i, {
                            operator: e.target
                              .value as ConditionItem["operator"],
                          })
                        }
                        className={cn(flowSelectClass, "w-12 px-1")}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {mp && mp.values.length > 0 ? (
                      <select
                        value={c.value}
                        onChange={(e) => update(i, { value: e.target.value })}
                        className={flowSelectClass}
                      >
                        {mp.values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={c.value}
                        onChange={(e) => update(i, { value: e.target.value })}
                        placeholder="值"
                        className={cn(inputCompact, "w-full bg-surface")}
                      />
                    )}
                    <p className="text-3xs text-ink-muted">
                      {roles.length === 0
                        ? "请先在剧本详情页关联角色"
                        : "选择剧本已关联的角色"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={c.key}
                      onChange={(e) => update(i, { key: e.target.value })}
                      placeholder="键名"
                      className={cn(flowSelectClass, "flex-1")}
                    />
                    <select
                      value={c.operator}
                      onChange={(e) =>
                        update(i, {
                          operator: e.target.value as ConditionItem["operator"],
                        })
                      }
                      className={cn(flowSelectClass, "w-12 px-1")}
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={c.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                      placeholder="值"
                      className={cn(flowSelectClass, "w-20")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
