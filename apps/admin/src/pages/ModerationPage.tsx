import { useState } from "react";
import { Link } from "react-router";
import {
  Badge,
  Button,
  DataTable,
  ErrorDisplay,
  PageHeader,
  type DataTableColumn,
} from "@axiforge/ui";
import { adminApi, type ModerationCase } from "@/api/adminClient";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { useAdminList } from "@/hooks/useAdminList";
import { useModerationVocabulary } from "@/hooks/useModerationVocabulary";
import { actionLabel, calibrationSummary, clauseLabel, targetTypeLabel, viaLabel } from "@/lib/moderation";

const STATE_TABS: { key: string; label: string }[] = [
  { key: "pending", label: "待人工" },
  { key: "auto_closed", label: "已自动结案" },
  { key: "dismissed", label: "判为误报" },
  { key: "", label: "全部" },
];

const SORT_OPTIONS: { key: "risk" | "new"; label: string }[] = [
  { key: "risk", label: "先看可疑" },
  { key: "new", label: "最新" },
];

function fmt(v: number | null): string {
  return v === null ? "—" : `${(v * 100).toFixed(0)}%`;
}

/** 引擎徽标：把"这条结论是谁给的、他有没有资格给"直接写在行上。 */
function EngineBadge({ row }: { row: ModerationCase }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={row.authoritative ? "default" : "amber"}>{row.engine || "—"}</Badge>
      {!row.calibrated && <Badge variant="amber">未校准</Badge>}
      {row.authoritative && <Badge variant="default">有执行资格</Badge>}
    </div>
  );
}

export default function ModerationPage() {
  const [state, setState] = useState("pending");
  const [order, setOrder] = useState<"risk" | "new">("risk");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const vocab = useModerationVocabulary();

  const list = useAdminList<ModerationCase[]>({
    queryKey: adminQueryKeys.moderationQueue(state, order),
    fetcher: () => adminApi.moderationQueue(state || undefined, 100, order),
  });
  const stats = useAdminList({
    queryKey: adminQueryKeys.moderationStats(),
    fetcher: () => adminApi.moderationStats(),
  });

  const act = async (id: string, fn: () => Promise<unknown>) => {
    await fn();
    list.invalidate();
    stats.invalidate();
    void id;
  };

  const columns: DataTableColumn<ModerationCase>[] = [
    {
      key: "created_at",
      header: "时间",
      className: "whitespace-nowrap text-xs text-ink-muted",
      render: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      key: "subject",
      header: "对象",
      render: (r) => (
        <div className="min-w-0">
          <span className="text-xs text-ink-muted">
            {targetTypeLabel[r.subject_type] || r.subject_type}
          </span>{" "}
          <span className="font-mono text-xs">{r.subject_id.slice(0, 8)}</span>
          <div className="text-2xs text-ink-faint">
            作者 <span className="font-mono">{r.author_id || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "clauses",
      header: "命中条款",
      render: (r) =>
        r.clause_ids.length ? (
          <div className="flex flex-wrap gap-1">
            {r.clause_ids.map((c) => (
              <Badge key={c} variant="amber">
                {clauseLabel(vocab, c)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-ink-faint">无</span>
        ),
    },
    {
      key: "decision",
      header: "结论 / 置信",
      render: (r) => (
        <div>
          <span className="text-xs">{actionLabel(vocab, r.final_action)}</span>
          <span className="ml-2 font-mono text-xs text-ink-muted">{fmt(r.confidence)}</span>
          <div className="text-2xs text-ink-faint">{viaLabel(vocab, r.via)}</div>
        </div>
      ),
    },
    { key: "engine", header: "引擎", render: (r) => <EngineBadge row={r} /> },
    {
      key: "actions",
      header: "处置",
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {r.state === "pending" || r.state === "auto_closed" ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void act(r.id, () => adminApi.moderationResolve(r.id, "resolved", note))
                }
              >
                确认处置
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void act(r.id, () => adminApi.moderationResolve(r.id, "dismissed", note))
                }
              >
                误报
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void act(r.id, () => adminApi.moderationReopen(r.id, note))}
            >
              回退复核
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpenId(openId === r.id ? null : r.id)}
          >
            {openId === r.id ? "收起" : "依据"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="自动判断队列"
        description="Laya / 词表给出的审核建议与执行留痕；自动动作只在权威且已校准的引擎上过线后发生"
        meta={
          stats.data && (
            <div className="flex flex-wrap gap-2 text-2xs">
              {stats.data.engines.map((e) => (
                <span
                  key={e.name}
                  className="rounded-full border border-border px-2 py-0.5"
                  title={e.authoritative ? "可执行不可逆动作" : "只能升级给人工"}
                >
                  {e.name} · {e.healthy ? "在线" : "不可用"}
                  {e.authoritative ? " · 权威" : ""}
                </span>
              ))}
              {stats.data.calibration.map((c) => {
                const sum = calibrationSummary(vocab, c);
                return (
                  <span
                    key={c.engine}
                    className={`rounded-full border px-2 py-0.5 ${
                      sum.tone === "ok"
                        ? "border-emerald-500/40 text-emerald-600"
                        : sum.tone === "warn"
                          ? "border-amber-500/40 text-amber-600"
                          : "border-rose-500/40 text-rose-600"
                    }`}
                    title={
                      c.path
                        ? `温度表：${c.path}`
                        : "取不到温度表覆盖面，此时整链一律转人工"
                    }
                  >
                    {c.engine} · {sum.text}
                  </span>
                );
              })}
              <span
                className="rounded-full border border-border px-2 py-0.5 text-ink-muted"
                title="低于通过线/高于驳回线都不自动执行；未标定的题只要有一题没覆盖，整链转人工"
              >
                {stats.data.policy.version} · 通过线 {stats.data.policy.auto_approve.toFixed(2)}
                <span className="mx-1">/</span>驳回线 {stats.data.policy.auto_reject.toFixed(2)}
              </span>
            </div>
          )
        }
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setState(t.key)}
            className={`rounded-full px-3 py-1 text-xs ${
              state === t.key
                ? "bg-brand text-white"
                : "border border-border text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.key && stats.data?.by_state[t.key] !== undefined
              ? ` (${stats.data.by_state[t.key]})`
              : ""}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-2xs text-ink-faint">
          排序
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setOrder(o.key)}
              className={`rounded-full px-2.5 py-0.5 ${
                order === o.key
                  ? "bg-brand-muted text-brand"
                  : "border border-border text-ink-muted hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </span>
      </div>

      {order === "risk" && (
        <p className="mb-3 text-2xs text-ink-faint">
          先看可疑 = 有明确条款的优先，其次按支撑该结论的最弱证据排序，最后按时间。
          它只决定先看哪条，不是风险度量也不是结论：词表与模型的置信度量纲不同，跨引擎不可比。
        </p>
      )}

      <div className="mb-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="处置理由（会写进案件留痕，供复盘与申诉）"
          className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
        />
      </div>

      {list.error && <ErrorDisplay message={list.error} onRetry={list.reload} />}
      <DataTable
        columns={columns}
        rows={list.data ?? []}
        rowKey={(r) => r.id}
        loading={list.loading}
        emptyTitle="队列为空"
        emptyDescription="没有内容被自动放行或被自动否决——这两件事都只会在权威引擎过线后发生"
      />

      {openId && (
        <EvidencePanel row={(list.data ?? []).find((r) => r.id === openId)} onClose={() => setOpenId(null)} />
      )}

      <p className="mt-4 text-2xs text-ink-faint">
        处置人记为当前管理员角色，不接受请求体自报；
        <Link to="/violations" className="ml-1 text-brand hover:underline">
          违规记录
        </Link>
        与
        <Link to="/audit" className="ml-1 text-brand hover:underline">
          审计日志
        </Link>
        分别记录 strike 与操作流水。
      </p>
    </div>
  );
}

/** 判断依据面板：把"为什么是这条结论"完整摊开——参照实现的队列只回 action/confidence/engine。 */
function EvidencePanel({ row, onClose }: { row?: ModerationCase; onClose: () => void }) {
  if (!row) return null;
  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">判断依据</h2>
        <Button size="sm" variant="ghost" onClick={onClose}>
          关闭
        </Button>
      </div>
      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-2xs text-ink-muted sm:grid-cols-4">
        <div>策略 {row.policy_version || "—"}</div>
        <div>题集 {row.questions_version || "—"}</div>
        <div>词表 {row.lexicon_version || "—"}</div>
        <div>耗时 {row.latency_ms >= 0 ? `${row.latency_ms}ms` : "—"}</div>
      </dl>
      {!Object.keys(row.answers).length && (
        <p className="mb-2 text-2xs text-ink-faint">
          本次结论来自确定性词表，它只报"可疑"、不产出类型化答案；接上 Laya 后这里会列出每个问题的取值与置信。
        </p>
      )}
      <ol className="mb-3 space-y-0.5 text-xs text-ink-muted">
        {row.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ol>
      <div className="overflow-x-auto">
        <table className="w-full text-2xs">
          <thead className="text-ink-faint">
            <tr>
              <th className="px-2 py-1 text-left">问题</th>
              <th className="px-2 py-1 text-left">类型</th>
              <th className="px-2 py-1 text-left">取值</th>
              <th className="px-2 py-1 text-left">置信</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(row.answers).map(([k, a]) => (
              <tr key={k} className="border-t border-border/60">
                <td className="px-2 py-1 font-mono">{k}</td>
                <td className="px-2 py-1">{a.type}</td>
                <td className="px-2 py-1">{String(a.value)}</td>
                <td className="px-2 py-1 font-mono">{fmt(a.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
