import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CharacterData } from "@/shared/types/character";
import {
  CREATE_DRAFT_ID,
  draftManager,
  editDraftId,
} from "./draftManager";

/**
 * 角色草稿的本地读写（`draftManager.ts`）。它有一条别的本地模块都没有的规则：
 * **索引只留 10 份，被挤掉的那份连正文一起删**；而 `DraftRestoreDialog` 完全靠这份索引说话。
 * 所以这里既数返回值，也数**存储里还剩哪些 key**——"索引对了正文没了"与"正文孤儿"都只有这么量才看得见。
 * 夹具用 `as unknown as CharacterData`：`save` 只读 `anchor.name` / `anchor.essence` 两处，
 * 六个必填域由类型系统在外面管，这里不重复铺一份完整角色。
 */
const PREFIX = "axiforge_draft_";
const INDEX = "axiforge_draft_index";
const store = new Map<string, string>();

const draftOf = (anchor: Record<string, unknown>) =>
  ({ anchor }) as unknown as CharacterData;

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

const ids = () =>
  [...store.keys()].filter((k) => k.startsWith(PREFIX) && k !== INDEX).sort();

describe("save", () => {
  it("正文与索引一起落盘，新草稿排在最前，getLatest 就是它", () => {
    draftManager.save("a", draftOf({ name: "甲" }));
    draftManager.save("b", draftOf({ name: "乙" }));
    expect(JSON.parse(store.get(`${PREFIX}b`) as string)).toEqual({
      anchor: { name: "乙" },
    });
    expect(draftManager.getIndex().map((e) => e.id)).toEqual(["b", "a"]);
    expect(draftManager.getLatest()?.id).toBe("b");
  });

  it("索引项的名字按 meta → anchor.name → anchor.essence → 未命名 逐级退", () => {
    draftManager.save("m", draftOf({ name: "甲" }), { name: "传进来的" });
    draftManager.save("n", draftOf({ name: "乙" }));
    draftManager.save("e", draftOf({ essence: "丙的底色" }));
    draftManager.save("u", draftOf({}));
    expect(draftManager.getIndex().map((e) => e.name)).toEqual([
      "未命名",
      "丙的底色",
      "乙",
      "传进来的",
    ]);
  });

  it("更新已存在的草稿：正文覆盖、名字刷新，但索引里的位置不前移（特征化）", () => {
    draftManager.save("old", draftOf({ name: "先建的" }));
    draftManager.save("new", draftOf({ name: "后建的" }));
    draftManager.save("old", draftOf({ name: "改过的" }));
    const idx = draftManager.getIndex();
    expect(idx.map((e) => e.id)).toEqual(["new", "old"]);
    expect(idx.find((e) => e.id === "old")?.name).toBe("改过的");
    expect(store.get(`${PREFIX}old`)).toBe('{"anchor":{"name":"改过的"}}');
    // 界面拿 getLatest() 决定"要不要问你是否恢复"，所以"最近**编辑**过的那份"不会浮到顶。
    // updatedAt 每份都在写，但全仓没有读者（grep `updatedAt` 只命中别的域），故排序也用它不着它。
  });

  it("第十一份进来时挤掉最旧那份，且把它的正文一起删掉", () => {
    for (let i = 1; i <= 10; i++) {
      draftManager.save(`d${i}`, draftOf({ name: `第${i}份` }));
    }
    expect(draftManager.getIndex()).toHaveLength(10);
    draftManager.save("d11", draftOf({ name: "第十一份" }));
    expect(draftManager.getIndex()).toHaveLength(10);
    expect(draftManager.getLatest()?.id).toBe("d11");
    expect(store.has(`${PREFIX}d1`)).toBe(false);
    expect(ids()).toHaveLength(10);
  });

  it("存储抛错时整块静默：不抛、也不留半份索引", () => {
    const boom = () => {
      throw new Error("quota exceeded");
    };
    vi.stubGlobal("localStorage", {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
      clear: boom,
    });
    expect(() => draftManager.save("x", draftOf({ name: "甲" }))).not.toThrow();
    expect(draftManager.getIndex()).toEqual([]);
    expect(draftManager.getLatest()).toBeNull();
    // 这一条钉的是"存不上"与"本来就没什么可存"在界面上同形——draftManager 是唯一整块 catch 的本地模块。
  });
});

describe("load / remove / clearAll", () => {
  it("load 读得回正文，坏 JSON 退成 null 不抛", () => {
    draftManager.save("a", draftOf({ name: "甲" }));
    expect(draftManager.load("a")).toEqual({ anchor: { name: "甲" } });
    expect(draftManager.load("没这份")).toBeNull();
    store.set(`${PREFIX}bad`, "{不是 json");
    expect(draftManager.load("bad")).toBeNull();
  });

  it("getIndex 遇到坏 JSON 退成空表（界面上的草稿列表随之为空，而不是崩）", () => {
    store.set(INDEX, "[ 不是 json");
    expect(draftManager.getIndex()).toEqual([]);
    expect(draftManager.getLatest()).toBeNull();
  });

  it("remove 同时删正文与索引项", () => {
    draftManager.save("a", draftOf({ name: "甲" }));
    draftManager.save("b", draftOf({ name: "乙" }));
    draftManager.remove("a");
    expect(store.has(`${PREFIX}a`)).toBe(false);
    expect(draftManager.getIndex().map((e) => e.id)).toEqual(["b"]);
  });

  it("clearAll 只删索引里列出的正文：脱离索引的草稿正文留在原地（特征化）", () => {
    draftManager.save("a", draftOf({ name: "甲" }));
    store.set(`${PREFIX}孤儿`, JSON.stringify({ name: "不在索引里" }));
    draftManager.clearAll();
    expect(store.has(`${PREFIX}a`)).toBe(false);
    expect(store.has(INDEX)).toBe(false);
    expect(store.get(`${PREFIX}孤儿`)).toBe('{"name":"不在索引里"}');
    // 后果写清楚：列表来自索引，所以这一格在界面上既看不见也删不掉。
    // 成因（配额下正文写了、索引没写）我没有复现出来，故只登记事实不判缺陷。
  });
});

describe("键形状", () => {
  it("草稿 id 是键的一部分：create_new 与 edit_<角色id> 改了就等于全员丢草稿", () => {
    expect(CREATE_DRAFT_ID).toBe("create_new");
    expect(editDraftId("c42")).toBe("edit_c42");
    draftManager.save(CREATE_DRAFT_ID, draftOf({ name: "甲" }));
    expect([...store.keys()]).toContain(`${PREFIX}create_new`);
  });
});
