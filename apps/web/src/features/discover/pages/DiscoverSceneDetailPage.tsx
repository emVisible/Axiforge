import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ImageIcon } from "lucide-react";

import { sceneAssetApi } from "@/shared/api/editor";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import type { AssetSceneResponse } from "@/shared/types/asset";
import DiscoverCommentSection from "@/features/discover/components/DiscoverCommentSection";
import PageMeta from "@/shared/components/PageMeta";
import ShareActions from "@/shared/components/ShareActions";
import CloudFeatureNotice from "@/shared/components/CloudFeatureNotice";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import {
  BackLink,
  LoadingSpinner,
  cn,
  useCardTheme,
} from "@/shared/components/ui";

export default function DiscoverSceneDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const t = useCardTheme();
  const [scene, setScene] = useState<AssetSceneResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const shareUrl = `${window.location.origin}/discover/scenes/${id}`;

  // 桌面态这一页没有读者：它与 DiscoverPage 同进退（E35「入口与目标同生共死」），
  // 否则直接输 URL 进来就是一次注定失败的云端请求。
  const localOnly = isLocalOnlyDeployment();

  useEffect(() => {
    if (localOnly) return;
    (async () => {
      try {
        const data = await sceneAssetApi.get(id);
        if (!data.is_public) {
          setStatus("error");
          return;
        }
        setScene(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [id, localOnly]);

  if (localOnly) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <CloudFeatureNotice feature="公开场景详情" />
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

  if (status === "error" || !scene) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">
        场景不存在或未公开
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <PageMeta
        title={scene.name}
        description={scene.description || scene.atmosphere || "公开场景"}
        image={getImageUrl(scene.image_path ?? undefined) ?? undefined}
        url={shareUrl}
      />
      <BackLink to={`${routes.discover}?tab=scenes`}>发现 · 场景</BackLink>

      <div className={cn("mt-4 overflow-hidden rounded-2xl border", t.surfaceStatic)}>
        <div className={cn("aspect-[21/9]", t.cover)}>
          {scene.image_path ? (
            <img
              src={getImageUrl(scene.image_path) || ""}
              alt={scene.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={cn("flex h-full items-center justify-center", t.coverPlaceholder)}>
              <ImageIcon className="h-10 w-10 text-ink-muted" />
            </div>
          )}
        </div>
        <div className="space-y-3 p-6">
          <h1 className="text-2xl font-semibold text-ink">{scene.name}</h1>
          <p className={cn("text-sm", t.description)}>{scene.description || "暂无描述"}</p>
          {(scene.location || scene.atmosphere) && (
            <p className={cn("text-xs", t.meta)}>
              {[scene.location, scene.atmosphere].filter(Boolean).join(" · ")}
            </p>
          )}
          <Link to={routes.author(scene.author_id)} className="inline-block text-xs text-ink-muted hover:text-brand">
            创作者主页
          </Link>
          <ShareActions url={shareUrl} title={scene.name} />
        </div>
      </div>

      <DiscoverCommentSection contentType="scene" contentId={id} className="mt-10" />
    </div>
  );
}
