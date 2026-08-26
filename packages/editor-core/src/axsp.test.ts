import { describe, expect, it } from "vitest";
import {
  AXSP_FORMAT,
  AXSP_VERSION,
  bundleToAxsp,
  collectAssetRefs,
  packAxsp,
  unpackAxsp,
} from "./axsp";
import type { ProjectBundle } from "./storage/types";

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

describe(".axsp 容器 v0", () => {
  it("pack → unpack 数据逐字段等价（验收标准）", () => {
    const packed = packAxsp(bundleToAxsp(bundle, ["assets/bg/station.png"]));
    expect(packed.ok).toBe(true);
    if (!packed.ok) return;

    const unpacked = unpackAxsp(packed.data);
    expect(unpacked.ok).toBe(true);
    if (!unpacked.ok) return;

    // 数据等价：工程束 JSON 逐字段一致
    expect(unpacked.data.project).toEqual(bundle);
    expect(unpacked.data.manifest.name).toBe("导出工程");
    expect(unpacked.data.manifest.format).toBe(AXSP_FORMAT);
    expect(unpacked.data.manifest.version).toBe(AXSP_VERSION);
    expect(unpacked.data.manifest.assets).toContain("assets/bg/station.png");
  });

  it("collectAssetRefs：bg/bgm/se 路径去重收集", () => {
    const refs = collectAssetRefs(bundle);
    expect(refs.sort()).toEqual([
      "assets/bg/station.png",
      "assets/bgm/main.mp3",
    ]);
  });

  it("corrupted：非法 JSON / 版本不符 / 缺 project 束", () => {
    const r1 = unpackAxsp("not json{");
    expect(r1.ok).toBe(false);
    if (!r1.ok) {
      expect(r1.error.code).toBe("corrupted");
      expect((r1.error as { detail: string }).detail).toContain("JSON");
    }

    const bad = {
      manifest: { format: AXSP_FORMAT, version: 99, name: "x", exportedAt: "", assets: [] },
      project: bundle,
    };
    const r2 = unpackAxsp(JSON.stringify(bad));
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.error.code).toBe("corrupted");
      expect((r2.error as { detail: string }).detail).toContain("版本");
    }

    const r3 = unpackAxsp(JSON.stringify({ manifest: { format: AXSP_FORMAT, version: 1 } }));
    expect(r3.ok).toBe(false);
    if (!r3.ok) {
      expect(r3.error.code).toBe("corrupted");
      expect((r3.error as { detail: string }).detail).toContain("project");
    }
  });
});

describe(".axsp 边界分支", () => {
  it("packAxsp 拒绝错误 format；unpack 拒绝非对象根", () => {
    const bad = packAxsp({
      manifest: { format: "other" as never, version: 1, name: "x", exportedAt: "", assets: [] },
      project: bundle,
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect((bad.error as { detail: string }).detail).toContain("format");

    const r = unpackAxsp("42");
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r.error as { detail: string }).detail).toContain("根不是对象");
  });

  it("collectAssetRefs：se 收集；无素材脚本返回空", () => {
    const withSe: ProjectBundle = {
      ...bundle,
      nodes: [
        {
          ...bundle.nodes[0]!,
          narrativeData: {
            title: "x",
            script: [
              { op: "se", sound: "assets/se/knock.wav" },
              { op: "say", speaker: "甲", text: "无素材" },
            ],
          },
        },
      ],
    };
    expect(collectAssetRefs(withSe)).toEqual(["assets/se/knock.wav"]);
    expect(collectAssetRefs({ ...bundle, nodes: [] })).toEqual([]);
  });
});
