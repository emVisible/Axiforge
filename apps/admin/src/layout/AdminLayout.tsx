import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  AlertTriangle,
  FileWarning,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import { clearAdminToken, getAdminToken } from "@/api/adminClient";

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
      { to: "/reports", label: "举报队列", icon: FileWarning },
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

  useEffect(() => {
    if (!getAdminToken()) navigate("/login", { replace: true });
  }, [navigate]);

  const logout = () => {
    clearAdminToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-semibold text-ink">Axiforge Admin</p>
          <p className="text-[11px] text-ink-muted">v3 管理中台</p>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-ink-muted/70">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-brand-muted font-medium text-brand"
                          : "text-ink-muted hover:bg-canvas hover:text-ink"
                      }`
                    }
                  >
                    <l.icon className="h-4 w-4" strokeWidth={1.75} />
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="m-3 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          退出
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
