import { useEffect, useRef, useState } from "react";
import type { Instruction, InstructionOp, ChoiceOption } from "@axiforge/core";
import {
  OP_LABEL,
  OP_META,
  POSITIONS,
  defaultInstruction,
} from "./instructionOps";
import { Input, Select, Textarea, cn, labelSm, Button } from "@/shared/components/ui";
import { applyDraft, requestDraft } from "@/shared/api/draftDispatch";
import LlmStatusBadge from "@/shared/components/LlmStatusBadge";
import { getCreatorId } from "@/shared/lib/creatorId";

interface RoleOption {
  characterRefId: string;
  name: string;
  spriteKeys?: string[];
}
interface NodeOption {
  id: string;
  title: string;
}

interface ScriptEditorProps {
  script: Instruction[];
  roles: RoleOption[];
  nodes: NodeOption[];
  onChange: (next: Instruction[]) => void;
  highlightIndex?: number | null;
}


const TRANSITION_KINDS = ["fade", "dissolve", "wipe", "cut"];
const CAMERA_ACTIONS = ["zoom", "pan", "shake", "reset"];
const FX_EFFECTS = ["flash", "rain", "snow", "sakura", "none"];

export default function ScriptEditor({
  script,
  roles,
  nodes,
  onChange,
  highlightIndex = null,
}: ScriptEditorProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [prose, setProse] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRun, setAiRun] = useState<{ source?: string; degradedFrom?: string }>({});
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightIndex == null || highlightIndex < 0) return;
    highlightRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightIndex]);

  const runAiDraft = async (mode: "replace" | "append") => {
    if (!prose.trim()) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await requestDraft({
        prose,
        roleNames: roles.map((r) => r.name),
        authorId: getCreatorId(),
      });
      setAiRun({ source: res.source, degradedFrom: res.degradedFrom });
      onChange(applyDraft(res, script, mode));
      setAiOpen(false);
      setProse("");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "生成失败，请检查格式后重试");
    } finally {
      setAiBusy(false);
    }
  };

  const patch = (index: number, next: Instruction) => {
    onChange(script.map((s, i) => (i === index ? next : s)));
  };
  const add = (op: InstructionOp) => onChange([...script, defaultInstruction(op)]);
  const remove = (index: number) => onChange(script.filter((_, i) => i !== index));
  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= script.length) return;
    const next = [...script];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  const characterField = (
    value: string | null | undefined,
    onSet: (v: string | null) => void,
    { allowNarrator = false }: { allowNarrator?: boolean } = {},
  ) => (
    <Select
      label="角色"
      value={value ?? ""}
      onChange={(e) => onSet(e.target.value || null)}
    >
      {allowNarrator && <option value="">旁白（无角色）</option>}
      {!allowNarrator && <option value="">选择角色…</option>}
      {roles.map((r) => (
        <option key={r.characterRefId} value={r.characterRefId}>
          {r.name}
        </option>
      ))}
    </Select>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xs leading-relaxed text-ink-muted">
          演出脚本按顺序播放。填写后将取代下方「内容」的单句对话（ADR-009）。
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <LlmStatusBadge lastSource={aiRun.source} degradedFrom={aiRun.degradedFrom} />
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="rounded-lg border border-brand/30 px-2 py-1 text-3xs text-brand hover:bg-brand/10"
          >
            AI 草稿
          </button>
        </div>
      </div>

      {aiOpen && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 space-y-2">
          <p className="text-2xs text-ink-muted">
            粘贴散文/大纲。格式：<code className="text-3xs">角色名：台词</code>、
            <code className="text-3xs">【旁白：…】</code>、
            <code className="text-3xs">{"> 选项A | 选项B"}</code>
          </p>
          <Textarea
            rows={6}
            value={prose}
            onChange={(e) => setProse(e.target.value)}
            placeholder={"【旁白：雨夜。】\n堰纱：……你为什么会来这里？\n> 我来帮你 | 只是路过"}
          />
          {aiError && <p className="text-2xs text-red-500">{aiError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={aiBusy} onClick={() => runAiDraft("replace")}>
              替换脚本
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={aiBusy}
              onClick={() => runAiDraft("append")}
            >
              追加到末尾
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAiOpen(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {script.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-canvas/50 px-3 py-6 text-center text-xs text-ink-muted">
          还没有演出指令，点下方按钮添加
        </div>
      )}

      {script.map((inst, i) => (
        <div
          key={i}
          ref={highlightIndex === i ? highlightRef : undefined}
          className={cn(
            "rounded-xl border border-border bg-surface p-3 shadow-sm",
            highlightIndex === i && "border-brand ring-2 ring-brand/20",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-md bg-brand/10 px-2 py-0.5 text-3xs font-medium text-brand">
              {i + 1}. {OP_LABEL[inst.op] || inst.op}
            </span>
            <div className="flex items-center gap-1 text-ink-muted">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="px-1 hover:text-ink disabled:opacity-30"
                disabled={i === 0}
                aria-label="上移"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="px-1 hover:text-ink disabled:opacity-30"
                disabled={i === script.length - 1}
                aria-label="下移"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="px-1 text-red-400 hover:text-red-600"
                aria-label="删除"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {inst.op === "say" && (
              <>
                {characterField(
                  inst.characterId,
                  (v) => patch(i, { ...inst, characterId: v }),
                  { allowNarrator: true },
                )}
                <Textarea
                  label="文本"
                  rows={2}
                  value={inst.text}
                  onChange={(e) => patch(i, { ...inst, text: e.target.value })}
                  placeholder="台词… 支持 [ruby:汉字|かんじ] 注音"
                />
              </>
            )}

            {inst.op === "narration" && (
              <Textarea
                label="旁白"
                rows={2}
                value={inst.text}
                onChange={(e) => patch(i, { ...inst, text: e.target.value })}
                placeholder="叙述性文字… 支持 [ruby:汉字|かんじ] 注音"
              />
            )}

            {inst.op === "move" && (
              <>
                {characterField(inst.characterId, (v) =>
                  patch(i, { ...inst, characterId: v || "" }),
                )}
                <Select
                  label="移动到"
                  value={inst.position ?? "center"}
                  onChange={(e) => patch(i, { ...inst, position: e.target.value })}
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
                <Input
                  label="时长（毫秒）"
                  type="number"
                  value={String(inst.ms ?? 300)}
                  onChange={(e) =>
                    patch(i, { ...inst, ms: parseInt(e.target.value) || 0 })
                  }
                />
              </>
            )}

            {inst.op === "transition" && (
              <>
                <Select
                  label="转场方式"
                  value={inst.kind}
                  onChange={(e) =>
                    patch(i, { ...inst, kind: e.target.value as typeof inst.kind })
                  }
                >
                  {TRANSITION_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
                <Input
                  label="时长（毫秒）"
                  type="number"
                  value={String(inst.ms ?? 400)}
                  onChange={(e) =>
                    patch(i, { ...inst, ms: parseInt(e.target.value) || 0 })
                  }
                />
              </>
            )}

            {inst.op === "camera" && (
              <>
                <Select
                  label="镜头动作"
                  value={inst.action}
                  onChange={(e) =>
                    patch(i, { ...inst, action: e.target.value as typeof inst.action })
                  }
                >
                  {CAMERA_ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
                {inst.action === "zoom" && (
                  <Input
                    label="缩放倍数"
                    type="number"
                    value={String(inst.scale ?? 1.2)}
                    onChange={(e) =>
                      patch(i, { ...inst, scale: parseFloat(e.target.value) || 1 })
                    }
                  />
                )}
                {inst.action === "pan" && (
                  <div className="flex gap-2">
                    <Input
                      label="X%"
                      type="number"
                      value={String(inst.x ?? 0)}
                      onChange={(e) =>
                        patch(i, { ...inst, x: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Y%"
                      type="number"
                      value={String(inst.y ?? 0)}
                      onChange={(e) =>
                        patch(i, { ...inst, y: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                )}
                {inst.action === "shake" && (
                  <Input
                    label="强度（像素）"
                    type="number"
                    value={String(inst.intensity ?? 8)}
                    onChange={(e) =>
                      patch(i, { ...inst, intensity: parseFloat(e.target.value) || 0 })
                    }
                  />
                )}
                <Input
                  label="时长（毫秒）"
                  type="number"
                  value={String(inst.ms ?? 300)}
                  onChange={(e) =>
                    patch(i, { ...inst, ms: parseInt(e.target.value) || 0 })
                  }
                />
              </>
            )}

            {inst.op === "fx" && (
              <>
                <Select
                  label="特效"
                  value={inst.effect}
                  onChange={(e) =>
                    patch(i, { ...inst, effect: e.target.value as typeof inst.effect })
                  }
                >
                  {FX_EFFECTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
                <Input
                  label="时长（毫秒，0 为持续）"
                  type="number"
                  value={String(inst.ms ?? 600)}
                  onChange={(e) =>
                    patch(i, { ...inst, ms: parseInt(e.target.value) || 0 })
                  }
                />
              </>
            )}

            {inst.op === "voice" && (
              <Input
                label="语音（资产 id 或 URL）"
                value={inst.sound ?? ""}
                onChange={(e) => patch(i, { ...inst, sound: e.target.value || null })}
                placeholder="voice 资源"
              />
            )}

            {inst.op === "show" && (
              <>
                {characterField(inst.characterId, (v) =>
                  patch(i, { ...inst, characterId: v || "" }),
                )}
                {(() => {
                  const keys =
                    roles.find((r) => r.characterRefId === inst.characterId)
                      ?.spriteKeys || [];
                  const listId = `sprites-${i}`;
                  const expressionId = `expression-${i}`;
                  return (
                    <div>
                      <label htmlFor={expressionId} className={cn(labelSm, "mb-1 block")}>表情</label>
                      <input
                        id={expressionId}
                        list={keys.length ? listId : undefined}
                        className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
                        value={inst.expression ?? ""}
                        onChange={(e) =>
                          patch(i, { ...inst, expression: e.target.value })
                        }
                        placeholder={
                          keys.length ? "选择或输入表情差分" : "如 smile / angry"
                        }
                      />
                      {keys.length > 0 && (
                        <datalist id={listId}>
                          {keys.map((k) => (
                            <option key={k} value={k} />
                          ))}
                        </datalist>
                      )}
                    </div>
                  );
                })()}
                <Select
                  label="位置"
                  value={inst.position ?? "center"}
                  onChange={(e) => patch(i, { ...inst, position: e.target.value })}
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </>
            )}

            {inst.op === "hide" &&
              characterField(inst.characterId, (v) =>
                patch(i, { ...inst, characterId: v || "" }),
              )}

            {inst.op === "bg" && (
              <Input
                label="背景（资产 id 或 URL）"
                value={inst.image}
                onChange={(e) => patch(i, { ...inst, image: e.target.value })}
                placeholder="/uploads/... 或场景背景"
              />
            )}

            {inst.op === "bgm" && (
              <Input
                label="音乐（资产 id 或 URL，留空停止）"
                value={inst.track ?? ""}
                onChange={(e) => patch(i, { ...inst, track: e.target.value || null })}
                placeholder="bgm 资源"
              />
            )}

            {inst.op === "se" && (
              <Input
                label="音效"
                value={inst.sound}
                onChange={(e) => patch(i, { ...inst, sound: e.target.value })}
                placeholder="se 资源"
              />
            )}

            {inst.op === "wait" && (
              <Input
                label="等待（毫秒）"
                type="number"
                value={String(inst.ms)}
                onChange={(e) =>
                  patch(i, { ...inst, ms: parseInt(e.target.value) || 0 })
                }
              />
            )}

            {inst.op === "choice" && (
              <ChoiceOptionsEditor
                options={inst.options}
                nodes={nodes}
                onChange={(options) => patch(i, { ...inst, options })}
              />
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {OP_META.map((m) => (
          <button
            key={m.op}
            type="button"
            onClick={() => add(m.op)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-2xs text-ink-muted shadow-sm hover:border-brand hover:text-brand"
          >
            + {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceOptionsEditor({
  options,
  nodes,
  onChange,
}: {
  options: ChoiceOption[];
  nodes: NodeOption[];
  onChange: (next: ChoiceOption[]) => void;
}) {
  const set = (index: number, next: ChoiceOption) =>
    onChange(options.map((o, i) => (i === index ? next : o)));
  return (
    <div className="space-y-2">
      <label className={cn(labelSm, "block")}>分支选项</label>
      {options.map((opt, i) => (
        <div key={i} className="rounded-lg border border-border/70 bg-canvas/40 p-2">
          <div className="mb-1.5 flex items-center gap-1.5">
            <input
              className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs"
              value={opt.label}
              onChange={(e) => set(i, { ...opt, label: e.target.value })}
              placeholder="选项文本"
            />
            <button
              type="button"
              onClick={() => onChange(options.filter((_, j) => j !== i))}
              className="px-1 text-red-400 hover:text-red-600"
              aria-label="删除选项"
            >
              ✕
            </button>
          </div>
          <select
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-2xs text-ink-muted"
            value={opt.to ?? ""}
            onChange={(e) => set(i, { ...opt, to: e.target.value || null })}
          >
            <option value="">跳转：按标签匹配连线（默认）</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                跳转到：{n.title}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, { label: "" }])}
        className="rounded-lg border border-dashed border-border px-2.5 py-1 text-2xs text-ink-muted hover:border-brand hover:text-brand"
      >
        + 添加选项
      </button>
    </div>
  );
}
