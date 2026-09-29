import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

/**
 * 播放页的「会话状态」面板：运行时变量（记忆 / 标志 / 角色状态）的只读视图。
 *
 * 从 PlayerPage 外提是宪章 Phase 7「渲染文件全部 ≤400 行」的第一块——
 * 挑它作开头不是因为最难，而是因为它**纯展示**：不碰引擎、不读存档、
 * 只吃已经算好的三张表，所以搬动零行为风险。因此这里逐类保留了原样式，
 * 角色状态那一栏的「名在上、值在下」与记忆/标志的「名是 span」形状不同，
 * 是原本就存在的差异，不为了共用一个子组件而抹平。
 */

/** 变量值可能是任意 JSON：对象走序列化，其余按字符串给；null/undefined 一律空串而非 "null" */
function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

interface PlayerStatePanelProps {
  memory: readonly (readonly [string, unknown])[];
  flags: readonly (readonly [string, unknown])[];
  characters: readonly (readonly [string, unknown])[];
  /** 角色 id → 展示名；空名或没有条目时退回 id 本身 */
  charNames: Readonly<Record<string, string>>;
  /** 非空就是一条要说出来的降级（例如桌面没有跨作品账本），不是错误弹窗 */
  notice?: string | null;
  onClose: () => void;
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children?: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
        {title} ({count})
      </h3>
      {count === 0 ? (
        <p className="text-sm text-white/65">{empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

const CARD = "rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2";

export default function PlayerStatePanel({
  memory,
  flags,
  characters,
  charNames,
  notice,
  onClose,
}: PlayerStatePanelProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="flex items-center gap-2 text-sm tracking-wider text-white/50">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          会话状态
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto p-8">
        {notice && (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-2xs text-white/65">
            {notice}
          </p>
        )}
        <Section title="记忆" empty="暂无记忆" count={memory.length}>
          {memory.map(([k, v]) => (
            <div key={k} className={CARD}>
              <span className="text-xs text-white/40">{k}</span>
              <p className="text-sm text-white/60">{formatVal(v)}</p>
            </div>
          ))}
        </Section>
        <Section title="标志" empty="暂无标志" count={flags.length}>
          {flags.map(([k, v]) => (
            <div key={k} className={CARD}>
              <span className="text-xs text-white/40">{k}</span>
              <p className="text-sm text-white/60">{formatVal(v)}</p>
            </div>
          ))}
        </Section>
        <Section title="角色状态" empty="暂无角色状态" count={characters.length}>
          {characters.map(([id, fields]) => (
            <div key={id} className={CARD}>
              <p className="text-sm text-white/70">{charNames[id] || id}</p>
              <p className="text-xs text-white/35">{formatVal(fields)}</p>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
