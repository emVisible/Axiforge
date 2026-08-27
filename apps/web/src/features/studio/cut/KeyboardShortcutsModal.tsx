import { Modal } from "@/shared/components/ui";

export interface ShortcutRow {
  keys: string[];
  label: string;
}

const CUT_STUDIO_SHORTCUTS: ShortcutRow[] = [
  { keys: ["\\"], label: "切换 Outliner（素材库）" },
  { keys: ["Shift", "\\"], label: "切换指令轨 / 时间轴" },
  { keys: ["]"], label: "切换 Inspector（检查器）" },
  { keys: ["F"], label: "专注模式（隐藏侧栏与壳层）" },
  { keys: ["⌘", "."], label: "专注模式（备用）" },
  { keys: ["?"], label: "显示 / 关闭快捷键帮助" },
  { keys: ["←"], label: "上一条指令" },
  { keys: ["→"], label: "下一条指令" },
  { keys: ["Alt", "↑"], label: "指令上移一位" },
  { keys: ["Alt", "↓"], label: "指令下移一位" },
  { keys: ["⌘", "D"], label: "复制选中指令" },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  shortcuts?: ShortcutRow[];
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-panel px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-muted">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsModal({
  open,
  onClose,
  shortcuts = CUT_STUDIO_SHORTCUTS,
}: KeyboardShortcutsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="剪辑台快捷键" size="sm">
      <p className="mb-4 text-xs text-ink-muted">
        在输入框外生效。面板折叠后点击边栏条可重新展开。
      </p>
      <ul className="space-y-2.5">
        {shortcuts.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas/50 px-3 py-2"
          >
            <span className="text-xs text-ink">{row.label}</span>
            <span className="flex shrink-0 items-center gap-1">
              {row.keys.map((key, i) => (
                <KeyCap key={`${row.label}-${key}-${i}`}>{key}</KeyCap>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export { CUT_STUDIO_SHORTCUTS };
