export const adminQueryKeys = {
  stats: ["admin", "stats"] as const,
  reports: (status: string) => ["admin", "reports", status] as const,
  moderation: (targetType: string, targetId: string) =>
    ["admin", "moderation", targetType, targetId] as const,
  users: (page: number, creatorId?: string, q?: string) =>
    ["admin", "users", page, creatorId ?? "", q ?? ""] as const,
  projects: (page: number, q?: string, status?: string) =>
    ["admin", "projects", page, q ?? "", status ?? ""] as const,
  characters: (page: number, q?: string, status?: string) =>
    ["admin", "characters", page, q ?? "", status ?? ""] as const,
  violations: (page: number, creatorId?: string) =>
    ["admin", "violations", page, creatorId ?? ""] as const,
  auditLogs: (page: number, action?: string) => ["admin", "audit", page, action ?? ""] as const,
};
