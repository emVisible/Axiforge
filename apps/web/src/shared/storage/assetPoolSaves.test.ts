import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import {
  assetPoolDeps,
  createItem,
  createScene,
  readItems,
  readScenes,
  removeItem,
  updateItem,
} from "./assetPoolSaves";

const listRemote = vi.fn().mockResolvedValue([]);
const deleteRemote = vi.fn().mockResolvedValue(undefined);

vi.mock("@/shared/api/editor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api/editor")>();
  return {
    ...mod,
    itemApi: { ...mod.itemApi, list: (p?: unknown) => listRemote(p), delete: (id: string) => deleteRemote(id) },
  };
});

const OWNER = "creator-test";

let provider: StorageProvider;

beforeEach(() => {
  provider = new MemoryStorageProvider();
  assetPoolDeps.isLocal = () => true;
  assetPoolDeps.provider = async () => provider;
  listRemote.mockClear();
  deleteRemote.mockClear();
});

describe("道具本地支", () => {
  it("建→列→改→再列→删：改是覆写且未触碰字段不丢", async () => {
    const created = await createItem(
      { name: "铜钥匙", description: "开地窖", category: "关键道具", mechanism_tags: ["开锁"] },
      OWNER,
    );
    expect(created.name).toBe("铜钥匙");
    expect(created.mechanism_tags).toEqual(["开锁"]);
    expect(listRemote).not.toHaveBeenCalled();

    let rows = await readItems({ authorId: OWNER });
    expect(rows.map((r) => r.id)).toEqual([created.id]);

    await updateItem(created.id, { rarity: "传说" }, OWNER);
    rows = await readItems({ authorId: OWNER });
    expect(rows.length).toBe(1);
    expect(rows[0]?.rarity).toBe("传说");
    expect(rows[0]?.name).toBe("铜钥匙");
    expect(rows[0]?.mechanism_tags).toEqual(["开锁"]);

    await removeItem(created.id);
    expect(await readItems({ authorId: OWNER })).toEqual([]);
  });

  it("分类筛选在本地生效；读失败抛出而非返回空", async () => {
    await createItem({ name: "A", category: "日常" }, OWNER);
    await createItem({ name: "B", category: "魔幻" }, OWNER);
    expect((await readItems({ authorId: OWNER, category: "魔幻" })).map((r) => r.name)).toEqual(["B"]);

    assetPoolDeps.provider = async () =>
      ({ ...provider, listItems: async () => ({ ok: false, error: { code: "io", detail: "x" } }) }) as unknown as StorageProvider;
    await expect(readItems({ authorId: OWNER })).rejects.toThrow("io");
  });

  it("删不存在的道具报失败，不静默成功", async () => {
    await expect(removeItem("ghost")).rejects.toThrow("not_found");
  });
});

describe("场景本地支", () => {
  it("建→列：标签与节点模板逐字段等价", async () => {
    await createScene(
      {
        name: "地窖", world_setting: "方舟", rules: "不得点灯",
        tags: ["密室"], node_templates: [{ title: "暗格" }],
      },
      OWNER,
    );
    const rows = await readScenes({ authorId: OWNER });
    expect(rows[0]?.world_setting).toBe("方舟");
    expect(rows[0]?.tags).toEqual(["密室"]);
    expect(rows[0]?.node_templates).toEqual([{ title: "暗格" }]);
  });
});

describe("远端支", () => {
  it("非桌面环境仍以 snake_case 参数打 REST", async () => {
    assetPoolDeps.isLocal = () => false;
    await readItems({ authorId: OWNER, category: "日常", search: "钥" });
    expect(listRemote).toHaveBeenCalledWith({ author_id: OWNER, category: "日常", search: "钥" });
  });
});
