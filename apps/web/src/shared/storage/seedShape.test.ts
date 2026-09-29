// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { unpackAxsp } from "@axiforge/editor-core";
import { describe, expect, it } from "vitest";

/**
 * 随包示范作的**形状在册**（S13-6 事前核查查出来的那条漂移）。
 *
 * 不是内容校验、也不是"这些字段该有的都在"——恰恰相反：实测随包三份
 * `project.json` 只有 `axsSource/edges/meta/nodes/roles/scenes`，
 * 而后端权威定义 `seed_showcase.py:209` 给示范作① 写了 `play_meta.glossary`。
 * 也就是说包里那份内容不是按当前定义导出来的，两份已经不一致（见 REFACTOR_DESKTOP 的 S13-6 第 2 条）。
 *
 * 这份用例的作用是把漂移钉成一个**会变的清单**：
 * - 少了清单之外的字段 → 红（随包内容被进一步截断，比如导出器改了投影）；
 * - 清单里某字段"出现了" → 也红（说明真的重导过一次，那条已知漂移少了其一，
 *   要按 S13-6 的甲/乙定档后把这里改成相等断言，而不是留着当假漂移）。
 * 两头都会响，才不会变成一条只会自我确认的注释。
 */
const SEED_DIR = join(import.meta.dirname, "../../../public/seeds");

/** 示范作① 由后端 play_meta 带一条术语表，包里没有——这条就是已知漂移本身 */
const KNOWN_PRESENT = ["assetRefs", "axsSource", "edges", "meta", "nodes", "roles", "scenes"];
const KNOWN_ABSENT = ["playMeta"];

const projectOf = (file: string) => {
  const bytes = new Uint8Array(readFileSync(join(SEED_DIR, file)));
  const unpacked = unpackAxsp(bytes);
  if (!unpacked.ok) throw new Error(`${file} 解包失败：${unpacked.error.code}`);
  return unpacked.data.project;
};

describe("随包示范作的容器形状在册", () => {
  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith(".axsp"));

  it("三份示范作都在包里", () => {
    expect(files.sort()).toEqual(["showcase-1.axsp", "showcase-2.axsp", "showcase-3.axsp"]);
  });

  it("manifest 清单与目录里的包一一对应（播种按 manifest 取文件，多一项就是一条 404）", () => {
    const manifest = JSON.parse(readFileSync(join(SEED_DIR, "manifest.json"), "utf-8")) as unknown;
    expect(Array.isArray(manifest), "manifest 应为文件名数组").toBe(true);
    expect([...(manifest as string[])].sort()).toEqual(files);
  });

  for (const file of files) {
    it(`${file}：解包后的字段集不多不少`, () => {
      // 口径：这是 **normalizeBundle 之后**的键集。`assetRefs` 就是那一步补进来的空数组
      // （S13-2c 之前导出的容器没有这个键，缺键按"包内没有引用"补齐而非报错），
      // 所以"包里没有道具引用"由下面那条 `assetRefs 为空` 断言在册，而不是靠键名缺失。
      const project = projectOf(file) as unknown as Record<string, unknown>;
      expect(Object.keys(project).sort()).toEqual(KNOWN_PRESENT);
      for (const missing of KNOWN_ABSENT) expect(project).not.toHaveProperty(missing);
    });

    it(`${file}：包里没有道具引用（后端定义里有 play_meta，包里没有）`, () => {
      const project = projectOf(file) as unknown as { assetRefs: unknown[] };
      expect(project.assetRefs).toEqual([]);
    });
  }
});
