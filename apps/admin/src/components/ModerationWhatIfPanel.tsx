import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, DataTable, Input, type DataTableColumn } from "@axiforge/ui";
import { adminApi, type WhatIfReport, type WhatIfRow } from "@/api/adminClient";
import { useModerationVocabulary } from "@/hooks/useModerationVocabulary";
import { actionLabel, targetTypeLabel, whatIfEvidenceNote, whatIfSampleNote, whatIfVerdict } from "@/lib/moderation";

interface Props {
  /** 线上正在用的那两条线，用来把"假定"与"现状"分开显示。 */
  current: { auto_approve: number; auto_reject: number; version: string };
}

/**
 * 阈值假设面板。它存在的意义是把"要不要把线画到 0.75"这个决定
 * 从一句转述的数字变成可核对的读数：**具体是哪几条案件会被自动执行、
 * 它们当初人是怎么处置的**。
 *
 * 只读。它不写库、不改策略，也不给任何引擎新资格。
 */
export default function ModerationWhatIfPanel({ current }: Props) {
  const [approve, setApprove] = useState(0.75);
  const [reject, setReject] = useState(current.auto_reject);
  const vocab = useModerationVocabulary();
  const [report, setReport] = useState<WhatIfReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setReport(await adminApi.moderationWhatIf(approve, reject));
    } catch (e) {
      setError(e instanceof Error ? e.message : "计算失败");
    } finally {
      setBusy(false);
    }
  }, [approve, reject]);

  useEffect(() => {
    void run();
  }, [run]);

  const verdict = report ? whatIfVerdict(report) : null;
  const skipped = report ? Object.entries(report.skipped) : [];

  const columns: DataTableColumn<WhatIfRow>[] = [
    {
      key: "subject",
      header: "对象",
      render: (r) => (
        <span className="text-xs">
          {targetTypeLabel[r.subject_type] || r.subject_type}{" "}
          <span className="font-mono text-2xs text-ink-faint">{r.subject_id.slice(0, 8)}</span>
        </span>
      ),
    },
    {
      key: "hypothetical",
      header: "这条线下会执行",
      render: (r) => (
        <span className="text-xs">
          {actionLabel(vocab, r.hypothetical_action)}
          <span className="ml-1 font-mono text-2xs text-ink-muted">
            {Math.round(r.confidence * 100)}%
          </span>
        </span>
      ),
    },
    {
      key: "effective",
      header: "生效线",
      render: (r) => (
        <span className="font-mono text-2xs text-ink-muted">
          {r.effective_approve.toFixed(2)}/{r.effective_reject.toFixed(2)}
          {(r.effective_approve !== report?.approve_line ||
            r.effective_reject !== report?.reject_line) && (
            <span className="ml-1 text-amber-600">按类型收紧</span>
          )}
        </span>
      ),
    },
    {
      key: "human",
      header: "当初人怎么判",
      render: (r) =>
        r.human_outcome ? (
          <Badge variant={r.human_outcome === "resolved" ? "rose" : "default"}>
            {r.human_outcome === "resolved" ? "已下架" : "判为误报"}
          </Badge>
        ) : (
          <span className="text-2xs text-ink-faint">没人判过</span>
        ),
    },
    {
      key: "agreement",
      header: "对照",
      render: (r) => (
        <span
          className={
            r.agreement === "conflict"
              ? "text-2xs text-rose-600"
              : r.agreement === "agree"
                ? "text-2xs text-emerald-600"
                : "text-2xs text-ink-faint"
          }
        >
          {r.agreement === "conflict" ? "相反" : r.agreement === "agree" ? "一致" : "无对照"}
        </span>
      ),
    },
  ];

  return (
    <Card className="mt-4 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-2xs uppercase tracking-wide text-ink-faint">假定通过线</p>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={approve}
            onChange={(e) => setApprove(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <div>
          <p className="mb-1 text-2xs uppercase tracking-wide text-ink-faint">假定驳回线</p>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={reject}
            onChange={(e) => setReject(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={run} disabled={busy}>
          {busy ? "计算中" : "重算"}
        </Button>
        <span className="text-2xs text-ink-faint">
          只读：拿已落库的答案重放，不改策略、不写库 · 现状 {current.version}
          （{current.auto_approve.toFixed(2)}/{current.auto_reject.toFixed(2)}）
        </span>
        {verdict && (
          <span className="ml-auto">
            <Badge
              variant={
                verdict.tone === "danger" ? "rose" : verdict.tone === "warn" ? "amber" : "emerald"
              }
            >
              {verdict.text}
            </Badge>
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      {report && (
        <p className="mt-3 text-2xs text-ink-muted">
          扫描 {report.scanned} 条案件，可回放 {report.evaluated} 条{whatIfEvidenceNote(report)}{whatIfSampleNote(report)} ·
          自动放行 {report.auto_approve} · 自动驳回 {report.auto_reject} ·
          与人工一致 {report.agrees} · <span className="text-rose-600">相反 {report.conflicts}</span> ·
          没人判过 {report.undecided}
          {skipped.length > 0 && (
            <span className="text-ink-faint">
              {" "}
              · 跳过：{skipped.map(([k, v]) => `${k} ${v}`).join("、")}
            </span>
          )}
        </p>
      )}

      {report && report.rows.length > 0 && (
        <div className="mt-2">
          <DataTable
            columns={columns}
            rows={report.rows}
            rowKey={(r) => r.case_id}
            emptyTitle=""
          />
        </div>
      )}
      {report && report.rows.length === 0 && (
        <p className="mt-3 text-xs text-ink-faint">
          这条线上没有任何案件会被自动执行——上面那行"没人判过"的数字，就是它的原因。
        </p>
      )}
    </Card>
  );
}
