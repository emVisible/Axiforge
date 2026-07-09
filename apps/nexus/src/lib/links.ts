const WEB_ORIGIN =
  import.meta.env.VITE_WEB_ORIGIN?.replace(/\/$/, "") || "http://localhost:5174";

const PROJECT_RE = /\[\[project:([0-9a-f-]{36})\]\]/gi;
const CHARACTER_RE = /\[\[character:([0-9a-f-]{36})\]\]/gi;

export function parseNexusLinks(body: string): {
  projects: string[];
  characters: string[];
} {
  const projects = new Set<string>();
  const characters = new Set<string>();
  for (const m of body.matchAll(PROJECT_RE)) projects.add(m[1]);
  for (const m of body.matchAll(CHARACTER_RE)) characters.add(m[1]);
  return { projects: [...projects], characters: [...characters] };
}

export function studioProjectUrl(id: string): string {
  return `${WEB_ORIGIN}/studio/projects/${id}`;
}

export function studioCharacterUrl(id: string): string {
  return `${WEB_ORIGIN}/studio/characters/${id}`;
}

export type NoteBodyPart =
  | { type: "text"; value: string }
  | { type: "project"; id: string }
  | { type: "character"; id: string };

export function splitNoteBody(body: string): NoteBodyPart[] {
  const re = /\[\[(project|character):([0-9a-f-]{36})\]\]/gi;
  const parts: NoteBodyPart[] = [];
  let last = 0;
  for (const m of body.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ type: "text", value: body.slice(last, idx) });
    parts.push({
      type: m[1].toLowerCase() as "project" | "character",
      id: m[2],
    });
    last = idx + m[0].length;
  }
  if (last < body.length) parts.push({ type: "text", value: body.slice(last) });
  return parts.length ? parts : [{ type: "text", value: body }];
}
