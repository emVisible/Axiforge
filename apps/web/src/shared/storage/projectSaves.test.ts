// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import { createProject, deleteProject, projectSavesDeps } from "./projectSaves";

const createRemote = vi.fn();
const deleteRemote = vi.fn();

vi.mock("@/shared/api/editor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api/editor")>();
  return {
    ...mod,
    projectApi: {
      ...mod.projectApi,
      create: (data: unknown) => createRemote(data),
      delete: (id: string) => deleteRemote(id),
    },
  };
});

vi.mock("@/shared/lib/creatorId", () => ({ getCreatorId: () => "creator-test" }));

const FULL_CREATE = {
  title: "  长夜  ",
  description: "一部关于停电的剧本",
  mechanism: "三线并行",
  genre: "悬疑",
  theme_tags: ["夜", "电"],
  world_setting: "近郊变电站",
};

beforeEach(() => {
  createRemote.mockReset();
  deleteRemote.mockReset();
  projectSavesDeps.isLocal = () => true;
  projectSavesDeps.provider = async () => new MemoryStorageProvider();
});

describe("createProject 本地支", () => {
  it("元信息写进本地库并能读回来（只落标题=创建页的简介/题材凭空消失）", async () => {
    const shared = new MemoryStorageProvider();
    projectSavesDeps.provider = async () => shared;

    const res = await createProject(FULL_CREATE);

    expect(res.title).toBe("  长夜  ");
    expect(res.description).toBe("一部关于停电的剧本");
    expect(res.genre).toBe("悬疑");
    expect(res.theme_tags).toEqual(["夜", "电"]);
    expect(res.world_setting).toBe("近郊变电站");
    expect(res.mechanism).toBe("三线并行");

    const listed = await shared.listProjects();
    if (!listed.ok) throw new Error("fixture failed");
    const stored = listed.data.find((m) => m.id === res.id);
    expect(stored?.description).toBe("一部关于停电的剧本");
    expect(stored?.worldSetting).toBe("近郊变电站");
    expect(stored?.themeTags).toEqual(["夜", "电"]);
  });

  it("本地支一次请求都不发（桌面上 projectApi.create 打的是不存在的服务端）", async () => {
    await createProject({ title: "离线可建" });
    expect(createRemote).not.toHaveBeenCalled();
  });

  it("只填标题时不发第二次写入（列表页快速建卡没有元信息）", async () => {
    const shared = new MemoryStorageProvider();
    const spy = vi.spyOn(shared, "updateProjectMeta");
    projectSavesDeps.provider = async () => shared;

    await createProject({ title: "只填标题" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("底层 io 失败抛可读错误，不塌成 undefined", async () => {
    projectSavesDeps.provider = async () =>
      ({
        createProject: async () => ({
          ok: false,
          error: { code: "io", detail: "磁盘故障" },
        }),
      }) as unknown as StorageProvider;

    await expect(createProject({ title: "建不成" })).rejects.toThrow(/io（磁盘故障）/);
  });

  it("元信息补写失败 → 刚建的工程被删掉，不留半套元信息", async () => {
    const shared = new MemoryStorageProvider();
    const deleted: string[] = [];
    vi.spyOn(shared, "updateProjectMeta").mockResolvedValue({
      ok: false,
      error: { code: "io" },
    } as never);
    const realDelete = shared.deleteProject.bind(shared);
    vi.spyOn(shared, "deleteProject").mockImplementation(async (id: string) => {
      deleted.push(id);
      return realDelete(id);
    });
    projectSavesDeps.provider = async () => shared;

    await expect(createProject(FULL_CREATE)).rejects.toThrow(/元信息写入失败：io/);

    const listed = await shared.listProjects();
    expect(listed.ok && listed.data.length).toBe(0);
    expect(deleted.length).toBe(1);
  });

  it("回滚自身也失败 → 把残留工程 id 说清楚", async () => {
    projectSavesDeps.provider = async () =>
      ({
        createProject: async () => ({ ok: true, data: { id: "p-9527", title: "半套" } }),
        updateProjectMeta: async () => ({ ok: false, error: { code: "io" } }),
        deleteProject: async () => ({ ok: false, error: { code: "io" } }),
      }) as unknown as StorageProvider;

    await expect(createProject(FULL_CREATE)).rejects.toThrow(/p-9527 可能残留/);
  });
});

describe("createProject 远端支", () => {
  it("payload 原样交给 projectApi，本地 Provider 一次都不构造", async () => {
    projectSavesDeps.isLocal = () => false;
    const providerSpy = vi.fn();
    projectSavesDeps.provider = providerSpy;
    createRemote.mockResolvedValue({ id: "srv-1", title: "长夜" });

    const res = await createProject(FULL_CREATE);

    expect(createRemote).toHaveBeenCalledWith(FULL_CREATE);
    expect(res).toEqual({ id: "srv-1", title: "长夜" });
    expect(providerSpy).not.toHaveBeenCalled();
  });
});

describe("deleteProject", () => {
  it("本地支：真删——工程从本地库里消失", async () => {
    const shared = new MemoryStorageProvider();
    const created = await shared.createProject({ title: "待删" });
    if (!created.ok) throw new Error("fixture failed");
    projectSavesDeps.provider = async () => shared;

    await deleteProject(created.data.id);

    const listed = await shared.listProjects();
    if (!listed.ok) throw new Error("fixture failed");
    expect(listed.data.map((m) => m.id)).not.toContain(created.data.id);
    expect(deleteRemote).not.toHaveBeenCalled();
  });

  it("本地支：工程不存在 → not_found 说得出来源，不演成删除成功", async () => {
    projectSavesDeps.provider = async () => new MemoryStorageProvider();
    await expect(deleteProject("ghost")).rejects.toThrow(/删除工程失败：not_found/);
  });

  it("远端支：仍打 projectApi.delete", async () => {
    projectSavesDeps.isLocal = () => false;
    deleteRemote.mockResolvedValue(undefined);

    await deleteProject("srv-1");

    expect(deleteRemote).toHaveBeenCalledWith("srv-1");
  });
});
