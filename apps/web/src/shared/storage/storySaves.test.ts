import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import {
  createStory,
  readStories,
  readStory,
  removeStory,
  storyDeps,
  updateStory,
} from "./storySaves";

const remote = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/shared/api/stories", () => ({ storyApi: remote }));

const OWNER = "char-saber";
const OTHER = "char-stranger";

let provider: StorageProvider;

beforeEach(() => {
  provider = new MemoryStorageProvider();
  storyDeps.isLocal = () => true;
  storyDeps.provider = async () => provider;
  for (const fn of Object.values(remote)) fn.mockReset();
});

describe("传记本地支", () => {
  it("建→列→单读→改→删全程零请求，created_at 等于 updated_at", async () => {
    const created = await createStory(OWNER, { title: "出航之前", content: "她没见过海。" });
    expect(remote.create).not.toHaveBeenCalled();
    expect(created.character_id).toBe(OWNER);
    expect(created.word_count).toBeGreaterThan(0);

    const rows = await readStories(OWNER);
    expect(rows.map((r) => r.id)).toEqual([created.id]);
    expect(remote.list).not.toHaveBeenCalled();

    const detail = await readStory(OWNER, created.id);
    expect(detail.content).toBe("她没见过海。");
    expect(detail.created_at).toBe(detail.updated_at);

    await updateStory(OWNER, created.id, { title: "出航" });
    const after = await readStory(OWNER, created.id);
    expect(after.title).toBe("出航");
    expect(after.content).toBe("她没见过海。");

    await removeStory(OWNER, created.id);
    expect(await readStories(OWNER)).toEqual([]);
  });

  it("字数由实现重算，客户端送的值不算数", async () => {
    const created = await createStory(OWNER, { title: "T", content: "a b c" });
    expect(created.word_count).toBe(3);
    await updateStory(OWNER, created.id, { content: "a b" });
    expect((await readStory(OWNER, created.id)).word_count).toBe(2);
  });

  it("角色之间互不可见：别人的传记既读不到也删不掉", async () => {
    const created = await createStory(OWNER, { title: "独占", content: "x" });
    expect(await readStories(OTHER)).toEqual([]);
    await expect(readStory(OTHER, created.id)).rejects.toThrow("not_found");
    await expect(removeStory(OTHER, created.id)).rejects.toThrow("not_found");
  });

  it("读失败抛出而非返回空清单——空必须真的意味着没有", async () => {
    provider = {
      ...provider,
      listStories: async () => ({ ok: false, error: { code: "io", detail: "x" } }),
    } as unknown as StorageProvider;
    await expect(readStories(OWNER)).rejects.toThrow("io");
  });
});

describe("传记远端支", () => {
  it("非桌面环境仍逐字打 REST，参数口径不变", async () => {
    storyDeps.isLocal = () => false;
    remote.list.mockResolvedValue([{ id: "1", title: "T", word_count: 1, sort_order: 0 }]);
    await readStories(OWNER);
    expect(remote.list).toHaveBeenCalledWith(OWNER);

    remote.update.mockResolvedValue({ id: "7" });
    await updateStory(OWNER, "7", { title: "改" });
    expect(remote.update).toHaveBeenCalledWith(OWNER, "7", { title: "改" });
  });
});
