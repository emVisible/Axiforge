// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MemoryStorageProvider, unpackAxsp } from "@axiforge/editor-core";
import type { StoryPackage } from "@axiforge/core";
import type { AxspBundle } from "@axiforge/editor-core";
import { describe, expect, it } from "vitest";
import { importProjectFromAxsp } from "./index";
import { loadStoryOffline } from "./offlineStory";

/**
 * 随包示范作的**首启可玩**判据——桌面交付的就是「双击就有能玩的内容」这一件事，
 * 而它此前从没吃过真实随包字节：`offlineStory.test.ts` 用自建工程、
 * `desktopSeed.test.ts` 用自建的包，两份都是当场造出来的形状。
 * 于是 S13-2g 那个「导入整段丢掉舞台」只在播种路径上坏——自建的包本来就没有舞台，
 * 而示范作是 7 个节点挂在 2 个舞台上，导入后全部成了悬空 stageId（试玩没有任何场景/背景）。
 *
 * 判据一律**从包里反推**：包说有几个舞台、几个节点、几个角色，试玩就得有几个。
 * 不写死数量——示范作内容改了不该让这里红，内容在导入链路上丢了才该。
 */

const SEED_DIR = join(import.meta.dirname, "../../../public/seeds");

async function playShippedPackage(
  file: string,
): Promise<{ shipped: AxspBundle; pkg: StoryPackage }> {
  const bytes = new Uint8Array(readFileSync(join(SEED_DIR, file)));
  const unpacked = unpackAxsp(bytes);
  if (!unpacked.ok) throw new Error(`${file} 解包失败：${unpacked.error.code}`);

  const provider = new MemoryStorageProvider();
  const imported = await importProjectFromAxsp(provider, bytes);
  if (!imported.ok) throw new Error(`${file} 导入失败：${JSON.stringify(imported.error)}`);
  return { shipped: unpacked.data, pkg: await loadStoryOffline(imported.data.id, provider) };
}

describe("随包示范作首启可玩", () => {
  const files = readdirSync(SEED_DIR)
    .filter((f) => f.endsWith(".axsp"))
    .sort();

  it("目录里有示范作可玩（一条都没有=播种清单空了）", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    describe(file, () => {
      it("包里的舞台全部落地：标题逐项对得上，且不多出 createProject 自带的空舞台", async () => {
        const { shipped, pkg } = await playShippedPackage(file);
        expect(pkg.scenes.map((s) => s.title).sort()).toEqual(
          shipped.project.scenes.map((s) => s.title).sort(),
        );
      });

      it("每个节点都成 Beat，且挂着的舞台真的解析得到（不是悬空 stageId）", async () => {
        const { shipped, pkg } = await playShippedPackage(file);
        expect(pkg.beats).toHaveLength(shipped.project.nodes.length);
        /**
         * 2026-10-09 改连接键：导入侧现在**重映射节点身份**（`project_nodes.id` 是全局主键，
         * 不换就导不回本机——判据见 `packages/editor-core/src/axspReimport.test.ts`），
         * 所以这里不能再拿包内的原始 id 去 IR 里 join。
         * 覆盖一条没减：节点数、**有舞台的节点数 ↔ 有 sceneId 的 Beat 数**、每个 sceneId 都真在 scenes 里、
         * 且都有 sceneTitle。舞台解析那半的判据反而更宽——它是遍历全部 Beat，不再只遍历 join 得上的那些。
         */
        const withStage = shipped.project.nodes.filter((n) => n.stageId).length;
        const beatsWithScene = pkg.beats.filter((b) => b.sceneId);
        expect(beatsWithScene).toHaveLength(withStage);
        const sceneIds = new Set(pkg.scenes.map((s) => s.id));
        for (const beat of beatsWithScene) {
          expect(sceneIds.has(beat.sceneId ?? "")).toBe(true);
          expect(beat.sceneTitle).toBeTruthy();
        }
      });

      it("转场数与包内边数一致，开局 Beat 存在且每个 Beat 都有可演指令", async () => {
        const { shipped, pkg } = await playShippedPackage(file);
        expect(pkg.transitions).toHaveLength(shipped.project.edges.length);
        expect(pkg.beats.map((b) => b.id)).toContain(pkg.startBeatId);
        // 空 Beat 在播放器里=点不动的死页
        for (const beat of pkg.beats) expect(beat.script.length, `Beat ${beat.id} 没内容`).toBeGreaterThan(0);
        expect(pkg.beats.some((b) => b.isEnding), "示范作没有可到达的结局").toBe(true);
      });

      it("演员表随包落地：私有角色按引用解析，不因为「不是公开」而整条消失", async () => {
        const { shipped, pkg } = await playShippedPackage(file);
        expect(pkg.characters.map((c) => c.name).sort()).toEqual(
          shipped.characters.map((c) => c.name).sort(),
        );
      });

      /**
       * 已知漂移在册（与 `seedShape.test.ts` 同一口径，双向可红）：
       * 三份包都是 2026-09-26 之前从「meta 只有 id/title/updatedAt」的旧库导出的，
       * 所以随包内容缺工程元数据与舞台本体——缺的是**内容**，不是投影。
       * 这条断言的价值不是证明缺失存在，而是把缺失钉成清单：
       * S13-6 真按甲/乙定档重导一次之后，某个字段会有值、这一栏就会红，
       * 那时该把它从清单里摘掉并改成相等断言，而不是留着当假漂移。
       */
      it("随包内容仍然缺的那几项，一项不多一项不少（在册漂移）", async () => {
        const { shipped, pkg } = await playShippedPackage(file);
        const stillEmpty = [
          shipped.project.meta.description ? null : "工程描述",
          shipped.project.meta.worldSetting ? null : "世界观",
          pkg.scenes.some((s) => s.location) ? null : "舞台地点（包里只有 id/title）",
          pkg.scenes.some((s) => s.backgroundImage) ? null : "舞台背景",
          pkg.items?.length ? null : "道具清单（包内 assetRefs 为空）",
          pkg.glossary?.length ? null : "术语表（后端 play_meta 有，包里没有）",
          pkg.characters.some((c) => c.imagePath) ? null : "角色立绘",
        ].filter((v): v is string => v !== null);
        expect(stillEmpty.sort()).toEqual(
          [
            "世界观",
            "工程描述",
            "术语表（后端 play_meta 有，包里没有）",
            "舞台地点（包里只有 id/title）",
            "舞台背景",
            "角色立绘",
            "道具清单（包内 assetRefs 为空）",
          ].sort(),
        );
      });
    });
  }
});
