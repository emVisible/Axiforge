/**
 * 玩家运行时持久化的运行环境分派口（v0.8 · 宪章 Phase 7）。
 *
 * 为什么要有这一层：播放页原先 9 处直接调 `playerApi` / `ginkgoApi`，
 * 桌面离线态等于把存档发给一个不存在的服务端；且其中 4 处写作 `.catch(() => {})`，
 * 把「没存上」和「不需要存」压成同一个状态。分派收在一处，失败形态也收在一处。
 *
 * 返回形状刻意沿用传输态 `SaveSlotResponse`：存档/读档面板与两个子组件都吃这个形状，
 * 换类型等于顺手重构界面，违反本轮「只拆不加」。
 * 本地没有服务端 id，故 id 由 (project, token, slot) 合成——它只用作列表 key。
 */

import { playerApi, type SaveSlotResponse } from "@/shared/api/player";
import { ginkgoApi } from "@/shared/api/ginkgo";
import { getStorageProvider } from "@/shared/storage";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import type { CodexLedger, RuntimeState } from "@axiforge/core";
import type { StorageProvider } from "@axiforge/editor-core";

export interface SaveWrite {
  state: RuntimeState;
  summary: string | null;
  beatId: string | null;
  thumbRef: string | null;
  slot: number;
}

/** 后台同步的显式结果：不得用 undefined 或 void 表示「不知道成没成」 */
export type SyncOutcome =
  | { ok: true; via: "local" | "remote" }
  | { ok: false; via: "local" | "remote"; detail: string };

/**
 * 注入点。桌面/浏览器判定与 Provider 构造在此处收口，单测据此把「本地支」变成可执行路径——
 * 否则 node 环境下 `window` 不存在，本地分支在测试里永远跑不到（v0.8 已因此改判过一次验收句）。
 */
export const playerSavesDeps: {
  isLocal: () => boolean;
  provider: () => Promise<StorageProvider>;
} = {
  isLocal: isTauriEnvironment,
  provider: getStorageProvider,
};

const failed = (via: "local" | "remote", e: unknown): SyncOutcome => ({
  ok: false,
  via,
  detail: e instanceof Error ? e.message : String(e),
});

function localToResponse(projectId: string, token: string, s: {
  slot: number; state: Record<string, unknown>; summary: string | null;
  beatId: string | null; thumbRef: string | null; updatedAt: string;
}): SaveSlotResponse {
  return {
    id: `local:${projectId}:${token}:${s.slot}`,
    project_id: projectId,
    player_token: token,
    slot: s.slot,
    state: s.state as unknown as RuntimeState,
    summary: s.summary,
    beat_id: s.beatId,
    thumb_path: s.thumbRef,
    updated_at: s.updatedAt,
  };
}

/** 存档清单。失败抛错——调用方的空列表必须真的意味着「没有存档」 */
export async function listSaves(projectId: string, token: string): Promise<SaveSlotResponse[]> {
  if (playerSavesDeps.isLocal()) {
    const p = await playerSavesDeps.provider();
    const r = await p.listSaves(projectId, token);
    if (!r.ok) throw new Error(`存档清单读取失败：${r.error.code}`);
    return r.data.map((s) => localToResponse(projectId, token, s));
  }
  return playerApi.listSaves(projectId, token);
}

/** 「从未存过」返回 null，而不是抛错也不返回空壳 */
export async function getSave(
  projectId: string,
  token: string,
  slot = 0,
): Promise<SaveSlotResponse | null> {
  if (playerSavesDeps.isLocal()) {
    const p = await playerSavesDeps.provider();
    const r = await p.getSave(projectId, token, slot);
    if (!r.ok) {
      if (r.error.code === "not_found") return null;
      throw new Error(`存档读取失败：${r.error.code}`);
    }
    return localToResponse(projectId, token, r.data);
  }
  try {
    return await playerApi.getSave(projectId, token, slot);
  } catch (e) {
    if ((e as { status?: number })?.status === 404) return null;
    throw e;
  }
}

export async function writeSave(
  projectId: string,
  token: string,
  input: SaveWrite,
): Promise<SyncOutcome> {
  const local = playerSavesDeps.isLocal();
  try {
    if (local) {
      const p = await playerSavesDeps.provider();
      const r = await p.writeSave(projectId, token, {
        slot: input.slot,
        state: input.state as unknown as Record<string, unknown>,
        summary: input.summary,
        beatId: input.beatId,
        thumbRef: input.thumbRef,
      });
      if (!r.ok) return failed("local", r.error.code);
      return { ok: true, via: "local" };
    }
    await playerApi.putSave(projectId, {
      player_token: token,
      state: input.state,
      summary: input.summary,
      beat_id: input.beatId,
      thumb_path: input.thumbRef,
      slot: input.slot,
    });
    return { ok: true, via: "remote" };
  } catch (e) {
    return failed(local ? "local" : "remote", e);
  }
}

export async function clearSave(
  projectId: string,
  token: string,
  slot = 0,
): Promise<SyncOutcome> {
  const local = playerSavesDeps.isLocal();
  try {
    if (local) {
      const p = await playerSavesDeps.provider();
      const r = await p.clearSave(projectId, token, slot);
      if (!r.ok) return failed("local", r.error.code);
      return { ok: true, via: "local" };
    }
    await playerApi.clearSave(projectId, token, slot);
    return { ok: true, via: "remote" };
  } catch (e) {
    return failed(local ? "local" : "remote", e);
  }
}

export async function unlockAchievement(
  projectId: string,
  token: string,
  key: string,
): Promise<SyncOutcome> {
  const local = playerSavesDeps.isLocal();
  try {
    if (local) {
      const p = await playerSavesDeps.provider();
      const r = await p.unlockAchievement(projectId, token, key);
      if (!r.ok) return failed("local", r.error.code);
      return { ok: true, via: "local" };
    }
    await ginkgoApi.unlock(projectId, token, key);
    return { ok: true, via: "remote" };
  } catch (e) {
    return failed(local ? "local" : "remote", e);
  }
}

/**
 * 跨作品 Codex 账本没有本地表（宪章 Phase 7 未纳入，登记为后续项）。
 * 桌面离线时如实返回 skipped，不再像原先那样发一次注定失败的请求然后 `.catch(()=>{})` 当作无事发生。
 */
export async function syncCodex(
  projectId: string,
  token: string,
  ledger: CodexLedger,
): Promise<SyncOutcome | { ok: true; via: "skipped-offline" }> {
  if (playerSavesDeps.isLocal()) return { ok: true, via: "skipped-offline" };
  try {
    await playerApi.putCodex({ player_token: token, ledger, source_project_id: projectId });
    return { ok: true, via: "remote" };
  } catch (e) {
    return failed("remote", e);
  }
}
