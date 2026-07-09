import type { Character } from "@/shared/types";
import { CardGrid } from "@/shared/components/ui";
import CharacterCard from "./CharacterCard";

interface CharacterGridProps {
  characters: Character[];
  showStatus?: boolean;
  density?: "default" | "compact";
  detailTo?: (character: Character) => string;
}

export default function CharacterGrid({
  characters,
  showStatus,
  density = "default",
  detailTo,
}: CharacterGridProps) {
  return (
    <CardGrid density={density}>
      {characters.map((c) => (
        <CharacterCard
          key={c.id}
          character={c}
          showStatus={showStatus}
          detailTo={detailTo?.(c)}
        />
      ))}
    </CardGrid>
  );
}
