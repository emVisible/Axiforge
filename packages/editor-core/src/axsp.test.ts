import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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
import { emptyProjectMetadata } from "./storage/types";

const bundle: ProjectBundle = {
  meta: {
    id: "proj-1",
    title: "导出工程",
    updatedAt: "2026-08-26T00:00:00Z",
    isPublic: false,
    ...emptyProjectMetadata(),
  },
  axsSource: "# 开始\n旁白：x\n",
  assetRefs: [],
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
    isPublic: false,
    authorId: "author-1",
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

/**
 * 现造一个"结构不合"的包：`assets` 走原样注入（不经过 JSON.stringify 的类型收窄），
 * `projectJson` 直接给**原始文本**——因为要测的正是"`project.json` 本身不是对象"，
 * 那道门必须由**解析之前**的形状校验拦住，夹具层做不到（`ProjectBundle` 类型不允许）。
 */
function zipWithManifestRaw(assetsPatch: Record<string, unknown>): Uint8Array {
  const enc = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));
  return zipSync({
    "manifest.json": enc({
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: "x",
      exportedAt: "",
      characters: [],
      ...assetsPatch,
    }),
    "project.json": enc(bundle),
    "characters.json": enc([]),
  });
}

/** `project.json` 塞一段原始文本（可以是 `null` / 数字这种非法束） */
function zipRaw(projectJson: string): Uint8Array {
  const enc = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));
  return zipSync({
    "manifest.json": enc({
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: "x",
      exportedAt: "",
      assets: [],
      characters: [],
    }),
    "project.json": new TextEncoder().encode(projectJson),
    "characters.json": enc([]),
  });
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

  /**
   * 2026-10-01 复审新增：结构不合的包必须返回 `corrupted`，**不许抛异常**。
   * `storage/types.ts` 的第一条设计裁决是「禁止异常穿越内核边界」，本模块开头也写着
   * 「结构不符=corrupted，绝不静默兜底」——而 `readJson` 只保证「能 parse」，
   * 于是 `for (… of manifest.data.assets)` 与 `project.data.meta?.id` 两处直接吃到外部 JSON。
   * 实测 6 个畸形形状里 **4 个抛 `TypeError`**：`assets` 缺席 / `= null` / `= 7` / `project.json` 是 `null`。
   * 可达性不是理论的：`importProjectFromAxsp` 调 `unpackAxsp` 没有 try，
   * 所以一台机器上截断或被改过的包，在导入那条路上是**未捕获的 promise 拒绝**，
   * 而调用方（工程列表页）只会 `alert` 一句看不懂的话。
   * 第五个形状（`assets` 是字符串）原先也不抛，但 `for…of` **逐字符迭代**，
   * 报出的是「清单缺素材 a」——字符串的第一个字符。误导性错误同样要修。
   *
   * 这条用 `zipSync` 现造包而不是改夹具：夹具只能证明代码与它自己一致。
   * 牙：撤掉那三处形状校验 ⇒ 4 个形状红（其中 `assets` 字符串那个红在 detail 上）。
   */
  it("结构不合的包一律返回 corrupted，不抛异常（禁止异常穿越内核边界）", () => {
    const shapes: [string, () => Uint8Array][] = [
      ["manifest.assets 缺席", () => zipWithManifestRaw({ assets: undefined })],
      ["manifest.assets = null", () => zipWithManifestRaw({ assets: null })],
      ["manifest.assets = 数字", () => zipWithManifestRaw({ assets: 7 })],
      ["manifest.assets = 字符串", () => zipWithManifestRaw({ assets: "assets/a.png" })],
      ["project.json = null", () => zipRaw("null")],
      ["project.json = 数字", () => zipRaw("7")],
    ];
    for (const [label, make] of shapes) {
      let out: StorageResult<unknown> | null = null;
      let thrown: string | null = null;
      try {
        out = unpackAxsp(make());
      } catch (e) {
        thrown = `${(e as Error).constructor.name}: ${(e as Error).message}`;
      }
      expect(`${label}: ${thrown ?? (out!.ok ? "ok:true" : "corrupted")}`).toBe(`${label}: corrupted`);
    }
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

  it("旧容器没有 assetRefs 键 → 解包处补成空数组（v2 与 v1 两个出口都要补）", () => {
    const legacy = { ...bundle } as Record<string, unknown>;
    delete legacy.assetRefs;
    const manifest = {
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: "旧包",
      exportedAt: "",
      assets: [],
      characters: [],
    };

    const v2 = unpackAxsp(zipWithManifest({ manifest, project: legacy as unknown as ProjectBundle, characters: [] }));
    expect(v2.ok).toBe(true);
    if (v2.ok) expect(v2.data.project.assetRefs).toEqual([]);

    const v1 = unpackAxspV1(
      JSON.stringify({ manifest: { ...manifest, version: 1 }, project: legacy }),
    );
    expect(v1.ok).toBe(true);
    if (v1.ok) expect(v1.data.project.assetRefs).toEqual([]);
  });

  /**
   * 2026-10-01 复审新增：**缺键**与**键在而形状错**必须分开。
   *
   * 上面那条钉的是「缺键 = 旧版本，补成 `[]`」；而原实现写的是
   * `Array.isArray(assetRefs) ? project : { …, assetRefs: [] }`
   * ——于是 `assetRefs` 是对象 / `null` / 字符串时**也**被归一成 `[]` 并返回 `ok:true`，
   * 与旧版本缺键**不可区分**。
   *
   * 代价不是"看起来干净"：这个字段**有消费者**（`axspImport.ts` 逐条 `addAssetRef`），
   * 归一等于**道具引用静默消失、零诊断**。所以形状错一律 `corrupted`。
   *
   * **同一天审出来的 `manifest.characters` 那条结论相反、且刻意不改**：
   * 那个字段**没有任何消费者**，在它上面加拒绝只会让书写松散的外部包导不进来。
   * **判据是「字段有没有消费者」，不是「看起来严不严」**——这条并排放在这里，
   * 就是为了让下一次有人改其中一条时知道另一条为什么是另一个答案。
   *
   * 两个出口（v2 / v1）都要盖：它们是同一个 `normalizeBundle`，漏一个就等于没修。
   */
  it("assetRefs 键在但不是数组 → corrupted（只有真的缺键才是旧版本）", () => {
    const base = { ...bundle } as Record<string, unknown>;
    const manifest = {
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: "坏包",
      exportedAt: "",
      assets: [],
      characters: [],
    };
    for (const bad of [{ oops: true }, null, "nope", 7]) {
      const broken = { ...base, assetRefs: bad };
      const v2 = unpackAxsp(
        zipWithManifest({ manifest, project: broken as unknown as ProjectBundle, characters: [] }),
      );
      expect(v2.ok).toBe(false);
      if (!v2.ok) expect(v2.error.code).toBe("corrupted");
      expect(detailOf(v2)).toContain("assetRefs");

      const v1 = unpackAxspV1(
        JSON.stringify({ manifest: { ...manifest, version: 1 }, project: broken }),
      );
      expect(v1.ok).toBe(false);
      if (!v1.ok) expect(v1.error.code).toBe("corrupted");
    }
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

  /**
   * 2026-10-01 复审新增：两处漏改，都在**跨机导入**这条用户承诺上，且都静默。
   *
   * ① `relationship` 的键是**三段**的 `charA.charB.field`——条件侧（`conditions.ts` 的
   *    `case "relationship"`）与效果侧（`applyEffects`）都按 `split(".")` 取
   *    `[charA, charB, field]`。而 `keyOf` 原先只重映射**第一个**分段，
   *    于是 `charB` 保留导出方机器上的 id：导入后那条关系挂在一个不存在的角色下，从此读写不到。
   * ② `actors` 是 `compiler.ts::extractActors` 里优先级最高的 `explicit` 覆盖值
   *    （作者可写的角色 id 列表），与已被重映射的 `codexScope` 完全同类，却没有分支。
   *
   * 两条都放在同一段 `narrativeData` 上做，是为了**一处改动同时验两件事**：
   * 分段查表（`keyOf`）与数组查表（`codexScope`/`actors`）是两条独立路径，
   * 混在一个用例里改坏一条会被另一条的红盖住。
   * 上面那条既有用例（`char-1.mood` → `NEW.mood`）是回归护栏：分段查表不许把 `.` 吃掉。
   */
  it("relationship 的 charB 与 actors 列表都要重映射（跨机后不留导出方 id）", () => {
    const twoRefs: ProjectBundle = {
      ...bundle,
      nodes: [
        {
          id: "n1",
          stageId: "s1",
          editorData: {},
          narrativeData: {
            title: "开场",
            codexScope: ["char-1", "char-2"],
            actors: ["char-1", "char-2"],
            script: [],
            trigger: { type: "relationship", key: "char-1.char-2.trust", operator: "gte", value: 3 },
            effects: [{ type: "relationship", key: "char-1.char-2.trust", value: 5 }],
          },
          sortOrder: 0,
        },
      ],
      roles: [
        { id: "r1", characterRefId: "char-1" },
        { id: "r2", characterRefId: "char-2" },
      ],
    };

    const remapped = remapCharacterIds(twoRefs, { "char-1": "NEW1", "char-2": "NEW2" });
    const nd = remapped.nodes[0]!.narrativeData as Record<string, unknown>;

    // 对照组：本来就被重映射的那一格
    expect(nd.codexScope).toEqual(["NEW1", "NEW2"]);
    // ① 三段键的中间那段也要换
    expect((nd.effects as { key: string }[])[0]!.key).toBe("NEW1.NEW2.trust");
    expect((nd.trigger as { key: string }).key).toBe("NEW1.NEW2.trust");
    // ② 作者可写的演员表
    expect(nd.actors).toEqual(["NEW1", "NEW2"]);
    // 一处都不许残留导出方的 id —— 这条才是"跨机后指向不存在的角色"的直接判据
    expect(JSON.stringify(nd)).not.toContain("char-1");
    expect(JSON.stringify(nd)).not.toContain("char-2");
  });

  /** 逐段查表不能误伤"首段是命名空间而不是角色 id"的那几族键 */
  it("命名空间首段原样保留（flag / memory / state / codex）", () => {
    const ns: ProjectBundle = {
      ...bundle,
      nodes: [
        {
          id: "n1",
          stageId: "s1",
          editorData: {},
          narrativeData: {
            title: "开场",
            script: [],
            trigger: { type: "all", conditions: [
              { type: "flag", key: "flag.door_open", operator: "eq", value: true },
              { type: "memory", key: "memory.score", operator: "gte", value: 3 },
              { type: "codex", key: "codex.char-1.met_once", operator: "eq", value: true },
            ] },
          },
          sortOrder: 0,
        },
      ],
      roles: [],
    };
    const nd = remapCharacterIds(ns, { "char-1": "NEW1" }).nodes[0]!
      .narrativeData as { trigger: { conditions: { key: string }[] } };
    const keys = nd.trigger.conditions.map((c) => c.key);
    expect(keys).toContain("flag.door_open");
    expect(keys).toContain("memory.score");
    // codex 那一族首段是命名空间、第二段才是角色 id ⇒ 只有第二段该换
    expect(keys).toContain("codex.NEW1.met_once");
  });
});

describe("collectAssetRefs", () => {
  it("bg/bgm/se 去重收集", () => {
    expect(collectAssetRefs(bundle).sort()).toEqual([
      "assets/bg/station.png",
      "assets/bgm/main.mp3",
    ]);
  });

  /**
   * 2026-10-01 复审新增：封面图此前**完全不在**这个函数里。
   * 后果是那条 ref 被序列化进 `project.json`、导入时又被原样写回，
   * 但字节从来没进过包（导出侧压根没对它调过 `readAsset`）——
   * 收件机上封面空白，而 `ok: true` 走完全程，零诊断。
   * 这与本模块已有的不变量正好是镜像：已声明的素材必须真在包里，而这一条是 ref 已声明、字节没跟。
   * 与上面三条一起看才完整：**去重**仍然成立（同一 ref 只出现一次）。
   */
  it("meta.coverImage 也要收集，且与服务端绝对路径区分开", () => {
    expect(
      collectAssetRefs({ ...bundle, meta: { ...bundle.meta, coverImage: "assets/cover.png" } }).sort(),
    ).toEqual(["assets/bg/station.png", "assets/bgm/main.mp3", "assets/cover.png"]);

    // 非本地 ref（服务端上传路径 / 外链）不进包——内核只对本地素材字节负责
    expect(
      collectAssetRefs({
        ...bundle,
        nodes: [],
        meta: { ...bundle.meta, coverImage: "/uploads/cover.png" },
      }),
    ).toEqual([]);
    expect(
      collectAssetRefs({
        ...bundle,
        nodes: [],
        meta: { ...bundle.meta, coverImage: "https://cdn.example.com/cover.png" },
      }),
    ).toEqual([]);
  });

  it("同一张封面同时被 meta 与节点引用时只出现一次", () => {
    const refs = collectAssetRefs({
      ...bundle,
      meta: { ...bundle.meta, coverImage: "assets/bg/station.png" },
    });
    expect(refs).toEqual(["assets/bg/station.png", "assets/bgm/main.mp3"]);
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
        { id: "c", name: "n", characterData: {}, imagePath: null, isPublic: false, authorId: null },
      ]).sort(),
    ).toEqual(["assets/bg/station.png", "assets/bgm/main.mp3"]);
  });
});

describe("真实随包 bundle 的导出往返（用户点「导出工程」走的正是这条路）", () => {
  // 上面那条 pack→unpack 等价钉的是合成夹具，seedShape / seedPlayable 钉的是「读进来的形状与可玩性」；
  // 两者之间的交叉没人守：**从随包示范作导入的工程，再导出时会不会丢内容**。
  // 这里刻意用真实文件而不是夹具——夹具只能证明代码与它自己一致。
  const dir = fileURLToPath(new URL("../../../apps/web/public/seeds", import.meta.url));
  const seeds = readdirSync(dir).filter((n) => n.endsWith(".axsp")).sort();

  it("三份示范作都在（目录为空就是假绿）", () => {
    expect(seeds).toHaveLength(3);
  });

  for (const name of seeds) {
    it(`${name}：导入 → 再导出 → 再读回，工程与角色表逐项不变`, () => {
      const imported = unpackAxsp(new Uint8Array(readFileSync(join(dir, name))));
      expect(imported.ok).toBe(true);
      if (!imported.ok) return;

      const repacked = packAxsp({
        project: imported.data.project,
        characters: imported.data.characters,
        assets: imported.data.assets,
      });
      expect(repacked.ok).toBe(true);
      if (!repacked.ok) return;

      const again = unpackAxsp(repacked.data);
      expect(again.ok).toBe(true);
      if (!again.ok) return;

      expect(again.data.project).toEqual(imported.data.project);
      expect(again.data.characters).toEqual(imported.data.characters);
      // 清单说有的素材必须真在包里，否则导入端读回时是一条 corrupted
      expect(again.data.manifest.assets).toEqual(imported.data.manifest.assets);
      expect(Object.keys(again.data.assets).sort()).toEqual(
        [...imported.data.manifest.assets].sort(),
      );
    });
  }
});
