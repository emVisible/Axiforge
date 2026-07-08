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
    throw new Error((body as { detail?: string }).detail || res.statusText);
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

export interface AdminReport {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  resolution_note?: string | null;
  created_at: string;
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
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (!entries.length) return "";
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
}

export const adminApi = {
  stats: () => request<DashboardStats>("/dashboard/stats"),
  reports: (status = "pending") =>
    request<AdminReport[]>(`/reports?status=${encodeURIComponent(status)}`),
  resolveReport: (id: string, action: "dismiss" | "take_down", note?: string) =>
    request<AdminReport>(`/reports/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, note }),
    }),
  users: ({ limit = 50, offset = 0 }: PageParams = {}) =>
    request<PaginatedResponse<AdminUser>>(`/users${qs({ limit, offset })}`),
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
  projects: ({ limit = 50, offset = 0 }: PageParams = {}) =>
    request<PaginatedResponse<AdminProject>>(`/projects${qs({ limit, offset })}`),
  setProjectStatus: (id: string, content_status: string) =>
    request<AdminProject>(`/projects/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ content_status }),
    }),
  characters: ({ limit = 50, offset = 0 }: PageParams = {}) =>
    request<PaginatedResponse<AdminCharacter>>(`/characters${qs({ limit, offset })}`),
  violations: (creatorId?: string, { limit = 50, offset = 0 }: PageParams = {}) =>
    request<PaginatedResponse<AdminViolation>>(
      `/violations${qs({ limit, offset, creator_id: creatorId })}`,
    ),
  auditLogs: ({ limit = 50, offset = 0 }: PageParams = {}) =>
    request<PaginatedResponse<AuditLog>>(`/audit-logs${qs({ limit, offset })}`),
};
