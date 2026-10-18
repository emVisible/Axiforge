import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Input } from "@axiforge/ui";
import { adminApi, type RequeueStatus } from "@/api/adminClient";
import { requeueSummary } from "@/lib/moderation";

interface Props {
  /** 一轮批量结束（running 由真变假）时回调，用来让队列与统计重新取数。 */
  onFinished: () => void;
}

/** 三种口径不是"范围大小"的区别，是三种不同的下一步，所以各自带一句说明。 */
const SCOPES = [
  { key: "unjudged", label: "模型没答过的", hint: "只有词表判过的案件——攒标定证据要的就是这批" },
  { key: "stale", label: "版本已推进的", hint: "题集或词表换版后没重算的结论" },
  { key: "pending", label: "全部待处置", hint: "整条队列重刷一遍（最慢，也最贵）" },
] as const;

const TONE_VARIANT = {
  idle: "default",
  running: "blue",
  ok: "emerald",
  warn: "amber",
  danger: "rose",
} as const;

/**
 * 批量重判面板。
 *
 * 它存在的意义是把"让 Laya 现在重看一遍这批内容"这件事交给运营，而不是等工程师敲 curl。
 * 两条不可让的设计：
 * ① 默认**不结案**——批量只刷新结论，把"这些不用人看了"的决定权留给人；
 *    真要放开就勾上那个开关，而开关的文案必须说出后果（不是"允许自动通过"这种含糊话）。
 * ② 读数不许把"只有词表说话"算成判完。第一次上线时计数器就是这么报出 147/150 的，
 *    而库里模型证据只多了 1 条——所以 `lexicon_only` 单独显示，且它一出现就不是绿的。
 */
export default function ModerationRequeuePanel({ onFinished }: Props) {
  const [scope, setScope] = useState<string>("unjudged");
  const [limit, setLimit] = useState(200);
  const [allowClose, setAllowClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<RequeueStatus | null>(null);
  const wasRunning = useRef(false);

  const refresh = useCallback(async () => {
    const s = await adminApi.moderationRequeueStatus();
    setStatus(s);
    return s;
  }, []);

  // 挂载时先读一次：上一轮的读数（"模型答了 197 条 · 3 条原内容已不在"）
  // 比一句"还没跑过"有用得多，尤其批量是在另一个标签页里启动的时候。
  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  // 轮询由这里管，不用 react-query 的 refetchInterval：那个写法以"当前数据"决定
  // 要不要继续轮询，于是**最后一次快照如果是 running=true，就再也没有人取到终态**——
  // 实测面板会一直停在「重判中 0/200」而服务端早就 running=false 了，
  // 顺带 onFinished 也不触发，队列与统计都不刷新。
  useEffect(() => {
    if (!status?.running) return;
    const id = setInterval(() => {
      void refresh()
        .then((s) => {
          if (wasRunning.current && !s.running) onFinished();
          wasRunning.current = s.running;
        })
        .catch(() => undefined);
    }, 1200);
    return () => clearInterval(id);
  }, [status?.running, refresh, onFinished]);

  const summary = status ? requeueSummary(status) : null;

  const start = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const s = await adminApi.moderationRequeue({ scope, limit, allow_close: allowClose });
      setStatus(s);
      wasRunning.current = s.running;
      if (!s.running) onFinished();
    } catch (e) {
      // 409 是"已经有一批在跑"，这是正常状态不是故障；把服务端的原话显示出来即可
      setError(e instanceof Error ? e.message : "启动失败");
      void refresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }, [scope, limit, allowClose, onFinished, refresh]);

  const cancel = useCallback(async () => {
    setError("");
    try {
      setStatus(await adminApi.moderationRequeueCancel());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "取消失败");
    }
  }, [refresh]);

  const active = Boolean(status?.running);

  return (
    <Card className="mt-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="mb-1 text-2xs uppercase tracking-wide text-ink-faint">重判范围</p>
          <div className="flex gap-1">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScope(s.key)}
                disabled={active}
                title={s.hint}
                className={`rounded-lg border px-2 py-1 text-2xs transition-colors ${
                  scope === s.key
                    ? "border-brand bg-brand-muted text-brand"
                    : "border-border text-ink-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-2xs uppercase tracking-wide text-ink-faint">最多判几条</p>
          <Input
            type="number"
            min={1}
            max={5000}
            step={50}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            disabled={active}
            className="w-24"
          />
        </div>

        <label className="flex items-end gap-2 pb-1.5 text-2xs text-ink-muted" title={
          "默认不勾：结论照刷新，案件仍留在人工队列里。" +
          "勾上后，过门的会被记成「机器已结案」并从待处置里移走。"
        }>
          <input
            type="checkbox"
            checked={allowClose}
            disabled={active}
            onChange={(e) => setAllowClose(e.target.checked)}
          />
          允许批量结案（会把过门的移出待处置）
        </label>

        {active ? (
          <Button size="sm" variant="secondary" onClick={cancel}>
            停止
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={start} disabled={busy}>
            {busy ? "启动中" : "开始重判"}
          </Button>
        )}

        {summary && summary.text && (
          <span className="ml-auto">
            <Badge variant={TONE_VARIANT[summary.tone]}>{summary.text}</Badge>
          </span>
        )}
      </div>

      <p className="mt-2 text-2xs text-ink-faint">
        {SCOPES.find((s) => s.key === scope)?.hint} · 一台模型进程串行推理，约 0.5–1s 一条；
        同一篇稿子第二次被扫到走幂等缓存，不再调模型 · 进度里的「只有词表说话」意味着模型没答话，
        先去上头看引擎状态
      </p>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </Card>
  );
}
