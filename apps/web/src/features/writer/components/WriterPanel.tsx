import { useEffect, useMemo, useState } from "react";
import { parseAxs } from "@axiforge/axs";
import { Button } from "@/shared/components/ui";
import AxsCodeEditor from "./AxsCodeEditor";

interface WriterPanelProps {
  source: string;
  roles: Record<string, string>;
  roleNames: string[];
  onChange: (source: string) => void;
  onSave: () => void;
  saving?: boolean;
  dirty?: boolean;
  scrollToLine?: number | null;
  onBeatSelect?: (beat: { id: string; line: number; title: string }) => void;
  onOpenInFlow?: (nodeId: string) => void;
}

const DIRECTIVE_HINTS = [
  "@bg",
  "@bgm",
  "@se",
  "@voice",
  "@wait",
  "@show",
  "@hide",
  "@move",
  "@transition",
  "@fx",
  "@camera",
  "@flag",
  "@memory",
  "@state",
  "@codex",
];

export default function WriterPanel({
  source,
  roles,
  roleNames,
  onChange,
  onSave,
  saving,
  dirty,
  scrollToLine,
  onBeatSelect,
  onOpenInFlow,
}: WriterPanelProps) {
  const [cursorLine, setCursorLine] = useState(1);

  const parsed = useMemo(
    () => parseAxs(source, { roles }),
    [source, roles],
  );

  const lines = source.split(/\r?\n/);
  const lineCount = Math.max(lines.length, 1);
  const activeBeat = useMemo(() => {
    const at = parsed.beats.find((b) => b.line === cursorLine);
    if (at) return at;
    let last: (typeof parsed.beats)[number] | undefined;
    for (const b of parsed.beats) {
      if (b.line <= cursorLine) last = b;
      else break;
    }
    return last;
  }, [parsed.beats, cursorLine]);

  useEffect(() => {
    setCursorLine((prev) => Math.min(prev, lineCount));
  }, [lineCount]);

  const insertSnippet = (snippet: string) => {
    onChange(source.trimEnd() ? `${source.trimEnd()}\n${snippet}` : snippet);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>{parsed.beats.length} 个 Beat</span>
          <span>·</span>
          <span>{parsed.edges.length} 条边</span>
          {parsed.diagnostics.length > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-600">
                {parsed.diagnostics.length} 条提示
              </span>
            </>
          )}
          {dirty && (
            <>
              <span>·</span>
              <span className="text-brand">未保存</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => insertSnippet("# 新桥段\n旁白：")}>
            + Beat
          </Button>
          <Button size="md" onClick={onSave} loading={saving} disabled={saving}>
            {saving ? "保存中..." : "保存剧本"}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface px-2 shadow-sm">
          <AxsCodeEditor
            value={source}
            onChange={(next) => onChange(next)}
            onCursorLine={setCursorLine}
            scrollToLine={scrollToLine}
            diagnostics={parsed.diagnostics}
            roleNames={roleNames}
            directives={DIRECTIVE_HINTS}
            placeholder={`# 开始 @stage(默认舞台)\n@bg room\n角色名: 台词\n> 选项一 -> 下一幕`}
          />
        </div>

        <aside className="flex w-56 shrink-0 flex-col gap-3 overflow-y-auto">
          {parsed.beats.length > 0 && (
            <section className="rounded-xl border border-border bg-surface p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-medium text-ink-muted">桥段</h3>
              <ul className="space-y-1">
                {parsed.beats.map((beat) => (
                  <li key={beat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onBeatSelect?.({
                          id: beat.id,
                          line: beat.line,
                          title: beat.title,
                        });
                        setCursorLine(beat.line);
                      }}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs ${
                        activeBeat?.id === beat.id
                          ? "bg-brand/10 font-medium text-brand"
                          : "text-ink-muted hover:bg-canvas"
                      }`}
                      title={`L${beat.line} ${beat.title}`}
                    >
                      L{beat.line} {beat.title}
                    </button>
                  </li>
                ))}
              </ul>
              {onOpenInFlow && activeBeat && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full text-xs"
                  onClick={() => onOpenInFlow(activeBeat.id)}
                >
                  在画布中定位
                </Button>
              )}
            </section>
          )}

          <section className="rounded-xl border border-border bg-surface p-3 shadow-sm">
            <h3 className="mb-2 text-xs font-medium text-ink-muted">角色</h3>
            <div className="flex flex-wrap gap-1">
              {roleNames.length ? (
                roleNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => insertSnippet(`${name}: `)}
                    className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand hover:bg-brand/15"
                  >
                    {name}
                  </button>
                ))
              ) : (
                <p className="text-xs text-ink-muted">先在剧本中绑定角色</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-3 shadow-sm">
            <h3 className="mb-2 text-xs font-medium text-ink-muted">指令</h3>
            <div className="flex flex-wrap gap-1">
              {DIRECTIVE_HINTS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => insertSnippet(cmd)}
                  className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-muted hover:bg-border/40"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </section>

          {parsed.diagnostics.length > 0 && (
            <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <h3 className="mb-2 text-xs font-medium text-amber-800">诊断</h3>
              <ul className="space-y-1.5">
                {parsed.diagnostics.map((d, i) => (
                  <li key={`${d.line}-${i}`} className="text-[11px] leading-snug text-amber-900">
                    <span className="font-mono text-amber-700">L{d.line}</span> {d.message}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
