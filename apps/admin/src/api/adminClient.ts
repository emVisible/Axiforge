const TOKEN_KEY = "axiforge_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function requestWithToken<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/v1/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("未授权，请重新登录");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body, res.statusText || "请求失败"));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  try {
    return await requestWithToken<T>(path, token, init);
  } catch (e) {
    if (e instanceof Error && e.message === "未授权，请重新登录") {
      clearAdminToken();
    }
    throw e;
  }
}

/** 用给定 token 直接探测一个只读端点，用于登录页校验有效性（不落地到 localStorage）。 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await requestWithToken<unknown>("/dashboard/stats", token);
    return true;
  } catch {
    return false;
  }
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface DashboardTopProject {
  id: string;
  title: string;
  play_count: number;
  view_count: number;
}

export interface DashboardStats {
  pending_reports: number;
  total_users: number;
  public_projects: number;
  public_characters: number;
  taken_down_projects: number;
  banned_users: number;
  story_plays_7d: number;
  project_forks_7d: number;
  violations_7d: number;
  total_projects: number;
  authors_with_projects: number;
  played_projects_7d: number;
  upload_bytes: number;
  upload_files: number;
  top_projects: DashboardTopProject[];
}

export interface ModerationTargetPreview {
  title: string;
  excerpt: string;
  author_id?: string | null;
  author_display?: string | null;
  author_strike_count: number;
  author_is_banned: boolean;
  content_status?: string | null;
  is_public?: boolean | null;
  cover_image?: string | null;
  discover_path?: string | null;
  parent_title?: string | null;
  parent_path?: string | null;
  exists: boolean;
  violation_count: number;
}

export interface AutoJudgement {
  case_id: string;
  state: string;
  engine: string;
  suggested_action: string;
  final_action: string;
  via: string;
  confidence: number | null;
  authoritative: boolean;
  calibrated: boolean;
  clause_ids: string[];
  reasons: string[];
  policy_version: string;
  questions_version: string;
  decided_at: string | null;
}

export interface ModerationContext {
  target_preview: ModerationTargetPreview;
  related_comments: AdminCommentSnippet[];
  author_profile: AuthorModerationProfile | null;
  auto_judgement: AutoJudgement | null;
}

export interface AdminCommentSnippet {
  id: string;
  author_id: string;
  body: string;
  status: string;
  created_at: string;
}

export interface AuthorModerationProfile {
  user_id?: string | null;
  creator_id: string;
  display_name?: string | null;
  email?: string | null;
  strike_count: number;
  is_banned: boolean;
  project_count: number;
  character_count: number;
  violation_count: number;
}

export interface AdminReport {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  reporter_token?: string | null;
  resolution_note?: string | null;
  created_at: string;
  target_preview: ModerationTargetPreview;
}

export interface AdminUser {
  id: string;
  creator_id: string;
  email?: string | null;
  display_name?: string | null;
  role: string;
  is_banned: boolean;
  strike_count: number;
  created_at: string;
}

export interface AdminProject {
  id: string;
  title: string;
  author_id: string;
  is_public: boolean;
  content_status: string;
  view_count: number;
  play_count: number;
  created_at: string;
}

export interface AdminCharacter {
  id: string;
  name: string;
  author_id: string;
  is_public: boolean;
  content_status: string;
  view_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target_type?: string | null;
  target_id?: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface AdminViolation {
  id: string;
  subject_type: string;
  subject_id: string;
  clause: string;
  note?: string | null;
  actor: string;
  author_id?: string | null;
  created_at: string;
}

export interface PageParams {
  limit?: number;
  offset?: number;
  q?: string;
  content_status?: string;
  creator_id?: string;
}

function formatApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const loc = "loc" in item && Array.isArray(item.loc) ? item.loc.join(".") : "";
          return loc ? `${loc}: ${String(item.msg)}` : String(item.msg);
        }
        return typeof item === "string" ? item : JSON.stringify(item);
      })
      .join("；");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return fallback;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (!entries.length) return "";
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
}


export interface ModerationCase {
  id: string;
  subject_type: string;
  subject_id: string;
  author_id: string;
  state: string;
  suggested_action: string;
  final_action: string;
  via: string;
  confidence: number | null;
  engine: string;
  authoritative: boolean;
  calibrated: boolean;
  clause_ids: string[];
  answers: Record<string, { type: string; value: unknown; confidence: number }>;
  reasons: string[];
  policy_version: string;
  questions_version: string;
  lexicon_version: string;
  latency_ms: number;
  created_at: string;
  decided_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
}

export interface ModerationStats {
  by_state: Record<string, number>;
  by_engine: Record<string, number>;
  engines: { name: string; healthy: boolean; authoritative: boolean }[];
}

export const adminApi = {
  stats: () => request<DashboardStats>("/dashboard/stats"),
  reports: (status = "pending") =>
    request<AdminReport[]>(`/reports?status=${encodeURIComponent(status)}`),
  resolveReport: (
    id: string,
    action: "dismiss" | "take_down",
    note?: string,
    resolveSiblings = true,
  ) =>
    request<AdminReport>(`/reports/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, note, resolve_siblings: resolveSiblings }),
    }),
  moderationContext: (targetType: string, targetId: string) =>
    request<ModerationContext>(
      `/moderation/context${qs({ target_type: targetType, target_id: targetId })}`,
    ),
  hideComment: (id: string) =>
    request<void>(`/comments/${id}/hide`, { method: "POST" }),
  users: ({ limit = 50, offset = 0, creator_id, q }: PageParams = {}) =>
    request<PaginatedResponse<AdminUser>>(`/users${qs({ limit, offset, creator_id, q })}`),
  banUser: (id: string, is_banned: boolean, note?: string) =>
    request<AdminUser>(`/users/${id}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ is_banned, note }),
    }),
  resetStrikes: (id: string, strike_count = 0, note?: string) =>
    request<AdminUser>(`/users/${id}/strikes`, {
      method: "PATCH",
      body: JSON.stringify({ strike_count, note }),
    }),
  projects: ({ limit = 50, offset = 0, q, content_status }: PageParams = {}) =>
    request<PaginatedResponse<AdminProject>>(
      `/projects${qs({ limit, offset, q, content_status })}`,
    ),
  setProjectStatus: (id: string, content_status: string) =>
    request<AdminProject>(`/projects/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ content_status }),
    }),
  setCharacterStatus: (id: string, content_status: string) =>
    request<AdminCharacter>(`/characters/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ content_status }),
    }),
  characters: ({ limit = 50, offset = 0, q, content_status }: PageParams = {}) =>
    request<PaginatedResponse<AdminCharacter>>(
      `/characters${qs({ limit, offset, q, content_status })}`,
    ),
  violations: (creatorId?: string, { limit = 50, offset = 0 }: PageParams = {}) =>
    request<PaginatedResponse<AdminViolation>>(
      `/violations${qs({ limit, offset, creator_id: creatorId })}`,
    ),
  auditLogs: ({ limit = 50, offset = 0, action }: PageParams & { action?: string } = {}) =>
    request<PaginatedResponse<AuditLog>>(`/audit-logs${qs({ limit, offset, action })}`),
  moderationQueue: (state?: string, limit = 50, order: "risk" | "new" = "risk") =>
    request<ModerationCase[]>(`/moderation/queue${qs({ state, limit, order })}`),
  moderationStats: () => request<ModerationStats>("/moderation/stats"),
  moderationResolve: (id: string, outcome: "resolved" | "dismissed", note = "") =>
    request<ModerationCase>(`/moderation/cases/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ outcome, note }),
    }),
  moderationReopen: (id: string, note = "") =>
    request<ModerationCase>(`/moderation/cases/${id}/reopen${qs({ note })}`, { method: "POST" }),
};
