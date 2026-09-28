import { Badge, Button } from "@axiforge/ui";
import {
  adminApi,
  type LabelTargetAxis,
  type LabelTargetsReport,
  type ModerationVocabulary,
} from "@/api/adminClient";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { useAdminList } from "@/hooks/useAdminList";
import { labelAxisNote, questionLabel } from "@/lib/moderation";

interface Props {
  vocab: ModerationVocabulary;
  /** 队列当前按哪条轴排序（null＝没在排序模式）。 */
  activeAxis: string | null;
  onPickAxis: (axis: string | null) => void;
}

/** 没判断力的排最前：这一屏的目的不是"列出所有轴"，是给出下一步该标谁。 */
function rank(a: LabelTargetAxis): number {
  if (a.informative === false) return 0;
  if (a.informative == null) return 1;
  return 2;
}

/**
 * 标注配额面板：把 D25 那个读数（"10 题里 8 题打不过常数预测器"）变成一个能做的动作。
 *
 * 为什么不直接给一个"自动补标注"的按钮：这些轴缺的是**人怎么看这批内容**，
 * 不是又一次模型输出。所以这一屏只指路——按这条轴报警的可能性把队列排出来，
 * 真值仍旧由人在每一行里逐轴勾（`human_clauses`）。任何"顺手替运营勾上"的设计
 * 都会把要治的空转轴换成一批自证的正样本。
 */
export default function ModerationLabelQueuePanel({ vocab, activeAxis, onPickAxis }: Props) {
  const list = useAdminList<LabelTargetsReport>({
    queryKey: adminQueryKeys.moderationLabelTargets(),
    fetcher: () => adminApi.moderationLabelTargets(12),
  });
  const report = list.data;

  if (list.error) {
    return (
      <section className="mb-3 rounded-xl border border-border bg-surface p-3">
        <p className="text-xs text-ink-muted">标注配额读数取不到：{list.error}</p>
      </section>
    );
  }
  if (!report) {
    return (
      <section className="mb-3 rounded-xl border border-border bg-surface p-3">
        <p className="text-xs text-ink-faint">标注配额读数加载中…</p>
      </section>
    );
  }

  const axes = [...report.axes].sort(
    (a, b) => rank(a) - rank(b) || b.pending_candidates - a.pending_candidates,
  );
  const flat = axes.filter((a) => a.informative === false).length;

  return (
    <section className="mb-3 rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-sm">标注配额：哪条轴差人看</h2>
        <span className="text-2xs text-ink-faint">
          {report.pending_total} 条待处置 · 引擎 {report.engine || "—"}
        </span>
        {flat > 0 && <Badge variant="amber">{flat} 条轴没有判断力</Badge>}
      </div>
      <p className="mb-2 text-2xs text-ink-muted">
        温度表覆盖满不等于它能用：打不过常数预测器的轴不携带信息，却会在 approve 取 min 时
        压住整条自动通道。能改变它的只有逐轴标注。这一屏只指路（按报警可能性排序），
        <span className="text-ink-faint">真值仍然要在每一行的「逐轴真值」里由人勾</span>。
      </p>
      <ul className="space-y-1.5">
        {axes.map((a) => {
          const note = labelAxisNote(vocab, a);
          const active = activeAxis === a.question;
          return (
            <li key={a.question} className="flex flex-wrap items-center gap-2 text-2xs">
              {/* 三种状态得长得不一样：这一屏的价值就是"先标谁"，全同色等于没排序。 */}
              <span
                className={
                  note.tone === "warn"
                    ? "text-ink"
                    : note.tone === "ok"
                      ? "text-ink-muted"
                      : "text-ink-faint"
                }
              >
                {note.text}
              </span>
              <span className="text-ink-faint">候选 {a.pending_candidates} 条</span>
              {a.top.length > 0 && (
                <span className="font-mono text-ink-faint">
                  队头最高 {(a.top[0].probability * 100).toFixed(0)}%
                </span>
              )}
              <Button
                size="sm"
                variant={active ? "secondary" : "ghost"}
                disabled={a.pending_candidates === 0}
                onClick={() => onPickAxis(active ? null : a.question)}
                title={
                  a.pending_candidates === 0
                    ? "没有一条待处置案件给过这条轴的概率，得先重判或接上模型"
                    : "把队列按这条轴的可能性排序"
                }
              >
                {active ? `退出「${questionLabel(vocab, a.question)}」排序` : "排出这些"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
