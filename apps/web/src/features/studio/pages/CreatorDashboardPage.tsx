import {
  AlertTriangle,
  Eye,
  GitFork,
  MapPin,
  Package,
  Play,
  ScrollText,
  User,
} from "lucide-react";

import Shell from "@/shared/components/Shell";
import {
  Button,
  EmptyState,
  PageHeader,
  StatStrip,
  StatStripItem,
} from "@/shared/components/ui";
import { useCreatorDashboard } from "@/shared/hooks/useCreatorDashboard";
import CloudFeatureNotice from "@/shared/components/CloudFeatureNotice";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import { getCreatorId } from "@/shared/lib/creatorId";
import { routes } from "@/shared/lib/routes";
import type { CreatorDashboard } from "@/shared/api/creator";

function TrendChart({ trend }: { trend: CreatorDashboard["trend"] }) {
  const maxPlays = Math.max(1, ...trend.map((p) => p.plays));
  const width = 320;
  const height = 96;
  const step = trend.length > 1 ? width / (trend.length - 1) : width;

  const points = trend
    .map((p, i) => {
      const x = i * step;
      const y = height - (p.plays / maxPlays) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">近 7 日播放趋势</p>
        <p className="text-xs text-ink-muted">按日 story_play 事件</p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full text-brand"
        role="img"
        aria-label="近7日播放趋势折线图"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {trend.map((p, i) => {
          const x = i * step;
          const y = height - (p.plays / maxPlays) * (height - 8) - 4;
          return <circle key={p.date} cx={x} cy={y} r="3" fill="currentColor" />;
        })}
      </svg>
      <div className="mt-2 flex justify-between text-3xs text-ink-muted">
        {trend.map((p) => (
          <span key={p.date}>{p.date}</span>
        ))}
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const authorId = getCreatorId();
  const { data, isLoading, error } = useCreatorDashboard(authorId);

  // 桌面离线直接输 URL 进来时，给一句准确说明而不是「读取失败」
  if (isLocalOnlyDeployment()) {
    return (
      <Shell>
        <PageHeader title="创作概览" />
        <CloudFeatureNotice feature="创作数据面板" />
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <PageHeader title="创作概览" />
        <p className="text-sm text-ink-muted">加载数据中…</p>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <PageHeader title="创作概览" />
        <EmptyState
          title="无法加载数据"
          description="请稍后重试或检查网络连接。"
        />
      </Shell>
    );
  }

  const totalContent =
    data.counts.projects +
    data.counts.characters +
    data.counts.items +
    data.counts.scenes;

  return (
    <Shell>
      <PageHeader
        title="创作概览"
        description="查看作品数据与近 7 日趋势"
      />

      {totalContent === 0 ? (
        <EmptyState
          title="还没有创作内容"
          description="从剧本或角色开始你的第一条作品。"
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button as="link" to={routes.projectNew}>
              创建剧本
            </Button>
            <Button as="link" to={routes.characters.create} variant="secondary">
              创建角色
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <StatStrip className="mb-4">
            <StatStripItem
              label="剧本"
              value={data.counts.projects}
              icon={ScrollText}
              hint="侧栏进入剧本管理"
            />
            <StatStripItem
              label="角色"
              value={data.counts.characters}
              icon={User}
              hint="侧栏进入角色"
            />
            <StatStripItem
              label="道具"
              value={data.counts.items}
              icon={Package}
              hint="侧栏进入道具库"
            />
            <StatStripItem
              label="场景"
              value={data.counts.scenes}
              icon={MapPin}
              hint="侧栏进入场景"
            />
            <StatStripItem label="7 日浏览" value={data.views_7d} icon={Eye} />
            <StatStripItem label="7 日播放" value={data.plays_7d} icon={Play} />
            <StatStripItem label="7 日 Fork" value={data.forks_7d} icon={GitFork} />
            <StatStripItem
              label="公开 / 私有"
              value={`${data.public_ratio.public} / ${data.public_ratio.private}`}
            />
            {data.pending_reports > 0 && (
              <StatStripItem
                label="待处理举报"
                value={data.pending_reports}
                icon={AlertTriangle}
                hint="请检查被举报的公开内容"
              />
            )}
          </StatStrip>

          <TrendChart trend={data.trend} />
        </>
      )}
    </Shell>
  );
}
