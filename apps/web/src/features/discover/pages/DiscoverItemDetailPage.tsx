import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Package } from "lucide-react";

import { itemApi } from "@/shared/api/editor";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import type { AssetItemResponse } from "@/shared/types/asset";
import DiscoverCommentSection from "@/features/discover/components/DiscoverCommentSection";
import PageMeta from "@/shared/components/PageMeta";
import ShareActions from "@/shared/components/ShareActions";
import CloudFeatureNotice from "@/shared/components/CloudFeatureNotice";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import {
  BackLink,
  Badge,
  LoadingSpinner,
  cn,
  useCardTheme,
} from "@/shared/components/ui";

export default function DiscoverItemDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const t = useCardTheme();
  const [item, setItem] = useState<AssetItemResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const shareUrl = `${window.location.origin}/discover/items/${id}`;

  // 桌面态这一页没有读者：它与 DiscoverPage 同进退（E35「入口与目标同生共死」），
  // 否则直接输 URL 进来就是一次注定失败的云端请求。
  const localOnly = isLocalOnlyDeployment();

  useEffect(() => {
    if (localOnly) return;
    (async () => {
      try {
        const data = await itemApi.get(id);
        if (!data.is_public) {
          setStatus("error");
          return;
        }
        setItem(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [id, localOnly]);

  if (localOnly) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <CloudFeatureNotice feature="公开道具详情" />
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "error" || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">
        道具不存在或未公开
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <PageMeta
        title={item.name}
        description={item.description || "公开道具"}
        image={getImageUrl(item.image_path ?? undefined) ?? undefined}
        url={shareUrl}
      />
      <BackLink to={`${routes.discover}?tab=items`}>发现 · 道具</BackLink>

      <div className={cn("mt-4 overflow-hidden rounded-2xl border", t.surfaceStatic)}>
        <div className="flex flex-col gap-4 p-6 sm:flex-row">
          <div className={cn("mx-auto flex h-32 w-32 shrink-0 items-center justify-center rounded-xl sm:mx-0", t.cover)}>
            {item.image_path ? (
              <img src={getImageUrl(item.image_path) || ""} alt={item.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              <Package className="h-10 w-10 text-ink-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-ink">{item.name}</h1>
              {item.rarity && <Badge size="sm">{item.rarity}</Badge>}
            </div>
            <p className={cn("mt-2 text-sm", t.description)}>{item.description || "暂无描述"}</p>
            <Link to={routes.author(item.author_id)} className="mt-3 inline-block text-xs text-ink-muted hover:text-brand">
              创作者主页
            </Link>
            <div className="mt-4">
              <ShareActions url={shareUrl} title={item.name} />
            </div>
          </div>
        </div>
      </div>

      <DiscoverCommentSection contentType="item" contentId={id} className="mt-10" />
    </div>
  );
}
