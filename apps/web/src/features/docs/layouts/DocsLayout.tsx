import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { Menu, X } from "lucide-react";
import AppHeader from "@/shared/components/AppHeader";
import { routes } from "@/shared/lib/routes";
import { docNav } from "@/features/docs/docRegistry";
import { cn } from "@/shared/components/ui";

function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-6 text-sm">
      <NavLink
        to={routes.docs}
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "block rounded-lg px-3 py-2 transition-colors",
            isActive
              ? "bg-brand/10 font-medium text-brand"
              : "text-ink-muted hover:bg-canvas hover:text-ink",
          )
        }
      >
        文档首页
      </NavLink>
      {docNav.map((section) => (
        <div key={section.section}>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-ink-muted/70">
            {section.section}
          </p>
          <ul className="space-y-0.5">
            {[...section.items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <li key={item.slug}>
                  <NavLink
                    to={routes.doc(item.slug)}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-3 py-2 transition-colors",
                        isActive
                          ? "bg-brand/10 font-medium text-brand"
                          : "text-ink-muted hover:bg-canvas hover:text-ink",
                      )
                    }
                  >
                    {item.title}
                  </NavLink>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function DocsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <AppHeader
        variant="auto"
        zone="文档"
        showDiscoverLink
        showStudioLink
        showDocsLink={false}
      />

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <DocsSidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-16">
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-muted"
            >
              <Menu className="h-4 w-4" />
              文档目录
            </button>
          </div>
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="关闭目录"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-surface p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">文档目录</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1 text-ink-muted hover:bg-canvas"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <DocsSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

    </div>
  );
}
