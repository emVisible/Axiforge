import { useState } from "react";
import { Button, Input } from "@/components/ui";
import {
  linkCreatorEmail,
  linkPlayerEmail,
  restoreIdentityFromEmail,
} from "@/lib/identityLink";

interface IdentityLinkPanelProps {
  compact?: boolean;
}

export default function IdentityLinkPanel({ compact }: IdentityLinkPanelProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    if (!email.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      setStatus(ok);
    } catch {
      setStatus("操作失败，请检查邮箱格式");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-white/10 bg-white/[0.03] p-4"
          : "rounded-xl border border-border bg-surface p-4"
      }
    >
      <h3
        className={
          compact
            ? "mb-2 text-xs font-medium text-white/50"
            : "mb-2 text-sm font-medium text-ink"
        }
      >
        邮箱绑定（ADR-006）
      </h3>
      <p
        className={
          compact
            ? "mb-3 text-[11px] leading-relaxed text-white/30"
            : "mb-3 text-xs leading-relaxed text-ink-muted"
        }
      >
        绑定后可在新设备输入同一邮箱恢复创作者身份与存档归属。无密码，轻量迁移。
      </p>
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            run(
              () =>
                Promise.all([
                  linkCreatorEmail(email),
                  linkPlayerEmail(email),
                ]),
              "已绑定创作者与玩家身份",
            )
          }
        >
          绑定当前设备
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() =>
            run(
              () => restoreIdentityFromEmail(email),
              "已从邮箱恢复身份（请刷新页面）",
            )
          }
        >
          从邮箱恢复
        </Button>
      </div>
      {status && (
        <p
          className={
            compact ? "mt-2 text-[11px] text-white/40" : "mt-2 text-xs text-ink-muted"
          }
        >
          {status}
        </p>
      )}
    </div>
  );
}
