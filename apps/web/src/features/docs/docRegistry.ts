import navJson from "../../../../../docs/user/_nav.json";

export interface DocNavItem {
  slug: string;
  title: string;
  order: number;
}

export interface DocNavSection {
  section: string;
  items: DocNavItem[];
}

export const docNav = navJson as DocNavSection[];

const docModules = import.meta.glob("../../../../../docs/user/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function fileKeyToSlug(fileKey: string): string | null {
  const match = fileKey.match(/docs\/user\/(.+)\.md$/);
  if (!match) return null;
  const rel = match[1]!;
  if (rel === "README") return null;
  return rel;
}

const slugToContent = new Map<string, string>();
let readmeContent = "";

for (const [fileKey, content] of Object.entries(docModules)) {
  const slug = fileKeyToSlug(fileKey);
  if (slug === null) {
    if (fileKey.endsWith("/README.md")) readmeContent = content;
    continue;
  }
  slugToContent.set(slug, content);
}

export function getDocReadme(): string {
  return readmeContent;
}

export function getDocBySlug(slug: string): string | null {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  if (!normalized) return readmeContent || null;
  return slugToContent.get(normalized) ?? null;
}

export function listDocSlugs(): string[] {
  return [...slugToContent.keys()];
}

/** 校验 _nav.json 中每项均有对应 MD（开发期断言） */
export function assertNavIntegrity(): void {
  for (const section of docNav) {
    for (const item of section.items) {
      if (!slugToContent.has(item.slug)) {
        throw new Error(`[docs] 导航 slug 缺少 Markdown: ${item.slug}`);
      }
    }
  }
}

assertNavIntegrity();
