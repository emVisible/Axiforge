import {
  Card,
  ErrorDisplay,
  LoadingSpinner,
  PageHeader,
  StatCard,
  StatCardGrid,
} from "@axiforge/ui";
import { adminApi, type DashboardStats } from "@/api/adminClient";
import { useAdminList } from "@/hooks/useAdminList";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function DashboardPage() {
  const { data: stats, loading, error, reload } = useAdminList<DashboardStats>({
    fetcher: () => adminApi.stats(),
  });

  return (
    <div>
      <PageHeader title="数据概览" description="平台运营与治理关键指标" />
      {loading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} onRetry={reload} />}
      {stats && (
        <div className="space-y-8">
          <StatCardGrid>
            <StatCard label="待审举报" value={stats.pending_reports} />
            <StatCard label="用户总数" value={stats.total_users} />
            <StatCard label="作品总数" value={stats.total_projects} />
            <StatCard label="公开作品" value={stats.public_projects} />
            <StatCard label="公开角色" value={stats.public_characters} />
            <StatCard label="7日播放" value={stats.story_plays_7d} />
            <StatCard label="7日 Fork" value={stats.project_forks_7d} />
            <StatCard label="7日违规" value={stats.violations_7d} />
            <StatCard label="已下架作品" value={stats.taken_down_projects} />
            <StatCard label="封禁用户" value={stats.banned_users} />
            <StatCard label="上传文件" value={stats.upload_files} />
            <StatCard label="存储用量" value={formatBytes(stats.upload_bytes)} />
          </StatCardGrid>

          <section>
            <h2 className="text-sm font-semibold text-ink">创作漏斗</h2>
            <p className="mt-1 text-xs text-ink-muted">注册 → 建项目 → 发布 → 被玩（7日）</p>
            <Card className="mt-3 space-y-2" padding="md">
              {[
                { label: "注册用户", value: stats.total_users },
                { label: "创建过作品", value: stats.authors_with_projects },
                { label: "公开发布", value: stats.public_projects },
                { label: "7日内被玩过", value: stats.played_projects_7d },
              ].map((step, _, arr) => {
                const max = Math.max(...arr.map((s) => s.value), 1);
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-ink-muted">{step.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-brand/70"
                        style={{ width: `${Math.max(4, (step.value / max) * 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-ink">
                      {step.value}
                    </span>
                  </div>
                );
              })}
            </Card>
          </section>

          {stats.top_projects.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink">热门作品 Top 5</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs text-ink-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">标题</th>
                      <th className="px-4 py-3 font-medium">播放</th>
                      <th className="px-4 py-3 font-medium">浏览</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_projects.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">{p.title}</td>
                        <td className="px-4 py-3 tabular-nums">{p.play_count}</td>
                        <td className="px-4 py-3 tabular-nums">{p.view_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
