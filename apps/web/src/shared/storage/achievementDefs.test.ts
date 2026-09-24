import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import {
  achievementDeps,
  createAchievement,
  deleteAchievement,
  listAchievements,
  updateAchievement,
} from "./achievementDefs";

const createRemote = vi.fn();
const updateRemote = vi.fn();

vi.mock("@/shared/api/ginkgo", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api/ginkgo")>();
  return {
    ...mod,
    ginkgoApi: {
      ...mod.ginkgoApi,
      create: (p: string, d: unknown) => createRemote(p, d),
      update: (id: string, d: unknown) => updateRemote(id, d),
    },
  };
});

let provider: StorageProvider;
let projectId: string;

beforeEach(async () => {
  provider = new MemoryStorageProvider();
  const created = await provider.createProject({ title: "成就宿主" });
  if (!created.ok) throw new Error("fixture failed");
  projectId = created.data.id;
  achievementDeps.isLocal = () => true;
  achievementDeps.provider = async () => provider;
  createRemote.mockReset();
  updateRemote.mockReset();
});

describe("achievementDefs 本地支", () => {
  it("建→列→改→再列：桌面离线可完成整条编辑回路", async () => {
    await createAchievement(projectId, {
      key: "first_light", title: "第一缕光", description: "点亮灯塔",
      icon: "sun", condition: { type: "flag", value: "lit" },
    });
    let defs = await listAchievements(projectId);
    expect(defs.map((d) => d.key)).toEqual(["first_light"]);
    expect(defs[0]?.title).toBe("第一缕光");
    expect(defs[0]?.project_id).toBe(projectId);

    await updateAchievement(projectId, defs[0]!, { title: "破晓" });
    defs = await listAchievements(projectId);
    expect(defs.length).toBe(1); // 改是覆写，不是新增一条
    expect(defs[0]?.title).toBe("破晓");
    expect(defs[0]?.condition).toEqual({ type: "flag", value: "lit" }); // 未打的补丁不得丢

    await deleteAchievement(projectId, defs[0]!.id);
    expect(await listAchievements(projectId)).toEqual([]);
  });

  it("底层失败抛出，不降级成空清单", async () => {
    const broken = {
      ...provider,
      listAchievements: async () => ({ ok: false, error: { code: "io", detail: "x" } }),
    } as unknown as StorageProvider;
    achievementDeps.provider = async () => broken;
    await expect(listAchievements(projectId)).rejects.toThrow("io");
  });
});

describe("achievementDefs 远端支", () => {
  it("非桌面环境仍打既有 REST", async () => {
    achievementDeps.isLocal = () => false;
    await createAchievement(projectId, {
      key: "k", title: "t", description: "", icon: "star", condition: {},
    });
    expect(createRemote).toHaveBeenCalledTimes(1);
    expect(createRemote.mock.calls[0]?.[0]).toBe(projectId);
  });
});
