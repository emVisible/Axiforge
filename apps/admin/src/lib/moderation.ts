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
