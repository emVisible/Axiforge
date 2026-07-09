import { studioCharacterUrl, studioProjectUrl, splitNoteBody } from "@/lib/links";

export default function NoteBody({ body }: { body: string }) {
  const parts = splitNoteBody(body);
  return (
    <p className="mt-1 whitespace-pre-wrap text-xs text-white/45">
      {parts.map((part, i) => {
        if (part.type === "text") return <span key={i}>{part.value}</span>;
        if (part.type === "project") {
          return (
            <a
              key={i}
              href={studioProjectUrl(part.id)}
              target="_blank"
              rel="noreferrer"
              className="text-[#f5d78e] hover:underline"
            >
              [[project:{part.id.slice(0, 8)}…]]
            </a>
          );
        }
        return (
          <a
            key={i}
            href={studioCharacterUrl(part.id)}
            target="_blank"
            rel="noreferrer"
            className="text-[#f5d78e] hover:underline"
          >
            [[character:{part.id.slice(0, 8)}…]]
          </a>
        );
      })}
    </p>
  );
}
