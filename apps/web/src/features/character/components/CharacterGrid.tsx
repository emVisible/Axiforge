import type { Character } from "@/shared/types";
import { CardGrid, type SurfaceTheme } from "@/shared/components/ui";
import CharacterCard from "./CharacterCard";

interface CharacterGridProps {
  characters: Character[];
  showStatus?: boolean;
  theme?: SurfaceTheme;
}

export default function CharacterGrid({
  characters,
  showStatus,
  theme = "light",
}: CharacterGridProps) {
  return (
    <CardGrid>
      {characters.map((c) => (
        <CharacterCard
          key={c.id}
          character={c}
          showStatus={showStatus}
          theme={theme}
        />
      ))}
    </CardGrid>
  );
}
