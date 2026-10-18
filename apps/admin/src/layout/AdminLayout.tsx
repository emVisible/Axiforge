import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  AlertTriangle,
  ExternalLink,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Moon,
  ScrollText,
  ShieldAlert,
  Sun,
  Users,
  ShieldCheck,
} from "lucide-react";
import { adminApi, clearAdminToken, getAdminToken } from "@/api/adminClient";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { useAdminList } from "@/hooks/useAdminList";
import { useTheme } from "@/providers/ThemeProvider";

const WEB_ORIGIN =
  import.meta.env.VITE_WEB_ORIGIN?.replace(/\/$/, "") || "http://localhost:5174";

interface NavLinkItem {
  to: string;
  label: string;
  end?: boolean;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavLinkItem[];
}

const groups: NavGroup[] = [
  {
    label: "总览",
    items: [{ to: "/", label: "概览", end: true, icon: LayoutDashboard }],
  },
  {
    label: "内容审核",
    items: [
      { to: "/reports", label: "审核工作台", icon: FileWarning },
      { to: "/moderation", label: "自动判断队列", icon: ShieldCheck },
      { to: "/content", label: "内容管理", icon: ShieldAlert },
      { to: "/violations", label: "违规记录", icon: AlertTriangle },
    ],
  },
  {
    label: "人员",
    items: [{ to: "/users", label: "用户管理", icon: Users }],
  },
  {
    label: "系统",
    items: [{ to: "/audit", label: "审计日志", icon: ScrollText }],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { data: stats } = useAdminList({
    queryKey: adminQueryKeys.stats,
    fetcher: () => adminApi.stats(),
  });
  const pendingReports = stats?.pending_reports ?? 0;

  useEffect(() => {
    if (!getAdminToken()) navigate("/login", { replace: true });
  }, [navigate]);

  const logout = () => {
    clearAdminToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-semibold text-ink">Axiforge</p>
          <p className="text-[11px] text-ink-muted">管理中台 · 与主站同套设计系统</p>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-brand-muted font-medium text-brand"
                          : "text-ink-muted hover:bg-canvas hover:text-ink"
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      <l.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      {l.label}
                    </span>
                    {l.to === "/reports" && pendingReports > 0 && (
                      <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">
                        {pendingReports > 99 ? "99+" : pendingReports}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <a
            href={WEB_ORIGIN}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            打开主站
          </a>
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted hover:bg-canvas hover:text-ink"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.75} />
            )}
            {theme === "dark" ? "浅色模式" : "深色模式"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            退出
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
