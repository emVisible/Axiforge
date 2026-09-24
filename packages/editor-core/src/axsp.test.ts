import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  AXSP_FORMAT,
  AXSP_VERSION,
  collectAssetRefs,
  packAxsp,
  remapCharacterIds,
  unpackAxsp,
  unpackAxspV1,
} from "./axsp";
import type { ProjectBundle, StorageResult, StoredCharacter } from "./storage/types";

const bundle: ProjectBundle = {
  meta: { id: "proj-1", title: "导出工程", updatedAt: "2026-08-26T00:00:00Z" },
  axsSource: "# 开始\n旁白：x\n",
  nodes: [
    {
      id: "n1",
      stageId: "s1",
      editorData: { position: { x: 0, y: 0 } },
      narrativeData: {
        title: "开场",
        script: [
          { op: "bg", image: "assets/bg/station.png" },
          { op: "bgm", track: "assets/bgm/main.mp3", loop: true },
          { op: "say", speaker: "甲", text: "词" },
        ],
      },
      sortOrder: 0,
    },
  ],
  edges: [],
  scenes: [{ id: "s1", title: "主场景" }],
  roles: [{ id: "r1", characterRefId: "char-1" }],
};

const cast: StoredCharacter[] = [
  {
    id: "char-1",
    name: "凛",
    characterData: { sprites: { smile: "assets/lin-smile.png", sad: "/uploads/legacy.png" } },
    imagePath: "assets/lin.png",
  },
];

const assets: Record<string, Uint8Array> = {
  "assets/bg/station.png": new Uint8Array([1, 2, 3, 4]),
  "assets/lin.png": new Uint8Array([9, 8, 7]),
};

/** 失败语义取文案（判别联合：not_found 只有 entity/id） */
function detailOf(r: StorageResult<unknown>): string {
  if (r.ok) return "";
  const e = r.error;
  return e.code === "not_found" ? `${e.entity} ${e.id}` : e.detail;
}

/** 手工构造 zip 条目（绕过 pack 直测 unpack 的判定） */
function zipWithManifest(input: {
  manifest: Record<string, unknown>;
  project?: ProjectBundle;
  characters?: unknown[];
  extra?: Record<string, Uint8Array>;
}): Uint8Array {
  const enc = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));
  const entries: Record<string, Uint8Array> = { "manifest.json": enc(input.manifest) };
  if (input.project) entries["project.json"] = enc(input.project);
  if (input.characters) entries["characters.json"] = enc(input.characters);
  return zipSync({ ...entries, ...input.extra });
}

describe(".axsp 容器 v2", () => {
  it("pack → unpack：工程束、演员表、素材字节逐字段等价", () => {
    const packed = packAxsp({ project: bundle, characters: cast, assets });
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;

    const unpacked = unpackAxsp(packed.data);
    expect(unpacked.ok).toBe(true);
    if (!unpacked.ok) return;

    expect(unpacked.data.project).toEqual(bundle);
    expect(unpacked.data.characters).toEqual(cast);
    expect(Object.keys(unpacked.data.assets).sort()).toEqual([
      "assets/bg/station.png",
      "assets/lin.png",
    ]);
    expect(Array.from(unpacked.data.assets["assets/lin.png"]!)).toEqual([9, 8, 7]);
    expect(unpacked.data.manifest.format).toBe(AXSP_FORMAT);
    expect(unpacked.data.manifest.version).toBe(AXSP_VERSION);
    expect(unpacked.data.manifest.name).toBe("导出工程");
    expect(unpacked.data.manifest.characters).toEqual(["char-1"]);
  });

  it("zip 魔数即 v2；清单声明的素材不在包内 → corrupted", () => {
    const packed = packAxsp({ project: bundle, assets });
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;
    expect([packed.data[0], packed.data[1]]).toEqual([0x50, 0x4b]);

    const tampered = unpackAxsp(
      zipWithManifest({
        manifest: {
          format: AXSP_FORMAT,
          version: AXSP_VERSION,
          name: "x",
          exportedAt: "",
          assets: ["assets/ghost.png"],
          characters: [],
        },
        project: bundle,
        characters: [],
      }),
    );
    expect(tampered.ok).toBe(false);
    expect(detailOf(tampered)).toContain("ghost.png");
  });

  it("非本地 ref 不进包；无角色无素材仍可打包", () => {
    const packed = packAxsp({
      project: bundle,
      assets: {
        "/uploads/absolute.png": new Uint8Array([1]),
        "assets/ok.png": new Uint8Array([2]),
      },
    });
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;
    const unpacked = unpackAxsp(packed.data);
    expect(unpacked.ok && Object.keys(unpacked.data.assets)).toEqual(["assets/ok.png"]);

    const bare = packAxsp({ project: bundle });
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    const back = unpackAxsp(bare.data);
    expect(back.ok && back.data.characters).toEqual([]);
    expect(back.ok && back.data.project).toEqual(bundle);
  });

  it("缺 meta.id → io；版本不符 / 缺 project 条目 → corrupted", () => {
    const noId = packAxsp({ project: { ...bundle, meta: { ...bundle.meta, id: "" } } });
    expect(noId.ok).toBe(false);
    if (!noId.ok) expect(noId.error.code).toBe("io");

    const badVersion = unpackAxsp(
      zipWithManifest({
        manifest: {
          format: AXSP_FORMAT,
          version: 99,
          name: "x",
          exportedAt: "",
          assets: [],
          characters: [],
        },
        project: bundle,
      }),
    );
    expect(badVersion.ok).toBe(false);
    expect(detailOf(badVersion)).toContain("版本");

    const noProject = unpackAxsp(
      zipWithManifest({
        manifest: {
          format: AXSP_FORMAT,
          version: AXSP_VERSION,
          name: "x",
          exportedAt: "",
          assets: [],
          characters: [],
        },
      }),
    );
    expect(noProject.ok).toBe(false);
    expect(detailOf(noProject)).toContain("project.json");
  });
});

describe(".axsp v1 只读兼容", () => {
  const v1Text = JSON.stringify({
    manifest: {
      format: AXSP_FORMAT,
      version: 1,
      name: "旧包",
      exportedAt: "2026-08-26T00:00:00Z",
      assets: ["assets/bg/station.png"],
    },
    project: bundle,
  });

  it("v1 文本信封可打开，并归一化为 v2 束形态（无角色、无内嵌字节）", () => {
    const r = unpackAxsp(v1Text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.project).toEqual(bundle);
    expect(r.data.manifest.version).toBe(AXSP_VERSION);
    expect(r.data.manifest.name).toBe("旧包");
    expect(r.data.manifest.assets).toEqual(["assets/bg/station.png"]);
    expect(r.data.characters).toEqual([]);
    expect(r.data.assets).toEqual({});
  });

  it("非法 JSON / 版本非 1 / 缺 project → corrupted", () => {
    expect(unpackAxspV1("not json{").ok).toBe(false);
    const badVersion = unpackAxspV1(
      JSON.stringify({ manifest: { format: AXSP_FORMAT, version: 7 }, project: bundle }),
    );
    expect(badVersion.ok).toBe(false);
    expect(detailOf(badVersion)).toContain("版本");

    const noProject = unpackAxspV1(
      JSON.stringify({ manifest: { format: AXSP_FORMAT, version: 1 } }),
    );
    expect(noProject.ok).toBe(false);
    expect(detailOf(noProject)).toContain("project");
  });

  it("空包体与垃圾字节不抛异常", () => {
    expect(unpackAxsp(new Uint8Array([])).ok).toBe(false);
    expect(unpackAxsp(new Uint8Array([255, 254, 253])).ok).toBe(false);
  });
});

describe("remapCharacterIds（导入端角色换 id）", () => {
  const withRefs: ProjectBundle = {
    ...bundle,
    nodes: [
      {
        id: "n1",
        stageId: "s1",
        editorData: {},
        narrativeData: {
          title: "开场",
          codexScope: ["char-1"],
          script: [
            { op: "say", characterId: "char-1", text: "词" },
            { op: "show", characterId: "char-1", expression: "smile" },
            { op: "bg", image: "assets/bg/station.png" },
          ],
          condition: { type: "all", conditions: [{ type: "character_state", key: "char-1.mood", operator: "==", value: "happy" }] },
          effects: [{ type: "codex_write", key: "char-1.met_once", value: true }],
        },
        sortOrder: 0,
      },
    ],
    roles: [{ id: "r1", characterRefId: "char-1" }],
  };

  it("改写 characterId 直引、key 点号前缀、codexScope 与 roles", () => {
    const remapped = remapCharacterIds(withRefs, { "char-1": "NEW" });
    const nd = remapped.nodes[0]!.narrativeData as Record<string, unknown>;
    const script = nd.script as { characterId?: string; image?: string; op: string }[];
    expect(script[0]!.characterId).toBe("NEW");
    expect(script[1]!.characterId).toBe("NEW");
    expect(script[2]!.image).toBe("assets/bg/station.png");
    expect(nd.codexScope).toEqual(["NEW"]);
    const cond = nd.condition as { conditions: { key?: string }[] };
    expect(cond.conditions[0]!.key).toBe("NEW.mood");
    const effects = nd.effects as { key: string }[];
    expect(effects[0]!.key).toBe("NEW.met_once");
    expect(remapped.roles[0]!.characterRefId).toBe("NEW");
  });

  it("未命中的 id 与无点号 key 原样保留；空映射不复制对象", () => {
    const remapped = remapCharacterIds(withRefs, { other: "X" });
    const nd = remapped.nodes[0]!.narrativeData as Record<string, unknown>;
    expect((nd.script as { characterId?: string }[])[0]!.characterId).toBe("char-1");
    expect(remapped.roles[0]!.characterRefId).toBe("char-1");
    expect(remapCharacterIds(withRefs, {})).toBe(withRefs);
  });

  it("不改写原对象（值语义）", () => {
    remapCharacterIds(withRefs, { "char-1": "NEW" });
    const nd = withRefs.nodes[0]!.narrativeData as Record<string, unknown>;
    expect((nd.script as { characterId?: string }[])[0]!.characterId).toBe("char-1");
    expect(withRefs.roles[0]!.characterRefId).toBe("char-1");
  });
});

describe("collectAssetRefs", () => {
  it("bg/bgm/se 去重收集", () => {
    expect(collectAssetRefs(bundle).sort()).toEqual([
      "assets/bg/station.png",
      "assets/bgm/main.mp3",
    ]);
  });

  it("角色立绘与差分组一并收集；服务端绝对路径不算本地素材", () => {
    expect(collectAssetRefs({ ...bundle, nodes: [] }, cast).sort()).toEqual([
      "assets/lin-smile.png",
      "assets/lin.png",
    ]);
  });

  it("无脚本与无角色 → 空清单；角色无立绘 → 只剩节点素材", () => {
    expect(collectAssetRefs({ ...bundle, nodes: [] })).toEqual([]);
    expect(
      collectAssetRefs(bundle, [
        { id: "c", name: "n", characterData: {}, imagePath: null },
      ]).sort(),
    ).toEqual(["assets/bg/station.png", "assets/bgm/main.mp3"]);
  });
});
