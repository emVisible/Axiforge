import { useState } from "react";
import { Badge, Button } from "@axiforge/ui";
import { adminApi, type ModerationCase, type ModerationVocabulary } from "@/api/adminClient";
import {
  clauseLabel,
  humanClausesPayload,
  initialTruth,
} from "@/lib/moderation";

interface Props {
  row: ModerationCase;
  vocab: ModerationVocabulary;
  note: string;
  /** 处置完之后要做的事（重新取队列与统计）。真值控件由本组件自己复位。 */
  onDone: (id: string, fn: () => Promise<unknown>) => Promise<void>;
}

/**
 * 一行的处置：确认 / 误报 / 回退，以及**这一行自己的**逐轴真值。
 *
 * 为什么真值必须按行走而不是放在队列上方做成全局开关：
 * 上一版是全局的，于是运营勾的时候看不到"这一条机器报了哪些条款"（它在同一行的另一列），
 * 而且勾完点下一条，上一次的勾选还在——一个看不到机器声明、又会串行的标签控件，
 * 稳定产出错标，而错标会直接进温度表。
 *
 * 初值规则见 `initialTruth`：这条以前勾过就回显勾过的（含"一条都不成立"的空集），
 * 没勾过就以机器条款起步但不算表态。
 */
export default function ModerationDispositionCell({ row, vocab, note, onDone }: Props) {
  const [truth, setTruth] = useState(() => initialTruth(row));
  const [open, setOpen] = useState(false);

  const dispose = (outcome: "resolved" | "dismissed") =>
    void onDone(row.id, () =>
      adminApi.moderationResolve(
        row.id, outcome, note, humanClausesPayload(truth.asserted, truth.picked)),
    );

  const chips = vocab.axis_clauses ?? [];
  const settled = row.state === "resolved" || row.state === "dismissed";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {settled ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void onDone(row.id, () => adminApi.moderationReopen(row.id, note))}
        >
          回退为待处理
        </Button>
      ) : (
        <>
          <Button size="sm" variant="secondary" onClick={() => dispose("resolved")}>
            确认处置
          </Button>
          <Button size="sm" variant="ghost" onClick={() => dispose("dismissed")}>
            误报
          </Button>
        </>
      )}

      <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
        逐轴真值{truth.asserted ? `·${truth.picked.length}` : ""}
      </Button>

      {row.human_clauses !== null && (
        <Badge variant={row.human_clauses.length ? "emerald" : "amber"}>
          {row.human_clauses.length
            ? `已确认 ${row.human_clauses.length} 条`
            : "已确认：一条都不成立"}
        </Badge>
      )}

      {open && (
        <div className="w-full rounded-lg border border-border bg-canvas p-2">
          <label className="mb-2 flex items-center gap-2 text-2xs text-ink-muted">
            <input
              type="checkbox"
              checked={truth.asserted}
              onChange={(e) => setTruth({ ...truth, asserted: e.target.checked })}
            />
            我逐轴核对过这条内容（不勾＝沿用机器条款，不算表态）
          </label>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => {
              const on = truth.picked.includes(c);
              const machine = row.clause_ids.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!truth.asserted}
                  onClick={() =>
                    setTruth({
                      ...truth,
                      picked: on ? truth.picked.filter((x) => x !== c) : [...truth.picked, c],
                    })
                  }
                  title={machine ? "机器也报了这条" : "机器没报——勾上它就是一个新正样本"}
                  className={`rounded-full border px-2.5 py-1 text-2xs transition-colors ${
                    on
                      ? "border-brand bg-brand-muted text-brand"
                      : "border-border text-ink-muted hover:text-ink"
                  } ${truth.asserted ? "" : "opacity-40"}`}
                >
                  {clauseLabel(vocab, c)}
                  {machine ? " ·机器" : ""}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-2xs text-ink-faint">
            {truth.asserted
              ? `本次会发出 ${truth.picked.length} 条真值`
              : "未确认：这次处置沿用机器标的条款"}
            {" · 一个都不选也是有意义的表态：那是在说机器报的条款一条都不成立"}
          </p>
        </div>
      )}
    </div>
  );
}
