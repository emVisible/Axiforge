import type { Character } from "@/types";
import { CardGrid } from "@/components/ui";
import CharacterCard from "./CharacterCard";

interface CharacterGridProps {
  characters: Character[];
  showStatus?: boolean;
}

export default function CharacterGrid({
  characters,
  showStatus,
}: CharacterGridProps) {
  return (
    <CardGrid>
      {characters.map((c) => (
        <CharacterCard key={c.id} character={c} showStatus={showStatus} />
      ))}
    </CardGrid>
  );
}
