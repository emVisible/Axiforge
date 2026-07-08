import { useState } from "react";
import { useForkChain } from "@/shared/hooks/useCharacters";
import { Link } from "react-router";
import { routes } from "@/shared/lib/routes";

interface Props {
  characterId: string;
}

export default function ForkChain({ characterId }: Props) {
  const { data: chain, isLoading } = useForkChain(characterId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return null;
  if (!chain || chain.total_forks === 0) return null;

  const displayChain = expanded ? chain.chain : chain.chain.slice(0, 3);

  return (
    <>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1 flex-wrap min-w-0">
        {displayChain.map((item, i) => (
          <span key={item.id} className="flex items-center gap-1">
            {i > 0 && (
              <svg
                className="w-3 h-3 text-ink-muted/40 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            <Link
              to={routes.characters.detail(item.id)}
              className={`hover:text-brand transition-colors truncate max-w-[100px] ${item.is_current ? "text-ink font-medium" : "text-ink-muted"}`}
            >
              {item.name}
            </Link>
          </span>
        ))}
        {!expanded && chain.chain.length > 3 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-ink-muted hover:text-brand transition-colors flex-shrink-0"
          >
            +{chain.chain.length - 3}
          </button>
        )}
        {expanded && chain.chain.length > 3 && (
          <button
            onClick={() => setExpanded(false)}
            className="text-ink-muted hover:text-brand transition-colors flex-shrink-0"
          >
            收起
          </button>
        )}
      </span>
    </>
  );
}
