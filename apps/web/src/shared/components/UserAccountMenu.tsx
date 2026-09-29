import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, UserRound } from "lucide-react";

import { useUser } from "@/app/providers/UserContext";
import { routes } from "@/shared/lib/routes";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

interface UserAccountMenuProps {
  variant?: "light" | "dark";
}

export default function UserAccountMenu({ variant = "light" }: UserAccountMenuProps) {
  const { profile, displayLabel, loading } = useUser();
  const [open, setOpen] = useState(false);

  const isDark = variant === "dark";
  const triggerClass = isDark
    ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
    : "border-border bg-surface text-ink-muted hover:bg-canvas hover:text-ink";

  const panelClass = isDark
    ? "border-white/10 bg-[#12121c] text-white shadow-xl"
    : "border-border bg-surface text-ink shadow-lg";

  const avatar = profile?.avatar_emoji;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="账户菜单"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${triggerClass}`}
      >
        {avatar ? (
          <span className="text-base leading-none">{avatar}</span>
        ) : (
          <UserRound className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
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
            className={`absolute right-0 z-50 mt-2 w-56 rounded-xl border p-3 ${panelClass}`}
          >
            <p className={`truncate text-sm font-medium ${isDark ? "text-white/90" : "text-ink"}`}>
              {displayLabel}
            </p>
            {profile?.email && (
              <p className={`mt-0.5 truncate text-xs ${isDark ? "text-white/35" : "text-ink-muted"}`}>
                {profile.email}
              </p>
            )}
            <div className={`mt-3 space-y-1 border-t pt-3 ${isDark ? "border-white/10" : "border-border"}`}>
              <Link
                to={routes.profile}
                className={`block rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  isDark ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-ink-muted hover:bg-canvas hover:text-ink"
                }`}
                onClick={() => setOpen(false)}
              >
                账户设置
              </Link>
              {/*
                * 桌面态 profile 恒 null，这个链接的 href 会落成 `/author/`（空 id），
                * 目标页整页要协作服务且没有 DiscoverPage 那道闸门——点了只会进一个报错的作者页。
                * 与 AppHeader 里「发现」/GlobalSearch 用同一个约定处理：桌面不给入口。
                */}
              {!isLocalOnlyDeployment() && (
              <Link
                to={routes.author(profile?.creator_id || "")}
                className={`block rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  isDark ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-ink-muted hover:bg-canvas hover:text-ink"
                }`}
                onClick={() => setOpen(false)}
              >
                我的主页
              </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
