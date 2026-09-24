import { cn, inputCompact, labelSm } from "@/shared/components/ui";

import {
  CHARACTER_STATE_PRESETS,
  EFFECT_TYPES,
  flowSelectClass,
  parseCharStateKey,
  type EffectItem,
  type ProjectRoleOption,
} from "./types";

interface EffectEditorProps {
  effects: EffectItem[];
  onChange: (e: EffectItem[]) => void;
  roles: ProjectRoleOption[];
}

export default function EffectEditor({
  effects,
  onChange,
  roles,
}: EffectEditorProps) {
  const add = () =>
    onChange([...effects, { type: "memory", key: "", value: "" }]);
  const update = (i: number, d: Partial<EffectItem>) => {
    const u = [...effects];
    u[i] = { ...u[i], ...d };
    if (d.type && d.type !== effects[i]?.type) {
      u[i].key = "";
      u[i].value = "";
    }
    onChange(u);
  };
  const remove = (i: number) => onChange(effects.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelSm}>完成效果</label>
        <button
          type="button"
          onClick={add}
          className="text-3xs font-medium text-brand hover:underline"
        >
          + 添加
        </button>
      </div>
      {effects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-canvas/50 py-6 text-center">
          <p className="text-2xs text-ink-muted/60">无效果 — 纯叙事节点</p>
        </div>
      ) : (
        <div className="space-y-2">
          {effects.map((e, i) => {
            const tc =
              EFFECT_TYPES.find((t) => t.value === e.type) || EFFECT_TYPES[0];
            const isCS = e.type === "character_state";
            const isCodex = e.type === "codex_write";
            const { charId, field: spk } = parseCharStateKey(e.key);
            const { charId: codexChar, field: codexMemKey } = parseCharStateKey(
              isCodex ? e.key : "",
            );
            const mp = CHARACTER_STATE_PRESETS.find((p) => p.key === spk);
            return (
              <div
                key={i}
                className={`rounded-xl border bg-surface p-3 ${tc.color}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={e.type}
                    onChange={(ev) =>
                      update(i, { type: ev.target.value as EffectItem["type"] })
                    }
                    className="cursor-pointer border-none bg-transparent text-2xs font-medium outline-none"
                  >
                    {EFFECT_TYPES.map((et) => (
                      <option key={et.value} value={et.value}>
                        {et.label}
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
                {isCodex ? (
                  <div className="space-y-1.5">
                    <select
                      value={codexChar}
                      onChange={(ev) => {
                        const cid = ev.target.value;
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
                    <input
                      value={codexMemKey}
                      onChange={(ev) => {
                        update(i, {
                          key: codexChar && ev.target.value
                            ? `${codexChar}.${ev.target.value}`
                            : "",
                        });
                      }}
                      placeholder="记忆键名"
                      className={flowSelectClass}
                    />
                    <input
                      value={e.value}
                      onChange={(ev) => update(i, { value: ev.target.value })}
                      placeholder="写入值"
                      className={cn(inputCompact, "w-full bg-surface")}
                    />
                    <p className="text-3xs text-ink-muted">
                      写入跨作品 IP 账本，供后续作品读取
                    </p>
                  </div>
                ) : isCS ? (
                  <div className="space-y-1.5">
                    <select
                      value={charId}
                      onChange={(ev) => {
                        const cid = ev.target.value;
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
                    <select
                      value={spk}
                      onChange={(ev) => {
                        const p = CHARACTER_STATE_PRESETS.find(
                          (x) => x.key === ev.target.value,
                        );
                        update(i, {
                          key: charId && ev.target.value
                            ? `${charId}.${ev.target.value}`
                            : "",
                          value: p?.values?.[0] || "",
                        });
                      }}
                      className={flowSelectClass}
                    >
                      <option value="">选择状态...</option>
                      {CHARACTER_STATE_PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {mp && mp.values.length > 0 ? (
                      <select
                        value={e.value}
                        onChange={(ev) => update(i, { value: ev.target.value })}
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
                        value={e.value}
                        onChange={(ev) => update(i, { value: ev.target.value })}
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
                      value={e.key}
                      onChange={(ev) => update(i, { key: ev.target.value })}
                      placeholder="键名"
                      className={cn(flowSelectClass, "flex-1")}
                    />
                    <span className="text-2xs text-ink-muted">=</span>
                    <input
                      value={e.value}
                      onChange={(ev) => update(i, { value: ev.target.value })}
                      placeholder="值"
                      className={cn(flowSelectClass, "flex-1")}
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
