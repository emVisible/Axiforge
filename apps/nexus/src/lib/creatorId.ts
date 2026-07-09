/**
 * 与 web `shared/lib/creatorId.ts` 共用 localStorage 键，保证 Studio / Nexus 同一创作者身份。
 */
const KEY = "axiforge.creatorId";
const LEGACY_KEY = "nexus-author-id";

export function getCreatorId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && legacy !== "creator-local-dev") {
        id = legacy;
        localStorage.setItem(KEY, id);
      }
    }
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `creator-${crypto.randomUUID()}`
          : `creator-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `creator-ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}
