import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";

/**
 * 部署形态判定（ADR-024：桌面 = 本地优先，云为可选协作服务）。
 *
 * 当前桌面壳没有任何指向后端的方式——API 基址是同源相对路径，在 `tauri://` 下发不出去。
 * 因此云端专属能力（发现页、全局搜索、创作者数据面板、版本历史、关系图、在线发布）
 * 在桌面态一律按**缺席**处理：入口要么隐藏，要么给出可读说明，
 * 而不是让用户点进去看到一条网络错误。
 *
 * 判据是「可直接检查的当前状态」，不预计算一堆布尔标记。
 */
export function isLocalOnlyDeployment(): boolean {
  return isTauriEnvironment();
}
