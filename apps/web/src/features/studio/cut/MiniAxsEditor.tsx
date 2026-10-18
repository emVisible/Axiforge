import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Code2 } from "lucide-react";
import type { Instruction } from "@axiforge/core";
import { parseAxs, printAxs } from "@axiforge/axs";
import type { AxsDiagnostic } from "@axiforge/axs";
import AxsCodeEditor from "@/features/writer/components/AxsCodeEditor";

function scriptToAxsSource(
  script: Instruction[],
  beatTitle: string,
  roles?: Record<string, string>,
  diagnostics?: AxsDiagnostic[],
): string {
  const beat = {
    id: "",
    title: beatTitle || "未命名",
    line: 1,
    script,
    effects: [] as never[],
    jumps: [] as string[],
    passthrough: [] as string[],
  };
  /*
   * 发射侧的告警走的是**可选出参**：文本输出与之前逐字相同，只把"这一拍的第二个分支组被丢掉"登记下来。
   * 解析看不到这件事（文本里本来就只剩一组），所以这条只能由发射器报——而发射器今天只在有人递数组时才说话。
   */
  return printAxs(
    { beats: [beat as never], edges: [], diagnostics: [] },
    { roles, diagnostics },
  );
}

/** 指令下标 -> AXS 行号（基于 lineMap，回退为标题后顺序） */
function lineForInstruction(source: string, highlightIndex: number): number | null {
  if (highlightIndex < 0) return null;
  const doc = parseAxs(source);
  const beat = doc.beats[0];
  if (!beat) return null;
  if (beat.lineMap && highlightIndex < beat.lineMap.length) {
    const line = beat.lineMap[highlightIndex];
    if (line != null) return line;
  }
  // 回退：标题占 1 行，指令从第 2 行开始顺序排列（融合的 show+say 已合并，不精确但可用）
  if (beat.lineMap) return null;
  return highlightIndex + 2;
}

/** AXS 行号 -> 指令下标（找到 lineMap 中等于该行的首个下标） */
function instructionForLine(source: string, line: number): number | null {
  const doc = parseAxs(source);
  const beat = doc.beats[0];
  if (!beat?.lineMap) return null;
  const idx = beat.lineMap.findIndex((l) => l === line);
  if (idx >= 0) return idx;
  // 点击标题行不触发
  if (line === 1) return null;
  // 回退：标题后顺序
  const approx = line - 2;
  if (approx >= 0 && approx < beat.script.length) return approx;
  return null;
}

export interface MiniAxsEditorProps {
  script: Instruction[];
  selectedIndex: number;
  beatTitle: string;
  roles?: Record<string, string>;
  roleNames?: string[];
  onSelectClip: (index: number) => void;
  onScriptChange: (next: Instruction[]) => void;
}

const DIRECTIVES = ["@bg", "@bgm", "@se", "@voice", "@wait", "@show", "@hide", "@move", "@fx", "@camera", "@transition", "@flag", "@memory", "@state", "@codex", "@relation"];

export default function MiniAxsEditor({
  script,
  selectedIndex,
  beatTitle,
  roles,
  roleNames = [],
  onSelectClip,
  onScriptChange,
}: MiniAxsEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [diagnostics, setDiagnostics] = useState<AxsDiagnostic[]>([]);

  // 生成基准 AXS 源码（外部 script 变更时更新）；同一趟打印顺带把发射侧诊断收下来
  const { baseSource, printerDiagnostics } = useMemo(() => {
    const collected: AxsDiagnostic[] = [];
    const text = scriptToAxsSource(script, beatTitle, roles, collected);
    return { baseSource: text, printerDiagnostics: collected };
  }, [script, beatTitle, roles]);

  const [source, setSource] = useState(baseSource);
  /*
   * 两半都要显示：解析报的是"文本里读不回来什么"，发射侧报的是"这一拍的 IR 里有第二组分支、
   * 印出来的文本只剩第一组"。后者在文本里根本没有痕迹，所以只能从打印那一趟拿。按消息去重，
   * 免得当同一件事被两边各报一次。
   */
  const shownDiagnostics = useMemo(
    () => [
      ...diagnostics,
      ...printerDiagnostics.filter((p) => !diagnostics.some((d) => d.message === p.message)),
    ],
    [diagnostics, printerDiagnostics],
  );
  const lastScriptJsonRef = useRef(JSON.stringify(script));
  const internalChangeRef = useRef(false);

  // 外部 script 变更（拖拽、ScriptEditor 编辑）→ 同步 source，但如果是内部编辑触发的则跳过
  useEffect(() => {
    const json = JSON.stringify(script);
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      lastScriptJsonRef.current = json;
      return;
    }
    if (json === lastScriptJsonRef.current) return;
    lastScriptJsonRef.current = json;
    setSource(baseSource);
    // 重新解析以更新 diagnostics
    const doc = parseAxs(baseSource);
    setDiagnostics(doc.diagnostics);
  }, [script, baseSource]);

  // 初始 diagnostics
  useEffect(() => {
    const doc = parseAxs(source);
    setDiagnostics(doc.diagnostics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback(
    (nextSource: string) => {
      setSource(nextSource);
      const doc = parseAxs(nextSource);
      setDiagnostics(doc.diagnostics);
      // 仅在无错误时写回（避免半输入态覆盖）
      const hasError = doc.diagnostics.some((d) => d.severity === "error");
      if (hasError) return;
      const beat = doc.beats[0];
      if (!beat) return;
      const nextScript = beat.script as Instruction[];
      const nextJson = JSON.stringify(nextScript);
      if (nextJson === lastScriptJsonRef.current) return;
      // 处理标题变更：标题由 beat.title 承载，不通过 script 回写
      internalChangeRef.current = true;
      lastScriptJsonRef.current = nextJson;
      onScriptChange(nextScript);
    },
    [onScriptChange],
  );

  const handleCursorLine = useCallback(
    (line: number) => {
      const idx = instructionForLine(source, line);
      if (idx != null && idx !== selectedIndex) {
        onSelectClip(idx);
      }
    },
    [source, selectedIndex, onSelectClip],
  );

  const scrollToLine = useMemo(() => lineForInstruction(source, selectedIndex), [source, selectedIndex]);

  return (
    <div className="shrink-0 border-b border-border bg-panel">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-raised"
      >
        <span className="flex items-center gap-1.5 text-2xs font-medium text-ink">
          <Code2 className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
          AXS 片段
          <span className="font-normal text-ink-faint">· {script.length} 条指令</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-faint transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>
      {!collapsed && (
        <div className="border-t border-border">
          <div className="h-[160px] overflow-hidden">
            <AxsCodeEditor
              value={source}
              onChange={handleChange}
              scrollToLine={scrollToLine}
              onCursorLine={handleCursorLine}
              diagnostics={shownDiagnostics}
              roleNames={roleNames}
              directives={DIRECTIVES}
              placeholder="# Beat 标题&#10;角色: 台词"
            />
          </div>
          {shownDiagnostics.length > 0 && (
            <div className="border-t border-border bg-surface-raised px-3 py-1.5 text-3xs text-ink-faint">
              {shownDiagnostics[0]?.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
