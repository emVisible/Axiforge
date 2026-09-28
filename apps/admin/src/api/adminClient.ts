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
  /** 单选题给出的"最主要一条"，仅建议：空串表示这次没有给（如词表结论）。 */
  primary_suggestion: string;
  primary_confidence: number | null;
  reasons: string[];
  policy_version: string;
  questions_version: string;
  decided_at: string | null;
}

/** 判断层词汇表：条款/规则/结论的中文短名由后端那一处定义投影出来。
 *  前端不再自己抄一份——两份表漂移时两端都不报错，最坏情况是把内部 id 印给运营。 */
export interface ModerationVocabulary {
  clauses: Record<string, string>;
  /** 处置面板「逐轴真值」该列哪几条（服务端由轴→条款映射投影，前端不自己抄）。 */
  axis_clauses: string[];
  suggestions: Record<string, string>;
  rules: Record<string, string>;
  actions: Record<string, string>;
  /** 类型化问题的短名：温度表覆盖面、"未标定轴"这些位置要用。 */
  questions: Record<string, string>;
  human_only_clauses: string[];
  policy_version: string;
  questions_version: string;
}

export interface WhatIfRow {
  case_id: string;
  subject_type: string;
  subject_id: string;
  state: string;
  actual_action: string;
  hypothetical_action: string;
  via: string;
  confidence: number;
  human_outcome: string;
  agreement: "agree" | "conflict" | "undecided";
  /** 这一行真实生效的线：评论与素材被按类型收紧过，填 0.75 不等于对评论按 0.75 判。 */
  effective_approve: number;
  effective_reject: number;
}

export interface WhatIfReport {
  approve_line: number;
  reject_line: number;
  evaluated: number;
  scanned: number;
  /** 库里案件总数。`scanned < population` 说明这份证据只覆盖最近一窗。 */
  population: number;
  /** `evaluated` 覆盖的**不同内容**数：它才是这条读数的样本量（案件数会因重复文本膨胀）。 */
  distinct_contents: number;
  skipped: Record<string, number>;
  auto_approve: number;
  auto_reject: number;
  agrees: number;
  conflicts: number;
  undecided: number;
  rows: WhatIfRow[];
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

/** 举报队列的分页入参。`offset` 没有它就只能看见前 50 条。 */
export interface ReportPageParams {
  status?: string;
  limit?: number;
  offset?: number;
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


/** 落库的单条类型化答案。形状与后端 `_answer_snapshot` 同源，不是一套统一 `value`。 */
export interface ModerationAnswer {
  type: string;
  noul?: number;
  score?: number;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  /** 温度缩放前的原始分布（D20 起才有；旧案件没有这一项）。 */
  raw?: Record<string, unknown>;
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
  /** 人逐轴确认过的条款真值。`null`＝没勾过（沿用机器条款），`[]`＝明确说一条都不成立。 */
  human_clauses: string[] | null;
  /** 与 `_answer_snapshot` 同形：标量按题型放在 `noul|score|choice` 下，不是统一的 `value`。
   *  这里曾经写着 `value`，于是依据表里 389/400 条案件的"取值"列渲染成 undefined。 */
  answers: Record<string, ModerationAnswer>;
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

/** 队列结论的版本新鲜度：判定只在保存那一刻发生，改版不会自己回头重算。 */
export interface QueueStaleness {
  total: number;
  stale_questions: number;
  stale_lexicon: number;
  current_questions: string;
  current_lexicon: string;
  /** 结论不是权威引擎给的（词表判的或全体弃权）——"自动判断覆盖了多少内容"的真分母。 */
  without_authoritative_verdict: number;
}

/** 批量重判的进度。计数是互斥单值：`judged` 只代表"权威引擎答了话"，
 *  只有词表说话的那些落在 `lexicon_only`——把它们混进 judged 会报出假的成功。 */
export interface RequeueStatus {
  running: boolean;
  queued: number;
  judged: number;
  lexicon_only: number;
  would_close: number;
  no_content: number;
  no_case: number;
  failed: number;
  cancelled: boolean;
}

export interface ModerationStats {
  by_state: Record<string, number>;
  by_engine: Record<string, number>;
  engines: { name: string; healthy: boolean; authoritative: boolean }[];
  policy: {
    version: string;
    auto_approve: number;
    auto_reject: number;
    human_band: number;
  };
  /** 能报标定面的引擎各一条（词表没有温度表，所以不在这里）。 */
  calibration: EngineCalibration[];
  staleness: QueueStaleness;
}

/** 温度表覆盖面。`missing` 与 `censored` 是两件事：前者没标定，后者标定被网格截断。 */
export interface EngineCalibration {
  engine: string;
  reachable: boolean;
  declared: string[];
  covered: string[];
  missing: string[];
  temperatures: Record<string, number>;
  grid_max: number;
  censored: string[];
  path: string;
  error: string;
}

export const adminApi = {
  stats: () => request<DashboardStats>("/dashboard/stats"),
  reports: ({ status = "pending", limit = 50, offset = 0 }: ReportPageParams = {}) =>
    request<PaginatedResponse<AdminReport>>(`/reports${qs({ status, limit, offset })}`),
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
  moderationQueue: (
    state?: string,
    limit = 50,
    order: "risk" | "new" = "risk",
    offset = 0,
  ) => request<PaginatedResponse<ModerationCase>>(`/moderation/queue${qs({ state, limit, order, offset })}`),
  moderationStats: () => request<ModerationStats>("/moderation/stats"),
  moderationVocabulary: () => request<ModerationVocabulary>("/moderation/vocabulary"),
  /** 只读的阈值假设：拿已落库的答案重放，不改策略、不写库。 */
  /** 阈值假设。`scan` 不传时由服务端那一个默认值决定窗宽——
   *  这里再写一份 500 就是第二个真相源，两边改一忘一时读到的窗会静默不同。 */
  moderationWhatIf: (approve: number, reject: number, scan?: number) =>
    request<WhatIfReport>(`/moderation/what-if${qs({ approve, reject, scan })}`),
  /** 启动批量重判。默认 `allow_close=false`：只刷新结论，不把这些条从人工队列里移走。 */
  moderationRequeue: (body: { scope: string; limit: number; allow_close?: boolean }) =>
    request<RequeueStatus>("/moderation/requeue", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  moderationRequeueStatus: () => request<RequeueStatus>("/moderation/requeue"),
  moderationRequeueCancel: () =>
    request<RequeueStatus>("/moderation/requeue/cancel", { method: "POST" }),
  moderationResolve: (id: string, outcome: "resolved" | "dismissed", note = "",
                      humanClauses?: string[]) =>
    request<ModerationCase>(`/moderation/cases/${id}/resolve`, {
      method: "POST",
      // `humanClauses === undefined` 与 `[]` 是两个意思：前者"没逐轴确认过"，
      // 后者"确认过且一条都不成立"。序列化时不能把 undefined 变成 []。
      body: JSON.stringify(
        humanClauses === undefined
          ? { outcome, note }
          : { outcome, note, human_clauses: humanClauses },
      ),
    }),
  /** 让模型现在重判一次（读全文，不是面板那份摘录）。 */
  moderationRejudge: (id: string) =>
    request<ModerationCase>(`/moderation/cases/${id}/rejudge`, { method: "POST" }),
  moderationReopen: (id: string, note = "") =>
    request<ModerationCase>(`/moderation/cases/${id}/reopen${qs({ note })}`, { method: "POST" }),
};
