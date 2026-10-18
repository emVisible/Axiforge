// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "@/shared/types/character";

const apiExport = vi.fn();
const readStories = vi.fn();
const readStory = vi.fn();
const renderPrompt = vi.fn(() => "# 正文");

vi.mock("@/shared/api/characters", () => ({
  characterApi: { export: (id: string) => apiExport(id) },
}));
vi.mock("@/shared/storage/storySaves", () => ({
  readStories: (id: string) => readStories(id),
  readStory: (id: string, storyId: string) => readStory(id, storyId),
}));
vi.mock("@/shared/lib/promptRenderer", () => ({
  renderCharacterPrompt: () => renderPrompt(),
}));

const { buildCharacterExport, characterExportDeps, composeCharacterMarkdown } = await import(
  "@/shared/storage/characterExport"
);

const CHARACTER = { id: "c-1", name: "夜", character_data: {} } as unknown as Character;

beforeEach(() => {
  apiExport.mockReset();
  readStories.mockReset();
  readStory.mockReset();
  renderPrompt.mockClear();
  characterExportDeps.isLocal = () => true;
});

describe("composeCharacterMarkdown", () => {
  it("传记与关系按段追加，段落之间留一行", () => {
    const md = composeCharacterMarkdown("# 正文", {
      stories: [{ title: "童年", content: "雪夜出生" }],
      relations: [{ relation_name: "妹妹", target_name: "朝" }],
    });
    expect(md).toContain("## 传记\n\n### 童年\n\n雪夜出生");
    expect(md).toContain("## 关系\n\n- 妹妹: 朝");
    expect(md.indexOf("## 关系")).toBeGreaterThan(md.indexOf("## 传记"));
  });

  it("两个域都空时正文一字不加（不留空标题）", () => {
    expect(composeCharacterMarkdown("# 正文", { stories: [], relations: [] })).toBe("# 正文");
  });

  it("畸形关系条目被滤掉，而不是写成 undefined: undefined", () => {
    const md = composeCharacterMarkdown("# 正文", {
      stories: [],
      relations: [{ relation_name: "妹妹" }, {}] as never,
    });
    expect(md).toBe("# 正文");
  });
});

describe("buildCharacterExport 本地支", () => {
  it("传记取自已分派的读写口，一次 /characters/*/export 都不发", async () => {
    readStories.mockResolvedValue([{ id: "s1", title: "童年" }, { id: "s2", title: "此后" }]);
    readStory
      .mockResolvedValueOnce({ title: "童年", content: "雪夜出生" })
      .mockResolvedValueOnce({ title: "此后", content: "长大" });

    const md = await buildCharacterExport(CHARACTER);

    expect(renderPrompt).toHaveBeenCalledTimes(1);
    expect(readStories).toHaveBeenCalledWith("c-1");
    expect(readStory).toHaveBeenCalledTimes(2);
    expect(apiExport).not.toHaveBeenCalled();
    expect(md).toContain("### 童年\n\n雪夜出生");
    expect(md).toContain("### 此后\n\n长大");
  });

  it("桌面没有关系域，导出就不含「## 关系」段", async () => {
    readStories.mockResolvedValue([]);
    const md = await buildCharacterExport(CHARACTER);
    expect(md).not.toContain("## 关系");
  });
});

describe("buildCharacterExport 远端支", () => {
  it("仍是那一次请求，不改成 N+1 次传记读", async () => {
    characterExportDeps.isLocal = () => false;
    apiExport.mockResolvedValue({
      stories: [{ title: "童年", content: "雪夜出生" }],
      relations: [{ relation_name: "妹妹", target_name: "朝" }],
    });

    const md = await buildCharacterExport(CHARACTER);

    expect(apiExport).toHaveBeenCalledTimes(1);
    expect(readStories).not.toHaveBeenCalled();
    expect(readStory).not.toHaveBeenCalled();
    expect(md).toContain("## 关系\n\n- 妹妹: 朝");
  });

  it("服务端没带 stories/relations 时不炸", async () => {
    characterExportDeps.isLocal = () => false;
    apiExport.mockResolvedValue({});
    await expect(buildCharacterExport(CHARACTER)).resolves.toBe("# 正文");
  });
});
