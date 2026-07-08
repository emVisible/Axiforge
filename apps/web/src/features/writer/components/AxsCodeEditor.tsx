import { useEffect, useRef } from "react";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import type { AxsDiagnostic } from "@axiforge/axs";

const axsTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    color: "var(--ax-ink)",
    backgroundColor: "transparent",
  },
  ".cm-scroller": {
    overflow: "auto",
    lineHeight: "1.5rem",
  },
  ".cm-content": {
    padding: "12px 0",
    caretColor: "var(--ax-brand)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--ax-ink-faint)",
  },
  ".cm-gutterElement": {
    padding: "0 10px 0 12px",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--ax-brand) 8%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--ax-brand)",
    fontWeight: "600",
  },
  ".cm-lintRange-error": { backgroundImage: "url('data:image/svg+xml,...')" },
});

function buildLineDecorations(view: EditorView): DecorationSet {
  const marks: { from: number; to: number; value: Decoration }[] = [];
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      const trimmed = text.trim();

      if (trimmed.startsWith("#")) {
        marks.push({
          from: line.from,
          to: line.to,
          value: Decoration.mark({ class: "cm-axs-heading" }),
        });
      } else if (trimmed.startsWith("@")) {
        const end = line.from + Math.min(text.indexOf(" ") > 0 ? text.indexOf(" ") : text.length, text.length);
        marks.push({
          from: line.from,
          to: end,
          value: Decoration.mark({ class: "cm-axs-directive" }),
        });
      } else if (trimmed.startsWith("//")) {
        marks.push({
          from: line.from,
          to: line.to,
          value: Decoration.mark({ class: "cm-axs-comment" }),
        });
      } else {
        const colon = text.indexOf(":");
        if (colon > 0 && !text.trimStart().startsWith(">")) {
          marks.push({
            from: line.from,
            to: line.from + colon,
            value: Decoration.mark({ class: "cm-axs-speaker" }),
          });
        }
      }

      pos = line.to + 1;
    }
  }
  return Decoration.set(marks, true);
}

const axsLineHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildLineDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildLineDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

function axsCompletions(roleNames: string[], directives: string[]) {
  return autocompletion({
    override: [
      (context: CompletionContext) => {
        const before = context.matchBefore(/[@\w\u4e00-\u9fff-]*/);
        if (!before || (before.from === before.to && !context.explicit)) return null;

        const word = before.text;
        const options = [
          ...directives.map((d) => ({ label: d, type: "keyword" as const })),
          ...roleNames.map((n) => ({ label: `${n}: `, type: "variable" as const })),
        ].filter((o) => o.label.startsWith(word) || word.startsWith("@"));

        return { from: before.from, options, validFor: /^[@\w\u4e00-\u9fff-:]*$/ };
      },
    ],
  });
}

function axsLinter(getDiagnostics: () => AxsDiagnostic[]): Extension {
  return linter((view) => {
    const out: Diagnostic[] = [];
    for (const d of getDiagnostics()) {
      const line = view.state.doc.line(Math.min(d.line, view.state.doc.lines));
      out.push({
        from: line.from,
        to: line.to,
        severity: d.severity === "error" ? "error" : "warning",
        message: d.message,
      });
    }
    return out;
  });
}

interface AxsCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  scrollToLine?: number | null;
  onCursorLine?: (line: number) => void;
  diagnostics: AxsDiagnostic[];
  roleNames: string[];
  directives: string[];
  placeholder?: string;
}

export default function AxsCodeEditor({
  value,
  onChange,
  onCursorLine,
  scrollToLine,
  diagnostics,
  roleNames,
  directives,
  placeholder,
}: AxsCodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onCursorRef = useRef(onCursorLine);
  const diagnosticsRef = useRef(diagnostics);
  const lintCompartment = useRef(new Compartment());

  onChangeRef.current = onChange;
  onCursorRef.current = onCursorLine;
  diagnosticsRef.current = diagnostics;

  useEffect(() => {
    if (!hostRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      axsTheme,
      axsLineHighlight,
      lintGutter(),
      lintCompartment.current.of(axsLinter(() => diagnosticsRef.current)),
      axsCompletions(roleNames, directives),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
        if (update.selectionSet || update.docChanged) {
          const line = update.state.doc.lineAt(update.state.selection.main.head).number;
          onCursorRef.current?.(line);
        }
      }),
      EditorView.contentAttributes.of({ "aria-label": "AXS 剧本编辑器" }),
    ];

    if (placeholder && !value) {
      extensions.push(
        EditorView.contentAttributes.of({ "data-placeholder": placeholder }),
      );
    }

    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: lintCompartment.current.reconfigure(
        axsLinter(() => diagnosticsRef.current),
      ),
    });
  }, [diagnostics, roleNames, directives]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || scrollToLine == null) return;
    const lineNo = Math.min(Math.max(1, scrollToLine), view.state.doc.lines);
    const line = view.state.doc.line(lineNo);
    view.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
    onCursorRef.current?.(lineNo);
  }, [scrollToLine]);

  return (
    <div className="axs-cm-host h-full min-h-0 flex-1 overflow-hidden">
      <style>{`
        .axs-cm-host .cm-editor { height: 100%; outline: none; background: transparent; }
        .axs-cm-host .cm-lineNumbers { min-width: 2.5rem; }
        [data-theme="light"] .axs-cm-host .cm-axs-heading { color: #4338ca; font-weight: 600; }
        [data-theme="light"] .axs-cm-host .cm-axs-directive { color: #0891b2; }
        [data-theme="light"] .axs-cm-host .cm-axs-speaker { color: #059669; font-weight: 500; }
        [data-theme="light"] .axs-cm-host .cm-axs-comment { color: #9ca3af; font-style: italic; }
        [data-theme="dark"] .axs-cm-host .cm-axs-heading { color: #a5b4fc; font-weight: 600; }
        [data-theme="dark"] .axs-cm-host .cm-axs-directive { color: #67e8f9; }
        [data-theme="dark"] .axs-cm-host .cm-axs-speaker { color: #6ee7b7; font-weight: 500; }
        [data-theme="dark"] .axs-cm-host .cm-axs-comment { color: var(--ax-ink-faint); font-style: italic; }
        [data-theme="dark"] .axs-cm-host .cm-cursor { border-left-color: var(--ax-ink); }
        [data-theme="dark"] .axs-cm-host .cm-selectionBackground { background: color-mix(in srgb, var(--ax-brand) 35%, transparent) !important; }
      `}</style>
      <div ref={hostRef} className="h-full" />
    </div>
  );
}
