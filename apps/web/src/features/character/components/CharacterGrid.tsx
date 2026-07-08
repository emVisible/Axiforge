import type { Character } from "@/shared/types";
import { CardGrid } from "@/shared/components/ui";
import CharacterCard from "./CharacterCard";

interface CharacterGridProps {
  characters: Character[];
  showStatus?: boolean;
  density?: "default" | "compact";
}

export default function CharacterGrid({
  characters,
  showStatus,
  density = "default",
}: CharacterGridProps) {
  return (
    <CardGrid density={density}>
      {characters.map((c) => (
        <CharacterCard
          key={c.id}
          character={c}
          showStatus={showStatus}
        />
      ))}
    </CardGrid>
  );
}
