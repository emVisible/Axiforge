export const adminQueryKeys = {
  stats: ["admin", "stats"] as const,
  reports: (status: string, page: number) => ["admin", "reports", status, page] as const,
  moderation: (targetType: string, targetId: string) =>
    ["admin", "moderation", targetType, targetId] as const,
  users: (page: number, creatorId?: string, q?: string) =>
    ["admin", "users", page, creatorId ?? "", q ?? ""] as const,
  projects: (page: number, q?: string, status?: string) =>
    ["admin", "projects", page, q ?? "", status ?? ""] as const,
  characters: (page: number, q?: string, status?: string) =>
    ["admin", "characters", page, q ?? "", status ?? ""] as const,
  moderationQueue: (state: string, order: string, page: number) =>
    ["admin", "moderation-queue", state, order, page] as const,
  moderationStats: () => ["admin", "moderation-stats"] as const,
  moderationVocabulary: ["admin", "moderation-vocabulary"] as const,
  violations: (page: number, creatorId?: string) =>
    ["admin", "violations", page, creatorId ?? ""] as const,
  auditLogs: (page: number, action?: string) => ["admin", "audit", page, action ?? ""] as const,
};
