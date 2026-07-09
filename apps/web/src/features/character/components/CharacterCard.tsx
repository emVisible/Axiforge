import { Eye } from "lucide-react";

import { Badge, CardLink, cn, useCardTheme } from "@/shared/components/ui";
import { routes } from "@/shared/lib/routes";
import type { Character } from "@/shared/types/character";

interface CharacterCardProps {
  character: Character;
  showStatus?: boolean;
  detailTo?: string;
}

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function CharacterCard({
  character,
  showStatus = false,
  detailTo,
}: CharacterCardProps) {
  const { anchor, demeanor, contour } = character.character_data;
  const displayName = character.name || anchor?.name || "未命名角色";
  const t = useCardTheme();

  return (
    <CardLink to={detailTo ?? routes.characters.detail(character.id)} className="relative">
      {showStatus && (
        <span className="absolute right-4 top-4">
          <Badge
            variant={character.is_public ? "emerald" : "default"}
            size="sm"
          >
            {character.is_public ? "公开" : "私有"}
          </Badge>
        </span>
      )}

      <div className="mb-3 flex items-center gap-3">
        {character.image_path ? (
          <img
            src={character.image_path}
            alt=""
            className="h-11 w-11 flex-shrink-0 rounded-xl object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/80 to-brand text-lg font-bold text-white transition-transform group-hover:scale-105">
            {displayName[0] || "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "truncate text-sm font-semibold transition-colors",
              t.title,
            )}
          >
            {displayName}
          </h3>
          <p className={cn("mt-0.5 truncate text-xs", t.subtitle)}>
            {anchor?.essence || "等待定义..."}
          </p>
        </div>
      </div>

      <p className={cn("mb-3 line-clamp-2 text-xs leading-relaxed", t.description)}>
        {anchor?.summary ||
          demeanor?.speech_style ||
          contour?.first_impression ||
          "还没有设定描述"}
      </p>

      <div className="flex flex-wrap gap-1">
        {(character.view_count ?? 0) > 0 && (
          <Badge variant="default" size="sm">
            <Eye className="mr-0.5 h-3 w-3" strokeWidth={1.75} />
            {formatViews(character.view_count ?? 0)}
          </Badge>
        )}
        {character.tags.slice(0, 3).map((tag) => (
          <span
            key={tag.id}
            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
            style={{
              color: tag.color,
              borderColor: tag.color + "40",
              backgroundColor: tag.color + "10",
            }}
          >
            {tag.name}
          </span>
        ))}
        {character.tags.length > 3 && (
          <Badge variant="default" size="sm">
            +{character.tags.length - 3}
          </Badge>
        )}
      </div>
    </CardLink>
  );
}
