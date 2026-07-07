import { useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { useUser } from "@/contexts/UserContext";
import { routes } from "@/lib/routes";
import { Link } from "react-router";

interface UserAccountMenuProps {
  variant?: "light" | "dark";
}

export default function UserAccountMenu({ variant = "light" }: UserAccountMenuProps) {
  const { profile, displayLabel, bindEmail, restoreFromEmail, loading } = useUser();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(profile?.email || "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isDark = variant === "dark";
  const triggerClass = isDark
    ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
    : "border-border bg-surface text-ink-muted hover:bg-canvas hover:text-ink";

  const panelClass = isDark
    ? "border-white/10 bg-[#12121c] text-white shadow-xl"
    : "border-border bg-surface text-ink shadow-lg";

  const run = async (fn: () => Promise<void>, ok: string) => {
    if (!email.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      setStatus(ok);
    } catch {
      setStatus("操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${triggerClass}`}
      >
        <UserRound className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="max-w-[8rem] truncate">{loading ? "…" : displayLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50" strokeWidth={1.75} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 z-50 mt-2 w-72 rounded-xl border p-4 ${panelClass}`}
          >
            <p className={`text-xs ${isDark ? "text-white/40" : "text-ink-muted"}`}>
              用户档案 · 创作与游玩身份合一
            </p>
            <p className="mt-1 truncate text-sm font-medium">{displayLabel}</p>
            {profile?.email && (
              <p className={`mt-0.5 truncate text-xs ${isDark ? "text-white/35" : "text-ink-muted"}`}>
                {profile.email}
              </p>
            )}

            <div className="mt-3 space-y-2">
              <Input
                type="email"
                placeholder="绑定邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busy}
                  onClick={() => run(() => bindEmail(email), "邮箱已绑定")}
                >
                  绑定
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  onClick={() =>
                    run(() => restoreFromEmail(email), "身份已恢复，正在刷新…")
                  }
                >
                  恢复
                </Button>
              </div>
              {status && (
                <p className={`text-[11px] ${isDark ? "text-white/40" : "text-ink-muted"}`}>
                  {status}
                </p>
              )}
            </div>

            <div className={`mt-3 border-t pt-3 ${isDark ? "border-white/10" : "border-border"}`}>
              <Link
                to={routes.author(profile?.creator_id || "")}
                className={`text-xs hover:underline ${isDark ? "text-white/50" : "text-brand"}`}
                onClick={() => setOpen(false)}
              >
                查看我的作者页 →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
