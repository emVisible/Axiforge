// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import { playerSavesDeps, writeSave, listSaves, getSave, clearSave, unlockAchievement, syncCodex } from "./playerSaves";

const putSave = vi.fn();
const clearSaveRemote = vi.fn();

vi.mock("@/shared/api/player", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api/player")>();
  return {
    ...mod,
    playerApi: {
      ...mod.playerApi,
      putSave: (p: string, b: unknown) => putSave(p, b),
      clearSave: (p: string, t: string, s?: number) => clearSaveRemote(p, t, s),
    },
  };
});

const TOKEN = "player-local-test-0001";
const STATE = { status: "active", currentBeatId: "b2", codex: {} } as never;

let provider: StorageProvider;
let projectId: string;

beforeEach(async () => {
  provider = new MemoryStorageProvider();
  const created = await provider.createProject({ title: "播放宿主" });
  if (!created.ok) throw new Error("fixture failed");
  projectId = created.data.id;
  playerSavesDeps.isLocal = () => true;
  playerSavesDeps.provider = async () => provider;
  putSave.mockReset();
  clearSaveRemote.mockReset();
});

describe("playerSaves 本地支", () => {
  it("写→列→读：走注入的 Provider，不碰网络", async () => {
    const w = await writeSave(projectId, TOKEN, {
      state: STATE, summary: "第 2 幕", beatId: "b2", thumbRef: "assets/x.png", slot: 1,
    });
    expect(w).toEqual({ ok: true, via: "local" });
    expect(putSave).not.toHaveBeenCalled();

    const list = await listSaves(projectId, TOKEN);
    expect(list.map((s) => s.slot)).toEqual([1]);
    expect(list[0]?.summary).toBe("第 2 幕");
    expect(list[0]?.beat_id).toBe("b2");
    expect(list[0]?.thumb_path).toBe("assets/x.png");
    expect(list[0]?.player_token).toBe(TOKEN);

    const one = await getSave(projectId, TOKEN, 1);
    expect(one?.state).toEqual(STATE);
  });

  it("覆写同一槽不追加（存档槽三元组唯一）", async () => {
    await writeSave(projectId, TOKEN, { state: STATE, summary: "一", beatId: null, thumbRef: null, slot: 0 });
    await writeSave(projectId, TOKEN, { state: STATE, summary: "二", beatId: null, thumbRef: null, slot: 0 });
    const list = await listSaves(projectId, TOKEN);
    expect(list.length).toBe(1);
    expect(list[0]?.summary).toBe("二");
  });

  it("从未写过的槽 → null；不返回空壳也不抛错", async () => {
    expect(await getSave(projectId, TOKEN, 7)).toBeNull();
  });

  it("清档后读不到，且清不存在的槽报失败而不是静默成功", async () => {
    await writeSave(projectId, TOKEN, { state: STATE, summary: null, beatId: null, thumbRef: null, slot: 3 });
    expect((await clearSave(projectId, TOKEN, 3)).ok).toBe(true);
    expect(await getSave(projectId, TOKEN, 3)).toBeNull();

    const ghost = await clearSave(projectId, TOKEN, 99);
    expect(ghost.ok).toBe(false);
    if (!ghost.ok) expect(ghost.detail).toContain("not_found");
  });

  it("底层失败必须显式返回 ok:false（原 .catch(()=>{}) 掩盖的就是这一类）", async () => {
    const broken: StorageProvider = {
      ...provider,
      writeSave: async () => ({ ok: false, error: { code: "io", detail: "磁盘满" } }),
    } as unknown as StorageProvider;
    playerSavesDeps.provider = async () => broken;
    const r = await writeSave(projectId, TOKEN, {
      state: STATE, summary: null, beatId: null, thumbRef: null, slot: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.via).toBe("local");
      expect(r.detail).toBe("io");
    }
  });

  it("成就解锁走本地；未知 key 报 not_found", async () => {
    const saved = await provider.saveAchievement(projectId, {
      id: "", key: "dark_room", title: "暗室", description: "", icon: "moon", condition: {},
    });
    if (!saved.ok) throw new Error("fixture failed");
    expect((await unlockAchievement(projectId, TOKEN, "dark_room")).ok).toBe(true);
    const unlocked = await provider.listUnlocked(projectId, TOKEN);
    expect(unlocked.ok && unlocked.data.map((u) => u.key)).toContain("dark_room");

    const missing = await unlockAchievement(projectId, TOKEN, "nope");
    expect(missing.ok).toBe(false);
  });

  it("Codex 无本地表：桌面态如实 skipped，不发注定失败的请求", async () => {
    const r = await syncCodex(projectId, TOKEN, { entries: [] } as never);
    expect(r).toEqual({ ok: true, via: "skipped-offline" });
  });
});

describe("playerSaves 远端支", () => {
  it("非桌面环境仍打既有 REST，不经本地 Provider", async () => {
    playerSavesDeps.isLocal = () => false;
    const r = await writeSave(projectId, TOKEN, {
      state: STATE, summary: "远端", beatId: "b1", thumbRef: null, slot: 2,
    });
    expect(r).toEqual({ ok: true, via: "remote" });
    expect(putSave).toHaveBeenCalledTimes(1);
    expect(putSave.mock.calls[0]?.[1]).toMatchObject({ slot: 2, summary: "远端", beat_id: "b1" });
  });
});
