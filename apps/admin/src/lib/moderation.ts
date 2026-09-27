import type { AdminReport } from "@/api/adminClient";

const WEB_ORIGIN =
  import.meta.env.VITE_WEB_ORIGIN?.replace(/\/$/, "") || "http://localhost:5174";

export function webDiscoverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${WEB_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatReportTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function maskToken(token: string | null | undefined): string {
  if (!token) return "匿名";
  if (token.length <= 8) return token;
  return `…${token.slice(-8)}`;
}

export const targetTypeLabel: Record<string, string> = {
  project: "作品",
  character: "角色",
  comment: "评论",
};

export function reportSummaryLine(r: AdminReport): string {
  const p = r.target_preview;
  if (p.exists) return p.title;
  return `${targetTypeLabel[r.target_type] || r.target_type} · ${r.target_id.slice(0, 8)}…`;
}

export function reportTargetKey(r: AdminReport): string {
  return `${r.target_type}:${r.target_id}`;
}

export function countSiblingReports(items: AdminReport[], selected: AdminReport): number {
  return items.filter(
    (r) => r.target_type === selected.target_type && r.target_id === selected.target_id,
  ).length;
}

/** 内容条款 → 中文。队列行与预览面板必须同一份措辞：
 *  两处各写一份，早晚会有一处改了另一处没改，同一个条款在两个界面长两个名字。
 *  真正的注册表在后端 `questions.REGISTERED_CLAUSES`，这里与它的漂移是一个已知待办。 */
export const CLAUSE_LABELS: Record<string, string> = {
  sexual_explicit: "露骨性内容",
  gratuitous_violence: "血腥暴力",
  self_harm_unsafe: "自伤未安全处理",
  hate_incitement: "煽动仇恨",
  illegal_instruction: "违法教程",
  doxxing: "真人隐私",
  spam_promotion: "导流垃圾",
  rating_mismatch: "分级不符",
};

/** 命中即建议人工的规则 → 中文（`via=suggested_human:<rule>` 的后半段）。 */
const RULE_LABELS: Record<string, string> = {
  high_severity: "危害量级偏高",
  adult_or_violence_needs_label: "含成人/血腥内容，需人工定级",
  hate_or_doxx_or_instruction: "仇恨/隐私/违法教程",
  spam_only: "导流垃圾",
};

const VIA_LABELS: Record<string, string> = {
  non_authoritative_engine: "引擎不权威，转人工",
  uncalibrated: "置信度未校准，不自动执行",
  engine_abstained: "所有引擎弃权",
  engine_unavailable: "审核引擎不可用",
};

/** 带后缀的 via 全部走这里剥前缀：手写 `slice(19)` 是一个没人能一眼验住的数字。 */
function tail(via: string, prefix: string): string {
  return via.startsWith(prefix) ? via.slice(prefix.length) : via;
}

/**
 * `via` 是"这条结论为什么是这个动作"的机器标签，直接摊给运营看等于让人读源码。
 * 后端保持稳定前缀、前端负责措辞：改文案不动契约。
 *
 * 带后缀的 via（`human_only_clause:doxxing`、`below_approve_line 0.77<0.90`）
 * 保留数字与条款名：一队列里全是"转人工"时，运营就无法回答"这条跟那条有什么不同"。
 */
export function viaLabel(via: string): string {
  if (!via) return "—";
  if (via.startsWith("auto@")) return `自动执行（线 ${tail(via, "auto@")}）`;
  if (via.startsWith("below_approve_line")) return `低于通过线（${tail(via, "below_approve_line ")}）`;
  if (via.startsWith("below_reject_line")) return `低于驳回线（${tail(via, "below_reject_line ")}）`;
  if (via.startsWith("engine_error")) return "引擎异常，转人工";
  if (via.startsWith("refusal:")) {
    // 引擎"有话但不能执行"与"没标定"是两件事：混起来会让人去重拟温度表，
    // 而真正要做的可能是把长文分段。
    const detail = tail(via, "refusal:");
    return detail.startsWith("over_length:")
      ? `正文超出模型窗口（${tail(detail, "over_length:")}），不做截断后自动裁决`
      : `引擎拒绝自动执行：${detail}`;
  }
  if (via.startsWith("human_only_clause:")) {
    const clause = tail(via, "human_only_clause:");
    return `命中需人工判断的条款：${clauseLabel(clause)}`;
  }
  if (via.startsWith("suggested_human:")) {
    const rule = tail(via, "suggested_human:");
    return `规则建议人工：${RULE_LABELS[rule] || rule}`;
  }
  return VIA_LABELS[via] ?? via;
}

export function clauseLabel(clause: string): string {
  return CLAUSE_LABELS[clause] || clause;
}

/** 动作的稳定中文（队列的"结论"列与预览面板共用，不能一处中文一处英文）。 */
const ACTION_LABELS: Record<string, string> = {
  approve: "自动通过",
  reject: "自动驳回",
  human_review: "转人工",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action || "—";
}
