import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { UserRound } from "lucide-react";

import { characterApi } from "@/shared/api/characters";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import type { Character } from "@/shared/types/character";
import ForkChain from "@/features/character/components/ForkChain";
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

export default function DiscoverCharacterDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const t = useCardTheme();
  const [character, setCharacter] = useState<Character | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const shareUrl = `${window.location.origin}/discover/characters/${id}`;

  // 桌面态这一页没有读者：它与 DiscoverPage 同进退（E35「入口与目标同生共死」），
  // 否则直接输 URL 进来就是一次注定失败的云端请求。
  const localOnly = isLocalOnlyDeployment();

  useEffect(() => {
    if (localOnly) return;
    (async () => {
      try {
        const data = await characterApi.get(id, { bump_view: true });
        if (!data.is_public) {
          setStatus("error");
          return;
        }
        setCharacter(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [id, localOnly]);

  if (localOnly) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <CloudFeatureNotice feature="公开角色详情" />
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

  if (status === "error" || !character) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">
        角色不存在或未公开
        <div className="mt-4">
          <BackLink to={routes.discover}>返回发现</BackLink>
        </div>
      </div>
    );
  }

  const anchor = character.character_data?.anchor as
    | { summary?: string; essence?: string }
    | undefined;
  const blurb = anchor?.summary || anchor?.essence || "暂无简介";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <PageMeta
        title={character.name}
        description={blurb}
        image={getImageUrl(character.image_path) ?? undefined}
        url={shareUrl}
      />
      <BackLink to={`${routes.discover}?tab=characters`}>发现 · 角色</BackLink>

      <div className={cn("mt-4 overflow-hidden rounded-2xl border", t.surfaceStatic)}>
        <div className="flex flex-col gap-4 p-6 sm:flex-row">
          <div className={cn("mx-auto aspect-[3/4] w-40 shrink-0 overflow-hidden rounded-xl sm:mx-0", t.cover)}>
            {character.image_path ? (
              <img
                src={getImageUrl(character.image_path) || ""}
                alt={character.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={cn("flex h-full items-center justify-center", t.coverPlaceholder)}>
                <UserRound className="h-12 w-12" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-ink">{character.name}</h1>
            <p className={cn("mt-2 text-sm", t.description)}>{blurb}</p>
            <div className={cn("mt-3 flex flex-wrap items-center gap-2 text-xs", t.meta)}>
              <Link to={routes.author(character.author_id)} className="hover:text-brand">
                创作者主页
              </Link>
              <ForkChain characterId={character.id} />
            </div>
            <div className="mt-4">
              <ShareActions url={shareUrl} title={character.name} />
            </div>
          </div>
        </div>
      </div>

      <DiscoverCommentSection
        contentType="character"
        contentId={id}
        className="mt-10"
      />
    </div>
  );
}
